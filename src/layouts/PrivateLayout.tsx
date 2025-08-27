import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { APP, NAV, PROFILE_MENU } from "../constants/messages";
import { MENU } from "../config/menu";
import { roleHasPermission } from "../constants/permissions";

export default function PrivateLayout() {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setProfileOpen(false);
  }, []);

  // filter menu based on RBAC
  const visibleMenu = useMemo(
    () =>
      MENU.filter((item) =>
        (item.required ?? []).every((perm) => roleHasPermission(role, perm))
      ),
    [role]
  );

  const SidebarNav = (
    <nav className="mt-4 flex flex-col">
      {visibleMenu.map((item) => (
        <NavLink
          key={item.key}
          to={item.path!}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            [
              "relative px-3 py-2 rounded-md transition-all",
              "hover:bg-sidebar-hover/90 hover:pl-3.5",
              "focus:outline-none focus:ring-2 focus:ring-white/30",
              isActive
                ? "bg-sidebar-hover/90 before:absolute before:left-0 before:top-0 before:h-full before:w-1.5 before:bg-primary before:rounded-r"
                : "before:w-0",
            ].join(" ")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background text-text-primary lg:grid lg:grid-cols-[240px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block bg-sidebar-bg text-white p-4">
        <div className="h-12 flex items-center font-semibold tracking-wide">
          {APP.NAME}
        </div>
        {SidebarNav}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={[
          "fixed z-50 inset-y-0 left-0 w-64 bg-sidebar-bg text-white p-4 lg:hidden",
          "transform transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar navigation"
      >
        <div className="h-12 flex items-center justify-between font-semibold tracking-wide">
          <span>{APP.NAME}</span>
          <button
            className="text-white/80 hover:text-white transition"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            title="Close"
          >
            ✕
          </button>
        </div>
        {SidebarNav}
      </aside>

      {/* Main area */}
      <div className="flex flex-col min-h-screen">
        {/* Top Nav */}
        <header className="h-16 bg-surface border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 hover:bg-slate-100 active:scale-95 transition"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
              title="Open menu"
            >
              <span className="sr-only">Open sidebar</span>
              <div className="space-y-1.5">
                <span className="block w-5 h-0.5 bg-current"></span>
                <span className="block w-5 h-0.5 bg-current"></span>
                <span className="block w-5 h-0.5 bg-current"></span>
              </div>
            </button>

            <Link
              to={ROUTES.PRIVATE.DASHBOARD}
              className="font-semibold hover:opacity-90 transition"
              title="Go to Dashboard"
            >
              {NAV.DASHBOARD}
            </Link>
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:shadow transition"
              title="Open profile menu"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              U
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black/5 overflow-hidden"
                onMouseLeave={() => setProfileOpen(false)}
                role="menu"
              >
                <div className="px-4 py-2 text-xs text-text-muted">
                  {PROFILE_MENU.ROLE_PREFIX}{role}
                </div>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(ROUTES.PRIVATE.DASHBOARD);
                  }}
                >
                  {PROFILE_MENU.VIEW_PROFILE}
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(ROUTES.PRIVATE.DASHBOARD);
                  }}
                >
                  {PROFILE_MENU.SETTINGS}
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-slate-100 transition"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate(ROUTES.PUBLIC.HOME);
                  }}
                >
                  {PROFILE_MENU.LOGOUT}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4">
          <Outlet />
        </main>

        <footer className="h-10 text-center text-sm text-text-muted bg-slate-50 flex items-center justify-center">
          {APP.COPYRIGHT}
        </footer>
      </div>
    </div>
  );
}
