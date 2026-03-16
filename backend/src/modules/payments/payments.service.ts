import crypto from "crypto";

import env from "../../config/env";
import AppError from "../../lib/AppError";
import prisma from "../../lib/prisma";

export const verifyPayment = async (
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) => {
  const payment = await prisma.payment.findFirst({
    where: {
      razorpayOrderId,
    },
    include: {
      order: {
        include: {
          items: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  author: true,
                  coverImageUrl: true,
                  stock: true,
                },
              },
            },
          },
          payment: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  if (payment.order.userId !== userId) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "FAILED",
        razorpayPaymentId,
        razorpaySignature,
      },
    });

    throw new AppError(
      "Payment verification failed",
      400,
      "PAYMENT_VERIFICATION_FAILED",
    );
  }

  const [, updatedOrder] = await prisma.$transaction([
    prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "SUCCESS",
        razorpayPaymentId,
        razorpaySignature,
      },
    }),
    prisma.order.update({
      where: {
        id: payment.orderId,
      },
      data: {
        status: "CONFIRMED",
      },
      include: {
        items: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                coverImageUrl: true,
                stock: true,
              },
            },
          },
        },
        payment: true,
      },
    }),
  ]);

  return updatedOrder;
};
