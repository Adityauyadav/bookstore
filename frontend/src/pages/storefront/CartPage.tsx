import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import {
  getCart,
  removeCartItem,
  updateCartItem,
} from "../../api/cart.api";

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function CartPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({
      bookId,
      quantity,
    }: {
      bookId: string;
      quantity: number;
    }) => updateCartItem(bookId, quantity),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (bookId: string) => removeCartItem(bookId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const cart = data?.data;
  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.book.price) * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-[1.5rem] bg-white"
            />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-[1.75rem] bg-white" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/10 bg-[#fbf8f2] px-8 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white">
          <ShoppingBag className="h-6 w-6 text-text-muted" />
        </div>
        <h1 className="mt-6 font-serif text-4xl text-text-primary">
          Your cart is empty
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          Start with a few titles from the storefront and they&apos;ll appear
          here for checkout.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center rounded-full bg-[#1d1a17] px-5 py-3 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-black"
        >
          Browse books
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-sans text-[0.72rem] uppercase tracking-[0.32em] text-text-muted">
          Your basket
        </p>
        <h1 className="mt-2 font-serif text-4xl text-text-primary">Cart</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
        <section className="space-y-4">
          {items.map((item) => {
            const isUpdating =
              updateQuantityMutation.isPending &&
              updateQuantityMutation.variables?.bookId === item.bookId;
            const isRemoving =
              removeItemMutation.isPending &&
              removeItemMutation.variables === item.bookId;

            return (
              <article
                key={item.id}
                className="grid gap-4 rounded-[1.5rem] border border-black/8 bg-[#fbf8f2] p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto]"
              >
                <Link to={`/books/${item.book.id}`} className="block">
                  <img
                    src={item.book.coverImageUrl}
                    alt={item.book.title}
                    className="aspect-[3/4] w-24 rounded-[1rem] object-cover bg-[#efe6d8] transition-transform duration-200 hover:scale-[1.02]"
                  />
                </Link>

                <div className="min-w-0">
                  <Link
                    to={`/books/${item.book.id}`}
                    className="font-serif text-2xl leading-tight text-text-primary transition-colors hover:text-black"
                  >
                    {item.book.title}
                  </Link>
                  <p className="mt-1 text-sm text-text-muted">
                    {item.book.author}
                  </p>
                  <p className="mt-4 font-serif text-xl text-[#8f2d22]">
                    {formatPrice(Number(item.book.price))}
                  </p>
                </div>

                <div className="flex flex-col items-start justify-between gap-4 sm:items-end">
                  <button
                    type="button"
                    onClick={() => removeItemMutation.mutate(item.bookId)}
                    disabled={isRemoving}
                    className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-[#8f2d22] disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>

                  <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          bookId: item.bookId,
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      }
                      disabled={isUpdating || item.quantity <= 1}
                      className="rounded-full p-1 text-text-primary transition-colors hover:bg-[#f4efe7] disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-6 text-center text-sm text-text-primary">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantityMutation.mutate({
                          bookId: item.bookId,
                          quantity: item.quantity + 1,
                        })
                      }
                      disabled={
                        isUpdating || item.quantity >= item.book.stock
                      }
                      className="rounded-full p-1 text-text-primary transition-colors hover:bg-[#f4efe7] disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="h-fit rounded-[1.75rem] border border-black/8 bg-[#fbf8f2] p-6">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-text-muted">
            Order summary
          </p>
          <h2 className="mt-3 font-serif text-3xl text-text-primary">
            Ready to checkout
          </h2>

          <div className="mt-8 space-y-4 border-y border-black/8 py-5">
            <div className="flex items-center justify-between text-sm text-text-muted">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-text-muted">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-serif text-xl text-text-primary">Total</span>
            <span className="font-serif text-2xl text-[#8f2d22]">
              {formatPrice(subtotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#1d1a17] px-5 py-3 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-black"
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>
    </div>
  );
}
