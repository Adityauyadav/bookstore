import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getBook } from "../../api/books.api";
import { addToCart } from "../../api/cart.api";
import { useAuthStore } from "../../store/auth.store";
import type { ApiErrorResponse } from "../../types";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data, error, isLoading, isError } = useQuery({
    queryKey: ["book", id],
    queryFn: () => getBook(id!),
    enabled: Boolean(id),
  });

  const addToCartMutation = useMutation({
    mutationFn: (bookId: string) => addToCart(bookId, 1),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const book = data?.data;
  const isOutOfStock = (book?.stock ?? 0) < 1;
  const apiError = error as AxiosError<ApiErrorResponse> | null;
  const errorStatus = apiError?.response?.status;
  const errorMessage =
    apiError?.response?.data?.message ??
    "We couldn't load this book right now. Please try again again shortly.";

  const handleAddToCart = () => {
    if (!book) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    addToCartMutation.mutate(book.id);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="aspect-3/4 animate-pulse rounded-4xl bg-white" />
        <div className="space-y-4 rounded-4xl bg-white p-8">
          <div className="h-4 w-28 animate-pulse rounded bg-[#ece4d8]" />
          <div className="h-12 w-3/4 animate-pulse rounded bg-[#ece4d8]" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-[#ece4d8]" />
          <div className="h-32 w-full animate-pulse rounded bg-[#ece4d8]" />
        </div>
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="rounded-4xl border border-dashed border-black/10 bg-[#fbf8f2] px-8 py-16 text-center">
        <p className="font-serif text-3xl text-text-primary">
          {errorStatus === 404 ? "Book not found" : "Unable to load book"}
        </p>
        <p className="mt-3 text-sm text-text-muted">
          {errorStatus === 404
            ? "This title may have been removed or the link may be incorrect."
            : errorMessage}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1d1a17] px-5 py-3 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-black"
        >
          <ArrowLeft size={16} />
          Back to books
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Back to collection
      </Link>

      <section className="grid gap-6 rounded-4xl border border-black/8 bg-[#fbf8f2] p-5 sm:p-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:p-8">
        <div className="rounded-[1.75rem] bg-[#efe6d8] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
          <div className="mx-auto max-w-md">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="aspect-3/4 w-full rounded-3xl object-cover shadow-[0_22px_50px_rgba(42,30,18,0.22)]"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-[1.75rem] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            {book.genre?.name ? (
              <span className="rounded-full bg-[#f4efe7] px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
                {book.genre.name}
              </span>
            ) : null}
            <span
              className={`rounded-full px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] ${
                isOutOfStock
                  ? "bg-[#f8ece8] text-[#8f2d22]"
                  : "bg-[#edf4ee] text-[#355f3b]"
              }`}
            >
              {isOutOfStock ? "Out of stock" : `${book.stock} in stock`}
            </span>
          </div>

          <h1 className="mt-5 font-serif text-4xl leading-tight text-text-primary sm:text-5xl">
            {book.title}
          </h1>
          <p className="mt-3 text-base text-text-muted sm:text-lg">
            {book.author}
          </p>

          <p className="mt-6 font-serif text-3xl text-[#8f2d22] sm:text-4xl">
            {formatPrice(book.price)}
          </p>

          <div className="mt-6 max-w-2xl">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
              About this book
            </p>
            <p className="mt-3 text-sm leading-7 text-text-muted sm:text-base">
              {book.description ||
                "A thoughtfully selected title from our current shelf."}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || isOutOfStock}
              className="inline-flex items-center gap-2 rounded-full bg-[#1d1a17] px-5 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-black disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <ShoppingBag size={16} />
              {addToCartMutation.isPending ? "Adding..." : "Add to cart"}
            </button>

            <p className="text-sm text-text-muted">
              ISBN <span className="text-text-primary">{book.isbn}</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
