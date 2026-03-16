import { type RequestHandler } from "express";

import AppError from "../../lib/AppError";
import {
  cancelOrder as cancelOrderService,
  getOrderById,
  getUserOrders,
  placeOrder as placeOrderService,
} from "./orders.service";

const getUserIdOrThrow = (userId?: string) => {
  if (!userId) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return userId;
};

export const placeOrder: RequestHandler = async (req, res, next) => {
  try {
    const order = await placeOrderService(
      getUserIdOrThrow(req.user?.id),
      req.body.shippingAddress,
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders: RequestHandler = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const orders = await getUserOrders(getUserIdOrThrow(req.user?.id), page, limit);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrder: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const order = await getOrderById(getUserIdOrThrow(req.user?.id), req.params.id);

    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder: RequestHandler<{ id: string }> = async (req, res, next) => {
  try {
    const order = await cancelOrderService(getUserIdOrThrow(req.user?.id), req.params.id);

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
