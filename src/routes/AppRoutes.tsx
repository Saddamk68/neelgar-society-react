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
import ViewProfile from "@/pages/private/profile/ViewProfile";
import ImportMembers from "@/pages/private/members/ImportMembers";
import PrintMember from "@/pages/private/members/PrintMember";
import Gotras from "@/pages/private/Gotras";
import Families from "@/pages/private/Families";
import ViewFamily from "@/pages/private/families/ViewFamily";
import PrintFamily from "@/pages/private/families/PrintFamily";
import EditFamily from "@/pages/private/families/EditFamily";
import LineageView from "@/pages/private/members/LineageView";

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
          <Route path="members/:memberCode/edit" element={<EditMember />} />
          <Route path="members/:memberCode/view" element={<ViewMember />} />
          <Route path="members/:memberCode/print" element={<PrintMember />} />
          <Route path="members/:memberCode/lineage" element={<LineageView />} />
          <Route path="members/import" element={<ImportMembers />} />
          <Route path="families" element={<Families />} />
          <Route path="families/:familyCode/edit" element={<EditFamily />} />
          <Route path="families/:familyCode/view" element={<ViewFamily />} />
          <Route path="families/:familyCode/print" element={<PrintFamily />} />
          <Route
            path={ROUTES.PRIVATE.LOGS.replace("/app/", "")}
            element={<Logs />}
          />
          <Route
            path={ROUTES.PRIVATE.USERS.replace("/app/", "")}
            element={<Users />}
          />
          <Route path="profile" element={<ViewProfile />} />
          <Route path="gotras" element={<Gotras />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.PUBLIC.HOME} replace />} />
    </Routes>
  );
}
