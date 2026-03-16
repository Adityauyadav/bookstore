import { BookOpen, Layers3, LogOut, Receipt, Users } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { logout as logoutApi } from "../../api/auth.api";
import { useAuthStore } from "../../store/auth.store";

const navItems = [
  {
    label: "Books",
    path: "/admin/books",
    icon: BookOpen,
    title: "Books",
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: Receipt,
    title: "Orders",
  },
  {
    label: "Users",
    path: "/admin/users",
    icon: Users,
    title: "Users",
  },
  {
    label: "Genres",
    path: "/admin/genres",
    icon: Layers3,
    title: "Genres",
  },
] as const;

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const currentNavItem =
    navItems.find((item) => location.pathname.startsWith(item.path)) ??
    navItems[0];

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logoutApi();
    } catch {
      // Clear local auth state even if the server-side logout request fails.
    } finally {
      logoutStore();
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f1ea] text-text-primary">
      <div className="flex min-h-screen">
        <aside className="flex w-55 flex-col border-r border-black/10 bg-[#fbf8f2] px-6 py-8">
          <Link to="/admin/books" className="block">
            <div className="font-serif text-3xl tracking-tight text-text-primary">
              BucketList
            </div>
            <div className="mt-1 font-sans text-[0.68rem] uppercase tracking-[0.28em] text-text-muted">
              Admin
            </div>
          </Link>

          <nav className="mt-12 flex flex-1 flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-[#1d1a17] text-white shadow-[0_12px_28px_rgba(29,26,23,0.14)]"
                      : "text-text-muted hover:bg-white hover:text-text-primary"
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-black/10 pt-5">
            <p className="font-sans text-[0.68rem] uppercase tracking-[0.24em] text-text-muted">
              Signed in as
            </p>
            <p className="mt-2 truncate font-serif text-lg text-text-primary">
              {user?.name ?? "Admin"}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-medium text-text-primary transition-all duration-200 hover:-translate-y-0.5 hover:border-black/20 hover:bg-[#f5f1ea] disabled:translate-y-0 disabled:opacity-70"
            >
              <LogOut size={16} />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-black/10 bg-[#f8f4ee]/90 px-8 py-6 backdrop-blur-sm">
            <h1 className="font-serif text-3xl tracking-tight text-text-primary">
              {currentNavItem.title}
            </h1>
          </header>

          <main className="flex-1 p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
