import { ArrowRight, ShoppingBag } from "lucide-react";
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
      className="group flex h-full max-w-48 cursor-pointer flex-col overflow-hidden bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(42,30,18,0.08)] focus:outline-none focus:ring-2 focus:ring-black/15"
    >
      <div className="relative block overflow-hidden bg-[#efe6d8]">
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="aspect-[4/4.7] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-2.25">
        <div className="flex-1">
          <Link
            to={`/books/${book.id}`}
            className="inline-flex items-start gap-1.5 text-text-primary transition-colors hover:text-black"
          >
            <h3 className="line-clamp-2 min-h-10 font-serif text-[0.96rem] leading-tight">
              {book.title}
            </h3>
            <ArrowRight
              size={13}
              className="mt-1 shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </Link>

          <p className="mt-0.5 text-[0.64rem] text-text-muted">{book.author}</p>
        </div>

        <div className="mt-1.5 flex items-end justify-between gap-1.5">
          <div>
            <p className="text-[0.58rem] uppercase tracking-wider text-text-muted">
              Price
            </p>
            <p className="mt-0.5 font-serif text-[0.88rem] font-medium text-text-primary">
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
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1.25 text-[0.62rem] font-medium text-white transition-all duration-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 ${
              isInCart
                ? "bg-emerald-700 hover:bg-emerald-800"
                : "bg-black hover:-translate-y-0.5 hover:shadow-lg"
            }`}
          >
            <ShoppingBag size={14} />
            {isAddingToCart
              ? "Adding..."
              : isInCart
                ? "Added to cart"
                : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
