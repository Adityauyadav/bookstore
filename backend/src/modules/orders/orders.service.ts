import { Prisma } from "@prisma/client";

import razorpay from "../../config/razorpay";
import AppError from "../../lib/AppError";
import prisma from "../../lib/prisma";

type ShippingAddress = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

const getCartWithItems = async (userId: string) =>
  prisma.cart.findUnique({
    where: {
      userId,
    },
    include: {
      items: {
        include: {
          book: true,
        },
      },
    },
  });

const getOrderWithDetails = async (orderId: string) =>
  prisma.order.findUnique({
    where: {
      id: orderId,
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
  });

export const placeOrder = async (userId: string, shippingAddress: ShippingAddress) => {
  const cart = await getCartWithItems(userId);

  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400, "CART_EMPTY");
  }

  for (const item of cart.items) {
    if (item.book.stock < item.quantity) {
      throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK");
    }
  }

  const totalAmount = cart.items.reduce(
    (total, item) =>
      total.plus(new Prisma.Decimal(item.book.price).mul(item.quantity)),
    new Prisma.Decimal(0),
  );

  const razorpayOrder = await razorpay.orders.create({
    amount: totalAmount.mul(100).toNumber(),
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        shippingAddress,
      },
    });

    await tx.orderItem.createMany({
      data: cart.items.map((item) => ({
        orderId: order.id,
        bookId: item.bookId,
        quantity: item.quantity,
        priceAtPurchase: item.book.price,
      })),
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId: razorpayOrder.id,
        status: "PENDING",
        amount: totalAmount,
      },
    });

    for (const item of cart.items) {
      await tx.book.update({
        where: {
          id: item.bookId,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    const createdOrder = await tx.order.findUniqueOrThrow({
      where: {
        id: order.id,
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
              },
            },
          },
        },
        payment: true,
      },
    });

    return {
      ...createdOrder,
      razorpayOrderId: razorpayOrder.id,
    };
  });
};

export const getUserOrders = async (userId: string, page: number, limit: number) => {
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
        payment: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    orders: orders.map((order) => ({
      ...order,
      itemCount: order._count.items,
      paymentStatus: order.payment?.status ?? "PENDING",
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getOrderById = async (userId: string, orderId: string) => {
  const order = await getOrderWithDetails(orderId);

  if (!order) {
    throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  if (order.userId !== userId) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  return order;
};

export const cancelOrder = async (userId: string, orderId: string) => {
  const order = await getOrderById(userId, orderId);

  if (!["PENDING", "CONFIRMED"].includes(order.status)) {
    throw new AppError(
      "Order cannot be cancelled",
      400,
      "ORDER_NOT_CANCELLABLE",
    );
  }

  return prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.book.update({
        where: {
          id: item.bookId,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    return tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "CANCELLED",
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
    });
  });
};

export const getAdminOrders = async (
  page: number,
  limit: number,
  status?: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED",
) => {
  const where: Prisma.OrderWhereInput = {};

  if (status) {
    where.status = status;
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
        payment: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((order) => ({
      ...order,
      itemCount: order._count.items,
      paymentStatus: order.payment?.status ?? "PENDING",
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAdminOrderById = async (orderId: string) => {
  const order = await getOrderWithDetails(orderId);

  if (!order) {
    throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  return prisma.order.findUniqueOrThrow({
    where: {
      id: orderId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
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
  });
};

export const updateOrderStatus = async (
  orderId: string,
  status: "CONFIRMED" | "SHIPPED" | "DELIVERED",
) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  const validTransitions: Record<string, string[]> = {
    CONFIRMED: ["SHIPPED"],
    SHIPPED: ["DELIVERED"],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    throw new AppError(
      "Invalid status transition",
      400,
      "INVALID_STATUS_TRANSITION",
    );
  }

  return prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
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
  });
};
