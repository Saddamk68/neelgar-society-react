import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { APP, PROFILE_MENU } from "../constants/messages";
import { MENU } from "../config/menu";
import { roleHasPermission } from "../constants/permissions";
import SkipLink from "../components/SkipLink";
import Breadcrumbs from "../components/Breadcrumbs";

const SIDEBAR_W = 240; // px
const HEADER_H = 64;   // h-16
const FOOTER_H = 40;   // h-10

export default function PrivateLayout() {
  const { logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Visible menu items based on permissions
  const visibleMenu = useMemo(
    () =>
      MENU.filter((item) =>
        (item.required ?? []).every((perm) => roleHasPermission(role, perm))
      ),
    [role]
  );

  const SidebarNav = (
    <nav aria-label="Primary" className="mt-4 flex flex-col">
      {visibleMenu.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.key}
            to={item.path!}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              [
                "relative flex items-center gap-2 px-3 py-2 rounded-md transition-all",
                "hover:bg-sidebar-hover/90 hover:pl-3.5",
                "focus:outline-none",
                isActive
                  ? "bg-sidebar-hover/90 before:absolute before:left-0 before:top-0 before:h-full before:w-1.5 before:bg-primary before:rounded-r"
                  : "before:w-0",
              ].join(" ")
            }
          >
            {Icon && <Icon size={16} className="text-gray-300" />}
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="h-screen overflow-hidden bg-background text-text-primary">
      <SkipLink />

      {/* ===== Desktop fixed sidebar ===== */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 z-30 bg-sidebar-bg text-white p-4"
        style={{ width: SIDEBAR_W }}
        aria-label="Sidebar"
      >
        <div className="w-full">
          <div
            className="h-12 flex items-center font-semibold tracking-wide"
            aria-label={`${APP.NAME} logo`}
          >
            {APP.NAME}
          </div>
          {SidebarNav}
        </div>
      </aside>

      {/* ===== Mobile overlay & drawer ===== */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        id="mobile-sidebar"
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
          <span aria-label={`${APP.NAME} logo`}>{APP.NAME}</span>
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

      {/* ===== Fixed header ===== */}
      <header
        role="banner"
        className="fixed top-0 right-0 left-0 lg:left-[240px] z-20 h-16 bg-surface border-b flex items-center justify-between px-4"
      >
        <Breadcrumbs /> {/* 🔹 centralized & reusable */}

        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:shadow transition"
            title="Open profile menu"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            <span className="sr-only">Open profile menu</span>
            U
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black/5 overflow-hidden"
              onMouseLeave={() => setProfileOpen(false)}
              role="menu"
              aria-label="Profile menu"
            >
              <div className="px-4 py-2 text-xs text-text-muted">
                {PROFILE_MENU.ROLE_PREFIX}
                {role}
              </div>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  navigate(ROUTES.PRIVATE.PROFILE);
                }}
              >
                {PROFILE_MENU.VIEW_PROFILE}
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 transition"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  navigate(ROUTES.PRIVATE.DASHBOARD); // TODO: change to /settings later
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

      {/* ===== Fixed footer ===== */}
      <footer
        role="contentinfo"
        className="fixed bottom-0 right-0 left-0 lg:left-[240px] z-20 h-10 text-center text-sm text-text-muted bg-slate-50 flex items-center justify-center"
      >
        © Neelgar Society 2025
      </footer>

      {/* ===== Scrollable content area ===== */}
      <main
        id="main-content"
        role="main"
        className="absolute overflow-auto app-scroll p-4"
        style={{ top: `${HEADER_H}px`, bottom: `${FOOTER_H}px`, left: 0, right: 0 }}
      >
        <div className="lg:pl-[240px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
