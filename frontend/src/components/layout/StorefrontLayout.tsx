import {
  House,
  LayoutDashboard,
  LogOut,
  Receipt,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { logout as logoutApi } from "../../api/auth.api";
import { getCart } from "../../api/cart.api";
import { useAuthStore } from "../../store/auth.store";

export default function StorefrontLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [topSearch, setTopSearch] = useState("");
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
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
    { name: "Cart", path: "/cart", icon: ShoppingBag, hasBadge: true },
    { name: "Orders", path: "/orders", icon: Receipt },
  ];

  const cartItemCount =
    data?.data?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  useEffect(() => {
    const currentQuery = new URLSearchParams(location.search).get("q") ?? "";
    setTopSearch((prev) => {
      if (
        prev.trim() === currentQuery.trim() &&
        prev.length > currentQuery.length
      ) {
        return prev;
      }
      return currentQuery;
    });
  }, [location.search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logoutApi();
    } catch {
    } finally {
      logoutStore();
      setIsProfileOpen(false);
      setIsLoggingOut(false);
      navigate("/login");
    }
  };

  const handleTopSearchChange = (value: string) => {
    setTopSearch(value);

    const nextParams = new URLSearchParams(location.search);

    if (value) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }

    navigate(
      {
        pathname: "/",
        search: nextParams.toString() ? `?${nextParams.toString()}` : "",
      },
      { replace: location.pathname === "/" },
    );
  };

  return (
    <div className="flex min-h-screen bg-bg-outer font-sans text-text-primary">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col items-center border-r border-border bg-bg-card py-8">
        <Link
          to="/"
          className="mb-12 cursor-pointer font-serif text-3xl font-bold tracking-tighter transition-opacity hover:opacity-80"
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
                className={`relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl transition-all duration-200 ${
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
        <header className="sticky top-0 z-30 flex h-24 items-center justify-between border-b border-border bg-bg-outer/90 px-8 backdrop-blur-md">
          <div className="w-84" />

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-black/10" />
              <p className="text-[0.62rem] uppercase tracking-[0.42em] text-text-muted">
                Independent Bookstore
              </p>
              <span className="h-px w-8 bg-black/10" />
            </div>
            <h1 className="mt-2 font-serif text-[1.9rem] tracking-[-0.03em] text-text-primary">
              BucketList Books
            </h1>
          </div>

          {/* Top Bar Actions */}
          <div className="flex w-84 items-center justify-end gap-4">
            <label className="relative block w-full max-w-56">
              <span className="sr-only">Search books</span>
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-4 w-4 text-text-muted" />
              </span>
              <input
                id="storefront-search"
                type="text"
                value={topSearch}
                onChange={(event) => handleTopSearchChange(event.target.value)}
                placeholder="Search books..."
                className="h-11 w-full rounded-full border border-black/10 bg-white/85 pl-11 pr-4 text-sm text-text-primary outline-none transition-colors duration-150 placeholder:text-text-muted/70 focus:border-black/20 focus:bg-white"
              />
            </label>

            {user?.role === "ADMIN" ? (
              <Link
                to="/admin"
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-[#f8f4ee] px-4 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
              >
                <LayoutDashboard size={16} />
                Admin
              </Link>
            ) : null}

            <Link
              to="/cart"
              className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-black/5 bg-white transition-colors hover:bg-white/80 hover:shadow-sm"
            >
              <ShoppingBag size={20} className="text-text-primary" />
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-accent text-[10px] font-bold text-white">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((current) => !current)}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-black/5 bg-white transition-colors hover:bg-white/80 hover:shadow-sm"
              >
                <User size={20} className="text-text-primary" />
              </button>

              {isProfileOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 w-72 rounded-[1.25rem] border border-black/10 bg-white p-4 shadow-[0_20px_50px_rgba(42,30,18,0.12)]">
                  {isAuthenticated && user ? (
                    <>
                      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
                        Signed in
                      </p>
                      <p className="mt-2 font-serif text-2xl text-text-primary">
                        {user.name}
                      </p>
                      <p className="mt-1 break-all text-sm text-text-muted">
                        {user.email}
                      </p>

                      {user.role === "ADMIN" ? (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-black/10 bg-[#f8f4ee] px-4 py-3 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
                        >
                          <LayoutDashboard size={16} />
                          Open Admin Dashboard
                        </Link>
                      ) : null}

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1d1a17] px-4 py-3 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                      >
                        <LogOut size={16} />
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
                        Account
                      </p>
                      <p className="mt-2 font-serif text-2xl text-text-primary">
                        Welcome
                      </p>
                      <p className="mt-1 text-sm text-text-muted">
                        Sign in to keep your cart, orders, and checkout ready.
                      </p>

                      <div className="mt-5 flex gap-3">
                        <Link
                          to="/login"
                          onClick={() => setIsProfileOpen(false)}
                          className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-full bg-[#1d1a17] px-4 py-3 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-black"
                        >
                          Login
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setIsProfileOpen(false)}
                          className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-[#f8f4ee] px-4 py-3 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
                        >
                          Register
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
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
