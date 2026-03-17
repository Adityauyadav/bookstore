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
export const adminBooksRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

booksRouter.get("/", listBooks);
booksRouter.get("/:id", getBook);

const adminBookMiddlewares = [authMiddleware, requireAdmin] as const;

booksRouter.post(
  "/",
  ...adminBookMiddlewares,
  upload.single("coverImage"),
  validate(createBookSchema),
  createBook,
);
booksRouter.patch(
  "/:id",
  ...adminBookMiddlewares,
  upload.single("coverImage"),
  validate(updateBookSchema),
  updateBook,
);
booksRouter.patch(
  "/:id/stock",
  ...adminBookMiddlewares,
  validate(updateStockSchema),
  updateBookStock,
);
booksRouter.delete("/:id", ...adminBookMiddlewares, deleteBook);

adminBooksRouter.use(...adminBookMiddlewares);
adminBooksRouter.post(
  "/",
  upload.single("coverImage"),
  validate(createBookSchema),
  createBook,
);
adminBooksRouter.put(
  "/:id",
  upload.single("coverImage"),
  validate(updateBookSchema),
  updateBook,
);
adminBooksRouter.patch(
  "/:id",
  upload.single("coverImage"),
  validate(updateBookSchema),
  updateBook,
);
adminBooksRouter.patch("/:id/stock", validate(updateStockSchema), updateBookStock);
adminBooksRouter.delete("/:id", deleteBook);

export default booksRouter;
