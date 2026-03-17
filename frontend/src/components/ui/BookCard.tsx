import { ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import type { Book } from "../../types";

type BookCardProps = {
  book: Book;
  onAddToCart?: (book: Book) => void;
  isAddingToCart?: boolean;
  isInCart?: boolean;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

export default function BookCard({
  book,
  onAddToCart,
  isAddingToCart = false,
  isInCart = false,
}: BookCardProps) {
  const isOutOfStock = book.stock < 1;
  const navigate = useNavigate();

  const handleOpenBook = () => {
    navigate(`/books/${book.id}`);
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={handleOpenBook}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpenBook();
        }
      }}
      className="group flex h-full w-full cursor-pointer flex-col focus:outline-none"
    >
      <div className="relative block overflow-hidden bg-[#f4efe7] shadow-sm">
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="aspect-2/3 object-cover w-full transition-transform duration-500 group-hover:scale-[1.05]"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-black/80 text-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-sm">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col mt-2.5">
        <div className="flex-1">
          <p className="mb-0.5 text-[0.62rem] font-medium uppercase tracking-wider text-text-muted">
            {book.genre?.name || "Uncategorized"}
          </p>

          <Link
            to={`/books/${book.id}`}
            className="block text-text-primary transition-colors hover:text-black"
          >
            <h3
              title={book.title}
              className="font-serif text-[0.95rem] tracking-tight leading-snug group-hover:underline decoration-1 underline-offset-2 truncate"
            >
              {book.title}
            </h3>
          </Link>

          <p
            className="mt-0.5 text-[11px] text-text-muted line-clamp-1"
            title={book.author}
          >
            {book.author}
          </p>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <p className="font-serif text-[1rem] tracking-tight font-medium text-text-primary leading-none">
              {formatPrice(book.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddToCart?.(book);
            }}
            disabled={!onAddToCart || isAddingToCart || isOutOfStock}
            className={`inline-flex items-center justify-center shrink-0 h-7 w-7 rounded-full transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
              isInCart
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "bg-[#f4efe7] text-text-primary hover:bg-[#D84C35] hover:text-white"
            }`}
            title={isInCart ? "In cart" : "Add to cart"}
          >
            <ShoppingBag size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}
