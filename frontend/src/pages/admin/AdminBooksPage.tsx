import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { getGenres } from "../../api/admin.api";
import {
  createBook,
  deleteBook,
  getBooks,
  updateBook,
} from "../../api/books.api";
import type { ApiErrorResponse, Book, Genre } from "../../types";

type BookFormState = {
  title: string;
  author: string;
  isbn: string;
  description: string;
  price: string;
  genreId: string;
  stock: string;
  coverImage: File | null;
};

const initialForm: BookFormState = {
  title: "",
  author: "",
  isbn: "",
  description: "",
  price: "",
  genreId: "",
  stock: "",
  coverImage: null,
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const buildBookFormData = (form: BookFormState, includeImage: boolean) => {
  const formData = new FormData();
  formData.append("title", form.title);
  formData.append("author", form.author);
  formData.append("isbn", form.isbn);
  formData.append("description", form.description);
  formData.append("price", form.price);
  formData.append("genreId", form.genreId);
  formData.append("stock", form.stock);

  if (includeImage && form.coverImage) {
    formData.append("coverImage", form.coverImage);
  }

  return formData;
};

export default function AdminBooksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState<BookFormState>(initialForm);
  const [formError, setFormError] = useState("");

  const { data: booksData, isLoading } = useQuery({
    queryKey: ["admin-books", search, selectedGenre],
    queryFn: () =>
      getBooks({
        q: search || undefined,
        genre: selectedGenre || undefined,
        limit: 50,
      }),
  });

  const { data: genresData } = useQuery({
    queryKey: ["genres"],
    queryFn: getGenres,
  });

  const books = booksData?.data.books ?? [];
  const genres = genresData?.data ?? [];

  const resetForm = () => {
    setEditingBook(null);
    setForm(initialForm);
    setFormError("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (
        !form.title ||
        !form.author ||
        !form.isbn ||
        !form.price ||
        !form.genreId ||
        !form.stock
      ) {
        throw new Error("Please complete all required fields.");
      }

      if (!editingBook && !form.coverImage) {
        throw new Error("Cover image is required for a new book.");
      }

      if (editingBook) {
        return updateBook(
          editingBook.id,
          buildBookFormData(form, Boolean(form.coverImage)),
        );
      }

      return createBook(buildBookFormData(form, true));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      resetForm();
    },
    onError: (error) => {
      const apiError = error as AxiosError<ApiErrorResponse>;
      setFormError(
        apiError.response?.data?.message ??
          (error as Error).message ??
          "Unable to save this book.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      void queryClient.invalidateQueries({ queryKey: ["books"] });
      setFormError("");
    },
    onError: (error) => {
      const apiError = error as AxiosError<ApiErrorResponse>;
      setFormError(
        apiError.response?.data?.message ?? "Unable to delete this book.",
      );
    },
  });

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description ?? "",
      price: String(book.price),
      genreId: book.genreId,
      stock: String(book.stock),
      coverImage: null,
    });
    setFormError("");
  };

  const inventorySummary = useMemo(
    () => ({
      totalBooks: booksData?.data.total ?? books.length,
      lowStock: books.filter((book) => book.stock < 10).length,
    }),
    [books, booksData],
  );

  return (
    <div className="flex flex-col xl:grid xl:h-full min-h-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_24rem]">
      <section className="flex xl:min-h-0 flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-black/8 bg-[#fbf8f2] p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
              Inventory
            </p>
            <p className="mt-3 font-serif text-3xl text-text-primary">
              {inventorySummary.totalBooks}
            </p>
          </div>
          <div className="rounded-3xl border border-black/8 bg-[#fbf8f2] p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
              Low stock
            </p>
            <p className="mt-3 font-serif text-3xl text-[#8f2d22]">
              {inventorySummary.lowStock}
            </p>
          </div>
          <div className="rounded-3xl border border-black/8 bg-[#fbf8f2] p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
              Genres
            </p>
            <p className="mt-3 font-serif text-3xl text-text-primary">
              {genres.length}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-[1.75rem] border border-black/8 bg-[#fbf8f2] p-5">
          <div className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search books by title, author, ISBN..."
              className="h-12 flex-1 rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition-all focus:border-black/20 focus:shadow-sm"
            />
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(event) => setSelectedGenre(event.target.value)}
                className="h-12 appearance-none rounded-2xl border border-black/10 bg-white pl-4 pr-14 text-sm outline-none transition-all focus:border-black/20 focus:shadow-sm"
              >
                <option value="">All genres</option>
                {genres.map((genre: Genre) => (
                  <option key={genre.id} value={genre.slug}>
                    {genre.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <ChevronDown size={16} className="text-text-muted" />
              </span>
            </div>
          </div>

          <div className="mt-7 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-[1.25rem] bg-white"
                  />
                ))
              : books.map((book) => (
                  <article
                    key={book.id}
                    className="grid gap-4 rounded-[1.25rem] border border-black/8 bg-white p-4 md:grid-cols-[4.5rem_minmax(0,1fr)_auto]"
                  >
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="aspect-3/4 w-18 rounded-[0.9rem] object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-serif text-2xl text-text-primary">
                        {book.title}
                      </p>
                      <p className="mt-1 text-sm text-text-muted">
                        {book.author} · {book.genre?.name ?? "Uncategorised"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-text-muted">
                        <span>{formatPrice(Number(book.price))}</span>
                        <span>Stock {book.stock}</span>
                        <span className="truncate">ISBN {book.isbn}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 md:flex-col">
                      <button
                        type="button"
                        onClick={() => handleEdit(book)}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f8f4ee] px-3 py-2 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const shouldDelete = window.confirm(
                            `Delete "${book.title}" from the catalog?`,
                          );

                          if (!shouldDelete) {
                            return;
                          }

                          setFormError("");
                          deleteMutation.mutate(book.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-full border border-[#8f2d22]/15 bg-[#f8ece8] px-3 py-2 text-sm text-[#8f2d22] transition-all hover:-translate-y-0.5"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
          </div>
        </div>
      </section>

      <aside className="sticky top-0 h-fit max-h-full overflow-y-auto rounded-[1.75rem] border border-black/8 bg-[#fbf8f2] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
              {editingBook ? "Update book" : "Add book"}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-text-primary">
              {editingBook ? "Edit inventory" : "New title"}
            </h2>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
          >
            <Plus size={16} className={editingBook ? "rotate-45" : ""} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {formError ? (
            <div className="rounded-2xl border border-[#8f2d22]/15 bg-[#f8ece8] px-4 py-3 text-sm text-[#8f2d22]">
              {formError}
            </div>
          ) : null}
          <input
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Title"
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition-all focus:border-black/20 focus:shadow-sm"
          />
          <input
            value={form.author}
            onChange={(event) =>
              setForm((current) => ({ ...current, author: event.target.value }))
            }
            placeholder="Author"
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition-all focus:border-black/20 focus:shadow-sm"
          />
          <input
            value={form.isbn}
            onChange={(event) =>
              setForm((current) => ({ ...current, isbn: event.target.value }))
            }
            placeholder="ISBN"
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition-all focus:border-black/20 focus:shadow-sm"
          />
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Description"
            rows={4}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-black/20 focus:shadow-sm"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
              placeholder="Price"
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition-all focus:border-black/20 focus:shadow-sm"
            />
            <input
              value={form.stock}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  stock: event.target.value,
                }))
              }
              placeholder="Stock"
              className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition-all focus:border-black/20 focus:shadow-sm"
            />
          </div>
          <select
            value={form.genreId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                genreId: event.target.value,
              }))
            }
            className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none transition-all focus:border-black/20 focus:shadow-sm"
          >
            <option value="">Choose genre</option>
            {genres.map((genre: Genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                coverImage: event.target.files?.[0] ?? null,
              }))
            }
            className="block w-full text-sm text-text-muted file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:text-text-primary"
          />

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#1d1a17] px-5 py-3 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-black disabled:translate-y-0 disabled:opacity-60"
          >
            {saveMutation.isPending
              ? "Saving..."
              : editingBook
                ? "Update Book"
                : "Create Book"}
          </button>
        </div>
      </aside>
    </div>
  );
}
