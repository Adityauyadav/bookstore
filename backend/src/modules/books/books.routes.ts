import multer from "multer";
import { Router } from "express";

import authMiddleware, { requireAdmin } from "../../middleware/auth.middleware";
import validate from "../../middleware/validate";
import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  updateBook,
  updateBookStock,
} from "./books.controller";
import {
  createBookSchema,
  updateBookSchema,
  updateStockSchema,
} from "./books.schema";

const booksRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

booksRouter.get("/", listBooks);
booksRouter.get("/:id", getBook);
booksRouter.post(
  "/",
  authMiddleware,
  requireAdmin,
  upload.single("coverImage"),
  validate(createBookSchema),
  createBook,
);
booksRouter.patch(
  "/:id",
  authMiddleware,
  requireAdmin,
  upload.single("coverImage"),
  validate(updateBookSchema),
  updateBook,
);
booksRouter.patch(
  "/:id/stock",
  authMiddleware,
  requireAdmin,
  validate(updateStockSchema),
  updateBookStock,
);
booksRouter.delete("/:id", authMiddleware, requireAdmin, deleteBook);

export default booksRouter;
