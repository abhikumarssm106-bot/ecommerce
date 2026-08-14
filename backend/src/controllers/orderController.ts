import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const { shippingAddressId, couponCode, notes } = req.body;

    // Get the user's cart and items
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return next(new AppError(400, 'Cannot place order with an empty cart', 'ORD_001'));
    }

    // Verify shipping address exists and belongs to user
    const address = await prisma.address.findFirst({
      where: { id: shippingAddressId, userId: req.user.userId },
    });

    if (!address) {
      return next(new AppError(400, 'Invalid shipping address selected', 'ORD_001'));
    }

    // Run order placement in transaction to prevent stock race conditions
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      // 1. Validate stock and calculate subtotal
      for (const item of cart.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant || variant.stock < item.quantity) {
          throw new AppError(
            400,
            `Insufficient stock for product variant: ${item.variant.sku}`,
            'PROD_002'
          );
        }

        // Deduct stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: variant.stock - item.quantity },
        });

        const unitPrice = variant.price.toNumber();
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        orderItemsData.push({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.variant.product.name,
          variantDetails: {
            size: item.variant.size,
            color: item.variant.color,
            sku: item.variant.sku,
          },
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        });
      }

      // 2. Validate Coupon if provided
      let discount = 0;
      let couponId: string | null = null;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode },
        });

        if (
          coupon &&
          coupon.isActive &&
          coupon.expiresAt > new Date() &&
          coupon.currentUsageCount < coupon.maxUsageCount &&
          subtotal >= coupon.minOrderAmount.toNumber()
        ) {
          couponId = coupon.id;
          if (coupon.type === 'PERCENTAGE') {
            discount = subtotal * (coupon.value.toNumber() / 100);
          } else {
            discount = coupon.value.toNumber();
          }
          discount = Math.min(discount, subtotal); // Cannot discount more than subtotal

          // Increment usage count
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { currentUsageCount: { increment: 1 } },
          });
        }
      }

      // 3. Compute final costs (shipping, tax)
      const shippingCost = subtotal >= 30 ? 0 : 2.99;
      const tax = (subtotal - discount) * 0.05; // 5% tax
      const total = subtotal - discount + shippingCost + tax;

      // 4. Create Order header
      const newOrder = await tx.order.create({
        data: {
          userId: req.user!.userId,
          status: 'PENDING',
          shippingAddressId,
          subtotal,
          shippingCost,
          discount,
          tax,
          total,
          couponId,
          notes,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: true,
        },
      });

      // 5. Clear cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: {
        orderItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: orders,
      message: 'Orders list retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
        payment: true,
      },
    });

    if (!order) {
      return next(new AppError(404, 'Order not found', 'ORD_002'));
    }

    // User can view their own order; admin can view any order
    if (order.userId !== req.user.userId && req.user.role === 'CUSTOMER') {
      return next(new AppError(403, 'You do not have access to view this order', 'AUTH_006'));
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order details retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required', 'AUTH_001'));
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order) {
      return next(new AppError(404, 'Order not found', 'ORD_002'));
    }

    // Only owner can cancel
    if (order.userId !== req.user.userId) {
      return next(new AppError(403, 'Forbidden', 'AUTH_006'));
    }

    if (order.status === 'SHIPPED' || order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return next(
        new AppError(
          400,
          `Cannot cancel order with status: ${order.status}`,
          'ORD_003'
        )
      );
    }

    // Update order status and restock inventory in transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Restore stock
      for (const item of order.orderItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and stock restored',
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order) {
      return next(new AppError(404, 'Order not found', 'ORD_002'));
    }

    // If transitioning to CANCELLED, restock
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });

        // Restore stock
        for (const item of order.orderItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    } else {
      await prisma.order.update({
        where: { id },
        data: { status },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
