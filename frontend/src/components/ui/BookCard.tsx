import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import type { Book } from "../../types";

type BookCardProps = {
  book: Book;
  onAddToCart?: (book: Book) => void;
  isAddingToCart?: boolean;
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
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(42,30,18,0.08)] focus:outline-none focus:ring-2 focus:ring-black/15"
    >
      <div className="relative block overflow-hidden bg-[#efe6d8]">
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="aspect-[3/4] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {book.genre?.name ? (
            <span className="rounded-full bg-white/85 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-wider text-text-muted backdrop-blur-sm">
              {book.genre.name}
            </span>
          ) : (
            <span />
          )}
          {isOutOfStock && (
            <span className="rounded-full bg-[#8f2d22] px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-wider text-white shadow-sm"></span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <Link
            to={`/books/${book.id}`}
            className="inline-flex items-start gap-1.5 text-text-primary transition-colors hover:text-black"
          >
            <h3 className="font-serif text-lg leading-tight">{book.title}</h3>
            <ArrowRight
              size={14}
              className="mt-1 shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </Link>

          <p className="mt-1 text-xs text-text-muted">{book.author}</p>

          {book.description ? (
            <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-text-muted/90">
              {book.description}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-text-muted">
              Price
            </p>
            <p className="mt-0.5 font-serif text-lg font-medium text-text-primary">
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
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-3.5 py-2 text-xs font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <ShoppingBag size={14} />
            {isAddingToCart ? "Adding..." : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
