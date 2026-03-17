import {
  House,
  LayoutDashboard,
  LogOut,
  Receipt,
  Search,
  ShoppingBag,
  User,
  Book,
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
    {
      name: "Catalogue",
      path: "/catalogue",
      icon: Book,
      isActive: (pathname: string) => pathname === "/catalogue",
    },
    { name: "Cart", path: "/cart", icon: ShoppingBag, hasBadge: true },
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
  };

  const handleTopSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const value = topSearch;
      const nextParams = new URLSearchParams(location.search);

      if (value) {
        nextParams.set("q", value);
      } else {
        nextParams.delete("q");
      }

      navigate(
        {
          pathname: "/catalogue",
          search: nextParams.toString() ? `?${nextParams.toString()}` : "",
        },
        { replace: location.pathname === "/catalogue" },
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-outer font-sans text-text-primary pb-18 md:pb-0">
      {/* Sidebar / Bottom Nav */}
      <aside className="fixed bottom-0 md:top-0 left-0 z-40 flex h-18 md:h-screen w-full md:w-20 flex-row md:flex-col items-center border-t md:border-t-0 md:border-r border-border bg-bg-card md:py-8 px-2 md:px-0">
        <Link
          to="/"
          className="hidden md:block mb-12 cursor-pointer font-serif text-3xl font-bold tracking-tighter transition-opacity hover:opacity-80"
        >
          B.
        </Link>

        <nav className="flex flex-1 md:flex-none flex-row md:flex-col justify-around w-full md:w-auto gap-1 md:gap-6">
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
                className={`relative flex h-10 w-10 md:h-12 md:w-12 cursor-pointer items-center justify-center rounded-xl md:rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-[#D84C35] text-white shadow-lg shadow-[#D84C35]/25"
                    : "text-text-muted hover:bg-bg-outer hover:text-[#D84C35]"
                }`}
                title={item.name}
              >
                <Icon
                  size={20}
                  className="md:w-5.5 md:h-5.5"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.hasBadge && cartItemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full border-2 border-bg-card bg-accent text-[9px] md:text-[10px] font-bold text-white">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="md:ml-20 flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex flex-col md:flex-row min-h-20 md:h-24 py-3 md:py-0 items-center justify-between border-b border-border bg-bg-outer/90 px-4 md:px-8 backdrop-blur-md gap-3 md:gap-0">
          <div className="hidden md:block md:w-84" />

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="hidden md:block h-px w-8 bg-black/10" />
              <p className="text-[0.55rem] md:text-[0.62rem] uppercase tracking-[0.3em] md:tracking-[0.42em] text-text-muted">
                Independent Bookstore
              </p>
              <span className="hidden md:block h-px w-8 bg-black/10" />
            </div>
            <Link to="/" className="mt-1 md:mt-2 flex justify-center">
              <span className="font-sans text-lg md:text-2xl font-semibold tracking-tight text-text-primary hover:opacity-75 transition-opacity">
                Bucketlist bookstore
              </span>
            </Link>
          </div>

          {/* Top Bar Actions */}
          <div className="flex w-full md:w-84 items-center justify-between md:justify-end gap-2 md:gap-4">
            <label className="relative block w-full md:max-w-56">
              <span className="sr-only">Search books</span>
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-4 w-4 text-text-muted" />
              </span>
              <input
                id="storefront-search"
                type="text"
                value={topSearch}
                onChange={(event) => handleTopSearchChange(event.target.value)}
                onKeyDown={handleTopSearchKeyDown}
                placeholder="Search books... (press Enter)"
                className="h-11 w-full rounded-full border border-black/10 bg-white/85 pl-11 pr-4 text-sm text-text-primary outline-none transition-colors duration-150 placeholder:text-text-muted/70 focus:border-black/20 focus:bg-white"
              />
            </label>

            {user?.role === "ADMIN" ? (
              <Link
                to="/admin"
                className="hidden md:inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-[#F5F3EE] px-4 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
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

                      <Link
                        to="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-black/10 bg-[#F5F3EE] px-4 py-3 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
                      >
                        <Receipt size={16} />
                        My Orders
                      </Link>

                      {user.role === "ADMIN" ? (
                        <Link
                          to="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-black/10 bg-[#F5F3EE] px-4 py-3 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
                        >
                          <LayoutDashboard size={16} />
                          Open Admin Dashboard
                        </Link>
                      ) : null}

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#D84C35] px-4 py-3 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-[#b83a1f] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 shadow-md"
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
                          className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-full bg-[#D84C35] px-4 py-3 text-sm text-white transition-all hover:-translate-y-0.5 hover:bg-[#b83a1f] shadow-md"
                        >
                          Login
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setIsProfileOpen(false)}
                          className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-[#F5F3EE] px-4 py-3 text-sm text-text-primary transition-all hover:-translate-y-0.5 hover:border-black/20"
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
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
