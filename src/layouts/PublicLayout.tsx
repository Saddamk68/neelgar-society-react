import { Link, Outlet } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { APP, NAV } from "../constants/messages";
import SkipLink from "../components/SkipLink";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <SkipLink />

      <header role="banner" className="h-16 border-b bg-surface flex items-center justify-between px-4">
        <div className="font-bold text-primary tracking-wide" aria-label={`${APP.NAME} logo`}>
          {APP.NAME}
        </div>
        <nav aria-label="Public navigation" className="flex items-center gap-4 text-sm">
          <Link to={ROUTES.PUBLIC.HOME} className="hover:opacity-80 transition">{NAV.HOME}</Link>
          <Link to={ROUTES.PUBLIC.ABOUT} className="hover:opacity-80 transition">{NAV.ABOUT}</Link>
          <Link to={ROUTES.PUBLIC.CONTACT} className="hover:opacity-80 transition">{NAV.CONTACT}</Link>
          <Link
            to={ROUTES.PUBLIC.LOGIN}
            className="px-3 py-1.5 rounded-md bg-primary text-white shadow-sm hover:shadow transition"
          >
            {NAV.LOGIN}
          </Link>
        </nav>
      </header>

      <main id="main-content" role="main" className="flex-1">
        <Outlet />
      </main>

      <footer role="contentinfo" className="h-12 text-center text-sm text-text-muted bg-slate-50 flex items-center justify-center">
        {APP.COPYRIGHT}
      </footer>
    </div>
  );
}
