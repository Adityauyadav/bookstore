import { Router } from "express";

import authMiddleware from "../../middleware/auth.middleware";
import validate from "../../middleware/validate";
import {
  cancelOrder,
  getOrder,
  getOrders,
  placeOrder,
} from "./orders.controller";
import { placeOrderSchema } from "./orders.schema";

const ordersRouter = Router();

ordersRouter.use(authMiddleware);

ordersRouter.post("/", validate(placeOrderSchema), placeOrder);
ordersRouter.get("/", getOrders);
ordersRouter.get("/:id", getOrder);
ordersRouter.post("/:id/cancel", cancelOrder);

export default ordersRouter;
