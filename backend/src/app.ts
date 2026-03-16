import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import logger from "./config/logger";
import errorMiddleware from "./middleware/error.middleware";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use(errorMiddleware);

export default app;
