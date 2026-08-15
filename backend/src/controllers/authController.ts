import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'megamart_jwt_access_secret_super_secure_key_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'megamart_jwt_refresh_secret_super_secure_key_2026';

// Helper to sign access token
const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

// Helper to sign refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, salt: Math.random().toString(36).substring(2) },
    REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
  );
};

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError(400, 'This email is already associated with an account.', 'AUTH_004'));
    }

    // Hash the password with cost factor 12
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        isEmailVerified: true, // For development ease, verify immediately
      },
    });

    res.status(201).json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
      message: 'User registered successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new AppError(401, 'Invalid email or password provided', 'AUTH_003'));
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError(401, 'Invalid email or password provided', 'AUTH_003'));
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    // Set HTTP-only secure cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return next(new AppError(401, 'Refresh token missing', 'AUTH_001'));
    }

    // Verify token signature
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    } catch {
      return next(new AppError(401, 'Invalid or expired refresh token', 'AUTH_002'));
    }

    // Check token in DB
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!dbToken || dbToken.isRevoked || dbToken.expiresAt < new Date()) {
      // Refresh token reuse/theft detection: revoke all tokens if reuse detected
      if (dbToken && dbToken.isRevoked) {
        await prisma.refreshToken.updateMany({
          where: { userId: dbToken.userId },
          data: { isRevoked: true },
        });
      }
      return next(new AppError(401, 'Invalid or revoked refresh token session', 'AUTH_002'));
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(dbToken.user.id, dbToken.user.role);
    const newRefreshToken = generateRefreshToken(dbToken.user.id);

    // Revoke old refresh token, save new one
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { isRevoked: true },
    });

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await prisma.refreshToken.create({
      data: {
        userId: dbToken.user.id,
        token: newRefreshToken,
        expiresAt: newExpiresAt,
      },
    });

    // Set new HTTP-only secure cookie
    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      // Mark token as revoked in DB
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    }

    // Clear client cookie
    res.clearCookie('refreshToken', {
      path: '/api/v1/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated', 'AUTH_001'));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        addresses: true,
      },
    });

    if (!user) {
      return next(new AppError(404, 'User not found', 'AUTH_007'));
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const { firstName, lastName, line1, line2, city, state, pincode, country, isDefault } = req.body;

    // If setting as default, unset previous default addresses
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.userId,
        firstName,
        lastName,
        line1,
        line2,
        city,
        state,
        pincode,
        country,
        isDefault: !!isDefault,
      },
    });

    res.status(201).json({
      success: true,
      data: address,
      message: 'Address added successfully',
    });
  } catch (error) {
    next(error);
  }
};
