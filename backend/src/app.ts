import cors from "cors";
import express, { type RequestHandler } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import authRouter from "./auth/auth.routes";
import logger from "./config/logger";
import errorMiddleware from "./middleware/error.middleware";
import { globalRateLimiter } from "./middleware/rateLimiter";
import booksRouter from "./modules/books/books.routes";
import cartRouter from "./modules/cart/cart.routes";
import genresRouter from "./modules/genres/genres.routes";
import ordersRouter from "./modules/orders/orders.routes";

const app = express();

const cookieParser: RequestHandler = (req, res, next) => {
  void res;

  req.cookies = Object.fromEntries(
    (req.headers.cookie ?? "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf("=");
        const key = cookie.slice(0, separatorIndex);
        const value = cookie.slice(separatorIndex + 1);

        return [key, decodeURIComponent(value)];
      }),
  );

  next();
};

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser);
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(globalRateLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/books", booksRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/genres", genresRouter);
app.use("/api/v1/orders", ordersRouter);

app.use(errorMiddleware);

export default app;
