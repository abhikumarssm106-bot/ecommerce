import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const { productId, rating, title, body } = req.body;

    if (rating < 1 || rating > 5) {
      return next(new AppError(400, 'Rating must be between 1 and 5 stars', 'REV_001'));
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return next(new AppError(404, 'Product not found', 'PROD_001'));
    }

    // Check if user has purchased the product (to flag as verified purchase)
    const matchingOrder = await prisma.order.findFirst({
      where: {
        userId: req.user.userId,
        status: 'DELIVERED',
        orderItems: {
          some: { productId },
        },
      },
    });

    const isVerifiedPurchase = !!matchingOrder;

    const review = await prisma.review.create({
      data: {
        userId: req.user.userId,
        productId,
        rating,
        title,
        body,
        isVerifiedPurchase,
        isApproved: false, // Moderated by default
      },
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully. It will be visible once approved by moderators.',
    });
  } catch (error) {
    next(error);
  }
};

export const moderateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body; // true or false

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return next(new AppError(404, 'Review not found', 'REV_002'));
    }

    await prisma.review.update({
      where: { id },
      data: { isApproved },
    });

    res.status(200).json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const { id } = req.params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return next(new AppError(404, 'Review not found', 'REV_002'));
    }

    // Check ownership or admin
    if (review.userId !== req.user.userId && req.user.role === 'CUSTOMER') {
      return next(new AppError(403, 'Forbidden', 'AUTH_006'));
    }

    await prisma.review.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
