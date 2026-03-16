import {
  BookOpen,
  House,
  Receipt,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useLocation } from "react-router-dom";

import { getCart } from "../../api/cart.api";
import { useAuthStore } from "../../store/auth.store";

export default function StorefrontLayout() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isAuthenticated,
  });

  const navItems = [
    {
      name: "Home",
      path: "/",
      icon: House,
      isActive: (pathname: string) => pathname === "/",
    },
    {
      name: "Books",
      path: "/",
      icon: BookOpen,
      isActive: (pathname: string) => pathname.startsWith("/books/"),
    },
    { name: "Cart", path: "/cart", icon: ShoppingBag, hasBadge: true },
    { name: "Orders", path: "/orders", icon: Receipt },
  ];

  const cartItemCount = data?.data?.items?.length ?? 0;

  return (
    <div className="flex min-h-screen bg-bg-outer font-sans text-text-primary">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col items-center border-r border-border bg-bg-card py-8">
        <Link
          to="/"
          className="mb-12 font-serif text-3xl font-bold tracking-tighter hover:opacity-80 transition-opacity"
        >
          B.
        </Link>

        <nav className="flex flex-1 flex-col gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.isActive?.(location.pathname) ??
              (location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path)));

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-text-primary text-white shadow-lg shadow-black/10"
                    : "text-text-muted hover:bg-bg-outer hover:text-text-primary"
                }`}
                title={item.name}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {item.hasBadge && cartItemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg-card bg-accent text-[10px] font-bold text-white">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="ml-20 flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-bg-outer/90 px-8 backdrop-blur-md">
          {/* Search Input */}
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4.5 w-4.5 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search for books, authors..."
              className="h-11 w-full rounded-2xl border border-transparent bg-white/60 pl-11 pr-4 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted/70 focus:border-black/10 focus:bg-white focus:shadow-sm"
            />
          </div>

          {/* Top Bar Actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white transition-colors hover:bg-white/80 hover:shadow-sm"
            >
              <ShoppingBag size={20} className="text-text-primary" />
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-accent text-[10px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <Link
              to="/account"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white transition-colors hover:bg-white/80 hover:shadow-sm"
            >
              <User size={20} className="text-text-primary" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
