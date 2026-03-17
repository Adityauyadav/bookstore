import { useQuery } from "@tanstack/react-query";
import { BookOpen, Layers3, Receipt, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { getBooks } from "../../api/books.api";
import { getAdminOrders, getGenres, getUsers } from "../../api/admin.api";

const stats = [
  {
    label: "Books",
    key: "books",
    icon: BookOpen,
    href: "/admin/books",
  },
  {
    label: "Orders",
    key: "orders",
    icon: Receipt,
    href: "/admin/orders",
  },
  {
    label: "Users",
    key: "users",
    icon: Users,
    href: "/admin/users",
  },
  {
    label: "Genres",
    key: "genres",
    icon: Layers3,
    href: "/admin/genres",
  },
] as const;

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-violet-50 text-violet-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function AdminDashboardPage() {
  const { data: booksData } = useQuery({
    queryKey: ["admin-dashboard", "books-count"],
    queryFn: () => getBooks({ limit: 1 }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["admin-dashboard", "orders"],
    queryFn: () => getAdminOrders(1, 5),
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-dashboard", "users-count"],
    queryFn: () => getUsers(1, 1),
  });

  const { data: genresData } = useQuery({
    queryKey: ["admin-dashboard", "genres-count"],
    queryFn: getGenres,
  });

  const totals = {
    books: booksData?.data.total ?? 0,
    orders: ordersData?.data.total ?? 0,
    users: usersData?.data.total ?? 0,
    genres: genresData?.data.length ?? 0,
  };

  const recentOrders = ordersData?.data.orders ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-black/8 bg-[#fbf8f2] px-6 py-7">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-text-muted">
          Operations overview
        </p>
        <h2 className="mt-2 font-serif text-4xl text-text-primary">
          Admin dashboard
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          Keep an eye on inventory, orders, users, and category coverage from
          one place.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              to={item.href}
              className="rounded-3xl border border-black/8 bg-[#fbf8f2] p-5 transition-all hover:-translate-y-0.5 hover:border-black/15"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                <Icon size={18} className="text-text-primary" />
              </div>
              <p className="mt-4 text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
                {item.label}
              </p>
              <p className="mt-2 font-serif text-4xl text-text-primary">
                {totals[item.key]}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.85fr)]">
        <div className="rounded-[1.75rem] border border-black/8 bg-[#fbf8f2] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
                Recent orders
              </p>
              <h3 className="mt-2 font-serif text-3xl text-text-primary">
                Latest activity
              </h3>
            </div>
            <Link
              to="/admin/orders"
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <article
                  key={order.id}
                  className="flex flex-col gap-3 rounded-[1.25rem] border border-black/8 bg-white p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-serif text-xl text-text-primary">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {order.user?.name ?? "Customer"} ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        statusStyles[order.status] ??
                        "bg-black/5 text-text-primary"
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm text-text-muted">
                      {order.itemCount ?? order.items.length} items
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatPrice(Number(order.totalAmount))}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-white px-5 py-10 text-center text-sm text-text-muted">
                No orders yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-black/8 bg-[#fbf8f2] p-6">
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
              Quick actions
            </p>
            <div className="mt-5 grid gap-3">
              <Link
                to="/admin/books"
                className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/15"
              >
                Manage inventory
              </Link>
              <Link
                to="/admin/genres"
                className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/15"
              >
                Add or remove genres
              </Link>
              <Link
                to="/admin/users"
                className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/15"
              >
                Review customer accounts
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
