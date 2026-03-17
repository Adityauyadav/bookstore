import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getBook, getBooks } from "../../api/books.api";
import { addToCart, getCart } from "../../api/cart.api";
import { useAuthStore } from "../../store/auth.store";
import BookCard from "../../components/ui/BookCard";
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

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isAuthenticated,
  });

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
  const isInCart =
    cartData?.data?.items.some((item) => item.bookId === book?.id) ?? false;
  const cartBookIds = new Set(
    cartData?.data?.items.map((item) => item.bookId) ?? [],
  );
  const apiError = error as AxiosError<ApiErrorResponse> | null;
  const errorStatus = apiError?.response?.status;
  const errorMessage =
    apiError?.response?.data?.message ??
    "We couldn't load this book right now. Please try again again shortly.";

  const { data: relatedBooksData } = useQuery({
    queryKey: ["related-books", book?.genre?.slug, book?.id],
    queryFn: () =>
      getBooks({
        genre: book?.genre?.slug,
        limit: 5,
      }),
    enabled: Boolean(book?.genre?.slug),
  });

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

  const relatedBooks =
    relatedBooksData?.data.books.filter(
      (relatedBook) => relatedBook.id !== book?.id,
    ) ?? [];

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
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D84C35] px-5 py-3 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-[#b83a1f] shadow-md"
        >
          <ArrowLeft size={16} />
          Back to books
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col relative pb-16 bg-[#F6F5ED]">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          Back to collection
        </Link>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-16 pt-8">
        {/* Left Column: Book Image */}
        <div className="w-full lg:w-[320px] shrink-0 flex justify-center lg:justify-end lg:pr-8">
          <div className="relative group">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="w-60 lg:w-70 aspect-2/3 object-cover rounded-r-lg rounded-l-sm shadow-[10px_20px_40px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:-translate-y-2"
            />
            {/* Book pages effect */}
            <div className="absolute inset-y-0 right-0 w-1 bg-linear-to-r from-white/40 to-black/10 rounded-r-lg" />
          </div>
        </div>

        {/* Right Column: Title & Actions */}
        <div className="w-full lg:w-auto flex-1 flex flex-col justify-start lg:pt-6">
          <h1 className="font-serif text-4xl lg:text-[3.5rem] leading-[1.1] text-gray-900 max-w-2xl">
            {book.title}
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-gray-700 font-medium tracking-wide">
            {book.author}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-serif text-[#8f2d22] mr-2">
              {formatPrice(book.price)}
            </span>
            {book.genre?.name && (
              <span className="rounded bg-gray-200/50 px-2.5 py-1 text-xs font-semibold tracking-wide text-gray-700">
                {book.genre.name}
              </span>
            )}
            <span
              className={`rounded px-2.5 py-1 text-xs font-semibold tracking-wide ${
                isOutOfStock
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {isOutOfStock ? "Out of stock" : `${book.stock} available`}
            </span>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || isOutOfStock}
              className={`inline-flex items-center justify-center gap-3 rounded-full px-8 py-3.5 text-sm font-medium text-white transition-all disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 shadow-lg ${
                isInCart
                  ? "bg-emerald-700 hover:bg-emerald-800"
                  : "bg-[#D84C35] hover:-translate-y-0.5 hover:bg-[#b83a1f] hover:shadow-xl"
              }`}
            >
              Add to cart
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="ml-1"
              >
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 5L19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="flex gap-3 ml-2">
              <button
                disabled
                className="p-3.5 rounded-full border border-gray-300 text-gray-700 hover:bg-white transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"></path>
                </svg>
              </button>
              <button
                disabled
                className="p-3.5 rounded-full border border-gray-300 text-gray-700 hover:bg-white transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* White box overlapping */}
      <div className="w-full relative z-0">
        <div className="bg-white w-full lg:w-[90%] mx-auto -mt-25 lg:-mt-40 pt-32 lg:pt-48 pb-16 shadow-[0_-4px_25px_rgba(0,0,0,0.02)]">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
              {/* Description aligned below cover */}
              <div className="w-full lg:w-[320px] shrink-0 lg:pr-8 flex flex-col items-center lg:items-end">
                <div className="w-60 lg:w-70 text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 font-serif">
                    Description
                  </h3>
                  <p className="text-[15px] leading-[1.8] text-gray-600 whitespace-pre-line">
                    {book.description ||
                      "A thoughtfully selected title from our current shelf. This novel will take you on a captivating journey filled with unexpected twists and beautifully crafted characters."}
                  </p>
                </div>
              </div>

              {/* Attributes in grid */}
              <div className="w-full lg:w-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8 pt-2">
                <div>
                  <h4 className="text-[15px] font-semibold text-gray-900 mb-3 font-serif">
                    Genre
                  </h4>
                  <p className="text-[14px] text-gray-600">
                    {book.genre?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-gray-900 mb-3 font-serif">
                    Format
                  </h4>
                  <p className="text-[14px] text-gray-600">Paperback</p>
                  <p className="text-[13px] text-gray-500 mt-1">
                    ISBN: {book.isbn}
                  </p>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-gray-900 mb-3 font-serif">
                    Language
                  </h4>
                  <p className="text-[14px] text-gray-600">
                    Standard English (USA & UK)
                  </p>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-gray-900 mb-3 font-serif">
                    Price
                  </h4>
                  <p className="text-[14px] text-gray-600">
                    {formatPrice(book.price)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedBooks.length > 0 && (
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 mt-16 lg:mt-24 z-10">
          <section className="space-y-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl text-gray-900">
                  Similar books
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  More from {book.genre?.name ?? "this shelf"} for your next
                  scroll.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {relatedBooks.slice(0, 4).map((relatedBook) => (
                <BookCard
                  key={relatedBook.id}
                  book={relatedBook}
                  onAddToCart={() => {
                    if (!isAuthenticated) {
                      navigate("/login");
                      return;
                    }
                    addToCartMutation.mutate(relatedBook.id);
                  }}
                  isInCart={cartBookIds.has(relatedBook.id)}
                  isAddingToCart={
                    addToCartMutation.isPending &&
                    addToCartMutation.variables === relatedBook.id
                  }
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
