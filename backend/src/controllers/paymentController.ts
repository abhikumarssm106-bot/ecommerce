import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, provider, providerOrderId, providerPaymentId, providerSignature } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return next(new AppError(404, 'Order not found', 'ORD_002'));
    }

    // Capture payment details and transition order to PAID status
    await prisma.$transaction(async (tx) => {
      // Check if payment already exists
      const existingPayment = await tx.payment.findUnique({
        where: { orderId },
      });

      if (existingPayment) {
        throw new AppError(400, 'Payment already processed for this order', 'PAY_003');
      }

      await tx.payment.create({
        data: {
          orderId,
          provider, // 'RAZORPAY' or 'STRIPE'
          providerOrderId,
          providerPaymentId: providerPaymentId || `pay_mock_${Date.now()}`,
          providerSignature: providerSignature || 'sig_mock_ok',
          amount: order.total,
          status: 'SUCCESS',
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and captured successfully. Order status updated to PAID.',
    });
  } catch (error) {
    next(error);
  }
};
