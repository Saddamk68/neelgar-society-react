import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import PrivateLayout from "../layouts/PrivateLayout";
import Home from "../pages/public/Home";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import Login from "../pages/public/Login";
import Dashboard from "../pages/private/Dashboard";
import Members from "../pages/private/Members";
import Logs from "../pages/private/Logs";
import Users from "../pages/private/Users";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../context/AuthContext";
import AddMember from "../pages/private/members/AddMember";
import EditMember from "../pages/private/members/EditMember";
import ViewMember from "../pages/private/members/ViewMember";

/**
 * RequireAuth now respects `isInitializing` from AuthContext.
 * - While initializing (rehydrating / trying refresh) it renders nothing (or a spinner).
 * - After init, if not authenticated, it redirects to login.
 * - If authenticated, it renders the protected outlet.
 */
function RequireAuth() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    // While the auth provider is initializing, don't redirect.
    // Optionally return a spinner component here for better UX:
    // return <FullPageSpinner />;
    return null;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.PUBLIC.LOGIN} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.PUBLIC.HOME} element={<Home />} />
        <Route path={ROUTES.PUBLIC.ABOUT} element={<About />} />
        <Route path={ROUTES.PUBLIC.CONTACT} element={<Contact />} />
        <Route path={ROUTES.PUBLIC.LOGIN} element={<Login />} />
      </Route>

      {/* Private */}
      <Route element={<RequireAuth />}>
        <Route path={ROUTES.PRIVATE_BASE} element={<PrivateLayout />}>
          <Route
            path={ROUTES.PRIVATE.DASHBOARD.replace("/app/", "")}
            element={<Dashboard />}
          />
          <Route
            path={ROUTES.PRIVATE.MEMBERS.replace("/app/", "")}
            element={<Members />}
          />
          <Route path="members/new" element={<AddMember />} />
          <Route
            path={ROUTES.PRIVATE.LOGS.replace("/app/", "")}
            element={<Logs />}
          />
          <Route
            path={ROUTES.PRIVATE.USERS.replace("/app/", "")}
            element={<Users />}
          />
          <Route path={`${ROUTES.PRIVATE.MEMBERS}/:id/edit`} element={<EditMember />} />
          <Route path={`${ROUTES.PRIVATE.MEMBERS}/:id/view`} element={<ViewMember />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.PUBLIC.HOME} replace />} />
    </Routes>
  );
}
