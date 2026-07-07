import logoSm from "../assets/logo/neelgar-society-logo-sm.png";
import { Link, NavLink, Outlet } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { APP, NAV } from "../constants/messages";
import SkipLink from "../components/SkipLink";
import { useState } from "react";

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <SkipLink />

      {/* ── Header ── */}
      <header
        role="banner"
        className="sticky top-0 z-20 h-16 border-b bg-surface flex items-center justify-between px-6 shadow-sm"
      >
        {/* Brand */}
        <Link
          to={ROUTES.PUBLIC.HOME}
          className="flex items-center gap-2 font-bold text-primary tracking-wide text-lg"
          aria-label={`${APP.NAME} home`}
        >
          <img src={logoSm} alt="" className="w-14 h-14 object-cover" />
          {APP.NAME}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Public navigation" className="hidden md:flex items-center gap-6 text-sm">
          <NavLink
            to={ROUTES.PUBLIC.HOME}
            end
            className={({ isActive }) =>
              isActive ? "text-primary font-medium" : "text-text-muted hover:text-text-primary transition"
            }
          >
            {NAV.HOME}
          </NavLink>
          <NavLink
            to={ROUTES.PUBLIC.ABOUT}
            className={({ isActive }) =>
              isActive ? "text-primary font-medium" : "text-text-muted hover:text-text-primary transition"
            }
          >
            {NAV.ABOUT}
          </NavLink>
          <NavLink
            to={ROUTES.PUBLIC.LEADERSHIP}
            className={({ isActive }) =>
              isActive ? "text-primary font-medium" : "text-text-muted hover:text-text-primary transition"
            }
          >
            {NAV.LEADERSHIP}
          </NavLink>
          <NavLink
            to={ROUTES.PUBLIC.CONTACT}
            className={({ isActive }) =>
              isActive ? "text-primary font-medium" : "text-text-muted hover:text-text-primary transition"
            }
          >
            {NAV.CONTACT}
          </NavLink>
          <Link
            to={ROUTES.PUBLIC.LOGIN}
            className="px-4 py-1.5 rounded-md bg-primary text-white text-sm shadow-sm hover:opacity-90 transition"
          >
            {NAV.LOGIN}
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-slate-100 transition"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <div className="md:hidden bg-surface border-b shadow-sm px-6 py-4 flex flex-col gap-4 text-sm z-10">
          <NavLink
            to={ROUTES.PUBLIC.HOME}
            end
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              isActive ? "text-primary font-medium" : "text-text-muted"
            }
          >
            {NAV.HOME}
          </NavLink>
          <NavLink
            to={ROUTES.PUBLIC.ABOUT}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              isActive ? "text-primary font-medium" : "text-text-muted"
            }
          >
            {NAV.ABOUT}
          </NavLink>
          <NavLink
            to={ROUTES.PUBLIC.LEADERSHIP}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              isActive ? "text-primary font-medium" : "text-text-muted"
            }
          >
            {NAV.LEADERSHIP}
          </NavLink>
          <NavLink
            to={ROUTES.PUBLIC.CONTACT}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              isActive ? "text-primary font-medium" : "text-text-muted"
            }
          >
            {NAV.CONTACT}
          </NavLink>
          <Link
            to={ROUTES.PUBLIC.LOGIN}
            onClick={() => setMenuOpen(false)}
            className="w-fit px-4 py-1.5 rounded-md bg-primary text-white shadow-sm hover:opacity-90 transition"
          >
            {NAV.LOGIN}
          </Link>
        </div>
      )}

      {/* ── Page content ── */}
      <main id="main-content" role="main" className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer
        role="contentinfo"
        className="h-12 text-center text-sm text-text-muted bg-slate-50 border-t flex items-center justify-center"
      >
        {APP.COPYRIGHT}
      </footer>
    </div>
  );
}
