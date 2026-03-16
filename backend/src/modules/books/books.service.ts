import { Prisma } from "@prisma/client";
import type { infer as ZodInfer } from "zod";

import AppError from "../../lib/AppError";
import { deleteImage, uploadImage } from "../../lib/cloudinary";
import prisma from "../../lib/prisma";
import type { getBooksQuerySchema } from "./books.schema";

type CreateBookInput = {
  title: string;
  author: string;
  isbn: string;
  description?: string;
  price: number;
  genreId: string;
  stock: number;
};

type UpdateBookInput = Partial<CreateBookInput>;

type UpdateStockInput = {
  quantity: number;
  type: "absolute" | "delta";
};

type GetBooksQueryInput = ZodInfer<typeof getBooksQuerySchema>;

type FileLike = {
  buffer: Buffer;
};

const getGenreOrThrow = async (genreId: string) => {
  const genre = await prisma.genre.findUnique({
    where: { id: genreId },
  });

  if (!genre) {
    throw new AppError("Genre not found", 404, "GENRE_NOT_FOUND");
  }

  return genre;
};

const getBookOrThrow = async (id: string) => {
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      genre: true,
    },
  });

  if (!book) {
    throw new AppError("Book not found", 404, "BOOK_NOT_FOUND");
  }

  return book;
};

export const getAllBooks = async (query: Partial<GetBooksQueryInput> = {}) => {
  const {
    q,
    genre,
    author,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
  } = query;

  const where: Prisma.BookWhereInput = {};

  if (q) {
    where.OR = [
      {
        title: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        author: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        isbn: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: q,
          mode: "insensitive",
        },
      },
      {
        genre: {
          name: {
            contains: q,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (genre) {
    where.genre = {
      is: {
        slug: genre,
      },
    };
  }

  if (author) {
    where.author = {
      contains: author,
      mode: "insensitive",
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};

    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }

    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  const [books, total] = await prisma.$transaction([
    prisma.book.findMany({
      where,
      include: {
        genre: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.book.count({ where }),
  ]);

  return {
    books,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getBookById = async (id: string) => getBookOrThrow(id);

export const createBook = async (data: CreateBookInput, file?: FileLike) => {
  if (!file) {
    throw new AppError("Cover image is required", 400, "COVER_IMAGE_REQUIRED");
  }

  await getGenreOrThrow(data.genreId);

  const existingBook = await prisma.book.findFirst({
    where: {
      isbn: data.isbn,
    },
  });

  if (existingBook) {
    throw new AppError("Book already exists", 409, "BOOK_ALREADY_EXISTS");
  }

  const uploadedImage = await uploadImage(file);

  try {
    return await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        description: data.description,
        price: data.price,
        genreId: data.genreId,
        stock: data.stock,
        coverImageUrl: uploadedImage.url,
        coverPublicId: uploadedImage.publicId,
      },
      include: {
        genre: true,
      },
    });
  } catch (error) {
    await deleteImage(uploadedImage.publicId);
    throw error;
  }
};

export const updateBook = async (
  id: string,
  data: UpdateBookInput,
  file?: FileLike,
) => {
  const existingBook = await getBookOrThrow(id);

  if (data.genreId) {
    await getGenreOrThrow(data.genreId);
  }

  if (data.isbn && data.isbn !== existingBook.isbn) {
    const duplicateIsbnBook = await prisma.book.findFirst({
      where: {
        isbn: data.isbn,
        NOT: {
          id,
        },
      },
    });

    if (duplicateIsbnBook) {
      throw new AppError("Book already exists", 409, "BOOK_ALREADY_EXISTS");
    }
  }

  let uploadedImage:
    | {
        url: string;
        publicId: string;
      }
    | undefined;

  if (file) {
    uploadedImage = await uploadImage(file);
  }

  try {
    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        description: data.description,
        price: data.price,
        genreId: data.genreId,
        stock: data.stock,
        coverImageUrl: uploadedImage?.url,
        coverPublicId: uploadedImage?.publicId,
      },
      include: {
        genre: true,
      },
    });

    if (uploadedImage) {
      await deleteImage(existingBook.coverPublicId);
    }

    return updatedBook;
  } catch (error) {
    if (uploadedImage) {
      await deleteImage(uploadedImage.publicId);
    }
    throw error;
  }
};

export const deleteBook = async (id: string) => {
  const existingBook = await getBookOrThrow(id);

  await prisma.book.delete({
    where: { id },
  });

  await deleteImage(existingBook.coverPublicId);
};

export const updateBookStock = async (id: string, data: UpdateStockInput) => {
  const existingBook = await getBookOrThrow(id);

  const nextStock =
    data.type === "absolute" ? data.quantity : existingBook.stock + data.quantity;

  if (nextStock < 0) {
    throw new AppError("Stock cannot be negative", 400, "INVALID_STOCK");
  }

  return prisma.book.update({
    where: { id },
    data: {
      stock: nextStock,
    },
    include: {
      genre: true,
    },
  });
};
