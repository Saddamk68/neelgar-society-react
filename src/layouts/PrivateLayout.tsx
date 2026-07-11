import logo from "../assets/logo/neelgar-society-logo.png";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { APP, PROFILE_MENU } from "../constants/messages";
import { MENU } from "../config/menu";
import SkipLink from "../components/SkipLink";
import Breadcrumbs from "../components/Breadcrumbs";
import { ChevronDown, LogOut } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";

const SIDEBAR_W = 240; // px

// ── Collapsible group helper ─────────────────────────────────────
function GroupItem({
  label,
  icon: Icon,
  isGroupActive,
  children,
  onClose,
}: {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  isGroupActive: boolean;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className={[
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all group",
          "hover:bg-white/10",
          isGroupActive ? "text-white" : "text-white/55 hover:text-white",
        ].join(" ")}
      >
        {Icon && (
          <Icon
            size={16}
            className={isGroupActive ? "text-primary" : "text-white/40 group-hover:text-white/80"}
          />
        )}
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          size={13}
          className={["transition-transform duration-200 text-white/30", open ? "" : "-rotate-90"].join(" ")}
        />
      </button>
      {open && (
        <div className="ml-5 border-l border-white/10 pl-2 flex flex-col gap-0.5 mb-1">
          {children}
        </div>
      )}
    </div>
  );
}

export default function PrivateLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [phoneBannerDismissed, setPhoneBannerDismissed] = useState(false);

  const { logout, role, isInitializing, mustChangePassword, hasPermission } = useAuth();
  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Close mobile drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Force redirect to profile if password change is required
  useEffect(() => {
    if (mustChangePassword && location.pathname !== ROUTES.PRIVATE.PROFILE) {
      navigate(ROUTES.PRIVATE.PROFILE, { replace: true });
    }
  }, [mustChangePassword, location.pathname, navigate]);

  // Visible menu items based on permissions
  const visibleMenu = useMemo(
    () =>
      MENU.filter((item) =>
        (item.required ?? []).every((perm) => hasPermission(perm))
      ),
    [hasPermission]
  );

  // ── Group items by section for rendering section labels ──────────
  const sections = useMemo(() => {
    const map: { label: string; items: typeof visibleMenu }[] = [];
    let current: { label: string; items: typeof visibleMenu } | null = null;

    visibleMenu.forEach((item) => {
      const sectionLabel = item.section ?? "";
      if (!current || current.label !== sectionLabel) {
        current = { label: sectionLabel, items: [] };
        map.push(current);
      }
      current.items.push(item);
    });

    return map;
  }, [visibleMenu]);

  const SidebarContent = (
    <>
      {/* ── Brand header ── */}
      <div className="py-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2.5 px-1 mb-2">
          <img
            src={logo}
            alt={`${APP.NAME} logo`}
            className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
          />
          <div>
            <p className="text-sm font-bold text-white leading-tight">{APP.NAME}</p>
            <p className="text-[10px] text-white/40">Management Portal</p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav aria-label="Primary" className="flex-1 flex flex-col gap-0.5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            {/* Section label */}
            {section.label ? (
              <div className="flex items-center gap-2 px-2 pt-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
                  {section.label}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            ) : null}

            {/* Items */}
            {section.items.map((item) => {
              const Icon = item.icon;

              // ── Group with children ──────────────────────────────
              if (item.children && item.children.length > 0) {
                const visibleChildren = item.children.filter((child) =>
                  (child.required ?? []).every((perm) => hasPermission(perm))
                );
                if (visibleChildren.length === 0) return null;

                const isGroupActive = visibleChildren.some(
                  (child) => child.path && location.pathname.startsWith(child.path)
                );

                return (
                  <GroupItem
                    key={item.key}
                    label={item.label}
                    icon={Icon}
                    isGroupActive={isGroupActive}
                    onClose={() => setMobileOpen(false)}
                  >
                    {visibleChildren.map((child) => (
                      <NavLink
                        key={child.key}
                        to={child.path!}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          [
                            "relative flex items-center px-3 py-1.5 rounded-md text-sm transition-all",
                            "hover:bg-white/10",
                            isActive
                              ? "text-white font-medium bg-white/10 before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-1 before:bg-primary before:rounded-r"
                              : "text-white/55 hover:text-white",
                          ].join(" ")
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </GroupItem>
                );
              }

              // ── Flat item ────────────────────────────────────────
              return (
                <NavLink
                  key={item.key}
                  to={item.path!}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      "relative flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all group",
                      "hover:bg-white/10",
                      isActive
                        ? "bg-white/10 text-white font-medium before:absolute before:left-0 before:top-0.5 before:bottom-0.5 before:w-1 before:bg-primary before:rounded-r"
                        : "text-white/55 hover:text-white",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      {Icon && (
                        <Icon
                          size={16}
                          className={isActive ? "text-primary" : "text-white/40 group-hover:text-white/80"}
                        />
                      )}
                      {item.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      <div className="mt-auto pt-3 border-t border-white/10">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
          <div className="w-7 h-7 rounded-full bg-primary/30 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
            {role ? role[0].toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 uppercase tracking-wide">
              {role}
            </span>
          </div>
        </div>
        <button
          className="w-full flex items-center gap-1.5 text-left px-3 py-1.5 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-400/10 transition-colors rounded-md"
          onClick={() => setConfirmLogout(true)}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen overflow-hidden bg-background text-text-primary flex">
      <SkipLink />

      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-sidebar-bg text-white p-3"
        style={{ width: SIDEBAR_W }}
        aria-label="Sidebar"
      >
        {SidebarContent}
      </aside>

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
          "fixed z-50 inset-y-0 left-0 bg-sidebar-bg text-white p-3 lg:hidden",
          "flex flex-col",
          "transform transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{ width: SIDEBAR_W }}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar navigation"
      >
        <button
          className="absolute top-3 right-3 text-white/50 hover:text-white transition z-10"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        >
          ✕
        </button>
        {SidebarContent}
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden lg:pl-[240px]">

        {!phoneBannerDismissed && (
          <div className="shrink-0 lg:hidden bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-3 text-sm text-amber-800">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span className="flex-1">
              This portal is not designed for mobile devices. Some features may not work well on a phone.
            </span>
            <button
              onClick={() => setPhoneBannerDismissed(true)}
              className="shrink-0 text-amber-600 hover:text-amber-800 font-medium transition"
              aria-label="Dismiss warning"
            >
              Dismiss
            </button>
          </div>
        )}

        <header
          role="banner"
          className="shrink-0 h-16 bg-surface border-b flex items-center justify-between px-4"
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-controls="mobile-sidebar"
              aria-expanded={mobileOpen}
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Breadcrumbs />
          </div>

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
                  className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-danger hover:bg-red-50 transition"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    setConfirmLogout(true);
                  }}
                >
                  <LogOut size={15} />
                  {PROFILE_MENU.SIGNOOUT}
                </button>
              </div>
            )}
          </div>
        </header>

        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-auto app-scroll p-4"
        >
          <Outlet />
        </main>

        <footer
          role="contentinfo"
          className="shrink-0 h-10 text-center text-sm text-text-muted bg-slate-50 flex items-center justify-center"
        >
          © Neelgar Society 1992
        </footer>
      </div>

      <ConfirmDialog
        isOpen={confirmLogout}
        title="Sign out?"
        message="Are you sure you want to sign out? Make sure to save any unsaved work before confirming."
        confirmLabel="Sign out"
        cancelLabel="Stay"
        variant="danger"
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
          navigate(ROUTES.PUBLIC.LOGIN);
        }}
        onClose={() => setConfirmLogout(false)}
      />

    </div>
  );
}
