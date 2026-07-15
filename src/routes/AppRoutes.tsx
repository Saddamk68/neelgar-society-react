import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PublicLayout from "../layouts/PublicLayout";
import PrivateLayout from "../layouts/PrivateLayout";
import Home from "../pages/public/Home";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import Login from "../pages/public/Login";
import EventsCalendar from "@/pages/public/EventsCalendar";
import Dashboard from "../pages/private/Dashboard";
import Members from "../pages/private/Members";
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
import LogsPage from "@/pages/private/logs/LogsPage";
import { usePermission } from "@/hooks/usePermission";
import { PERM } from "@/constants/permissions";
import Permissions from "@/pages/private/Permissions";
import LocalAuthority from "@/pages/private/LocalAuthority";
import Leadership from "@/pages/public/Leadership";
import GeoUnits from "@/pages/private/GeoUnits";
import Backups from "@/pages/private/Backups";
import Events from "@/pages/private/Events";
import AddEvent from "@/pages/private/events/AddEvent";
import EditEvent from "@/pages/private/events/EditEvent";
import MembershipApplication from "@/pages/public/MembershipApplication";
import ApplicationStatus from "@/pages/public/ApplicationStatus";
import Membership from "@/pages/public/Membership";
import MemberApplications from "@/pages/private/MemberApplications";
import MemberApplicationDetail from "@/pages/private/member-applications/MemberApplicationDetail";
import EmailSettings from "@/pages/private/EmailSettings";

/**
 * RequireAuth now respects `isInitializing` from AuthContext.
 * - While initializing (rehydrating / trying refresh) it renders nothing (or a spinner).
 * - After init, if not authenticated, it redirects to login.
 * - If authenticated, it renders the protected outlet.
 */
function RequireAuth() {
  const { isAuthenticated, isInitializing, mustChangePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && mustChangePassword) {
      navigate(ROUTES.PRIVATE.PROFILE, { replace: true });
    }
  }, [isAuthenticated, mustChangePassword, navigate]);

  if (isInitializing) {
    return null;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.PUBLIC.LOGIN} replace />;
}

function RequirePermission({
  perm,
  children,
}: {
  perm: string;
  children: React.ReactElement;
}) {
  const { can } = usePermission();
  const { isInitializing, isAuthenticated, permissions } = useAuth();

  // Wait for auth to finish initialising AND permissions to be loaded
  if (isInitializing) return null;
  if (!isAuthenticated) return null;
  if (permissions.length === 0) return null;

  if (!can(perm as any)) return <Navigate to={ROUTES.PRIVATE.DASHBOARD} replace />;
  return children;
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
        <Route path={ROUTES.PUBLIC.LEADERSHIP} element={<Leadership />} />
        <Route path={ROUTES.PUBLIC.EVENTS} element={<EventsCalendar />} />
        <Route path={ROUTES.PUBLIC.MEMBERSHIP_APPLICATION} element={<MembershipApplication />} />
        <Route path={ROUTES.PUBLIC.APPLICATION_STATUS} element={<ApplicationStatus />} />
        <Route path={ROUTES.PUBLIC.MEMBERSHIP} element={<Membership />} />
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
          <Route path="members/new" element={
            <RequirePermission perm={PERM.MEMBER_CREATE}><AddMember /></RequirePermission>
          } />
          <Route path="members/:memberCode/edit" element={
            <RequirePermission perm={PERM.MEMBER_UPDATE}><EditMember /></RequirePermission>
          } />
          <Route path="members/:memberCode/view" element={<ViewMember />} />
          <Route path="members/:memberCode/print" element={<PrintMember />} />
          <Route path="members/:memberCode/lineage" element={<LineageView />} />
          <Route path="members/import" element={
            <RequirePermission perm={PERM.IMPORT_MEMBERS}><ImportMembers /></RequirePermission>
          } />
          <Route path="families" element={<Families />} />
          <Route path="families/:familyCode/edit" element={
            <RequirePermission perm={PERM.FAMILY_CREATE}><EditFamily /></RequirePermission>
          } />
          <Route path="families/:familyCode/view" element={<ViewFamily />} />
          <Route path="families/:familyCode/print" element={<PrintFamily />} />
          <Route path="logs" element={
            <RequirePermission perm={PERM.VIEW_LOGS}><LogsPage /></RequirePermission>
          } />
          <Route path="member-applications" element={
            <RequirePermission perm={PERM.MEMBER_APPLICATION_REVIEW}><MemberApplications /></RequirePermission>
          } />
          <Route path="member-applications/:id" element={
            <RequirePermission perm={PERM.MEMBER_APPLICATION_REVIEW}><MemberApplicationDetail /></RequirePermission>
          } />
          <Route path="email-settings" element={
            <RequirePermission perm={PERM.EMAIL_SETTINGS_MANAGE}><EmailSettings /></RequirePermission>
          } />
          <Route
            path={ROUTES.PRIVATE.USERS.replace("/app/", "")}
            element={
              <RequirePermission perm={PERM.USER_MANAGE}><Users /></RequirePermission>
            }
          />
          <Route path="profile" element={<ViewProfile />} />
          <Route path="gotras" element={
            <RequirePermission perm={PERM.GOTRA_MANAGE}><Gotras /></RequirePermission>
          } />
          <Route path="geo-units" element={
            <RequirePermission perm={PERM.GEO_UNIT_MANAGE}><GeoUnits /></RequirePermission>
          } />
          <Route path="local-authority" element={
            <RequirePermission perm={PERM.USER_MANAGE}><LocalAuthority /></RequirePermission>
          } />
          <Route path="permissions" element={
            <RequirePermission perm={PERM.USER_MANAGE}>
              <Permissions />
            </RequirePermission>
          } />
          <Route path="backups" element={
            <RequirePermission perm={PERM.DB_BACKUP_MANAGE}><Backups /></RequirePermission>
          } />
          <Route path="events" element={
            <RequirePermission perm={PERM.EVENT_MANAGE}><Events /></RequirePermission>
          } />
          <Route path="events/new" element={
            <RequirePermission perm={PERM.EVENT_MANAGE}><AddEvent /></RequirePermission>
          } />
          <Route path="events/:id/edit" element={
            <RequirePermission perm={PERM.EVENT_MANAGE}><EditEvent /></RequirePermission>
          } />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.PUBLIC.HOME} replace />} />
    </Routes>
  );
}
