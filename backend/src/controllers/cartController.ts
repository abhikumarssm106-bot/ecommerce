import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

// Helper to calculate cart sums
const calculateCartTotals = (items: any[]) => {
  const subtotal = items.reduce((sum, item) => {
    const price = item.variant.price.toNumber();
    return sum + price * item.quantity;
  }, 0);

  // Free shipping threshold at 30 units (matching frontend's $30 limit)
  const shipping = subtotal >= 30 ? 0 : subtotal > 0 ? 2.99 : 0;
  // Tax rate of 5% on subtotal (as an example, or GST)
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: { where: { isPrimary: true }, take: 1 },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.userId },
        include: { items: true },
      }) as any;
    }

    const items = (cart?.items || []).map((item: any) => {
      const price = item.variant.price.toNumber();
      const primaryImage = item.variant.product.images[0]?.url || '';

      return {
        itemId: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.variant.product.name,
        variantName: item.variant.size || item.variant.color || '',
        price,
        quantity: item.quantity,
        subtotal: price * item.quantity,
        imageUrl: primaryImage,
      };
    });

    const totals = calculateCartTotals(cart?.items || []);

    res.status(200).json({
      success: true,
      data: {
        cartId: cart?.id,
        items,
        totals,
      },
      message: 'Cart retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const { variantId, quantity = 1 } = req.body;

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return next(new AppError(404, 'Product variant not found', 'PROD_001'));
    }

    if (variant.stock < quantity) {
      return next(new AppError(400, 'Insufficient inventory stock', 'PROD_002'));
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.userId },
      });
    }

    // Create or update item
    await prisma.cartItem.upsert({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variant.id,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        quantity,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { variant: true, cart: true },
    });

    if (!item) {
      return next(new AppError(404, 'Cart item not found', 'CART_001'));
    }

    // Secure check: only owner can edit their cart
    if (item.cart.userId !== req.user.userId) {
      return next(new AppError(403, 'Forbidden', 'AUTH_006'));
    }

    if (item.variant.stock < quantity) {
      return next(new AppError(400, 'Insufficient inventory stock', 'PROD_002'));
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: Math.max(1, quantity) },
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const { itemId } = req.params;

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item) {
      return next(new AppError(404, 'Cart item not found', 'CART_001'));
    }

    if (item.cart.userId !== req.user.userId) {
      return next(new AppError(403, 'Forbidden', 'AUTH_006'));
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};
