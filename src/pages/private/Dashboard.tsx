import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, Home, UserPlus, Download, UserCheck, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getDashboardStats } from "../../features/dashboard/dashboardService";
import { getMember } from "../../features/members/services/memberService";
import { ROUTES } from "../../constants/routes";
import { Member } from "../../features/members/types";
import { DashboardStats } from "../../features/dashboard/dashboardService";
import { usePermission } from "../../hooks/usePermission";
import { PERM } from "../../constants/permissions";
import { MyLeadership } from "@/features/local-authority/local-authority-types";
import { getMyLeadership } from "@/features/local-authority/services/localAuthorityService";
import UpcomingEventsWidget from "@/features/events/components/UpcomingEventsWidget";
import NoticesBanner from "@/features/notices/components/NoticesBanner";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ── Quick action button ───────────────────────────────────────────────────────

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow hover:shadow-md hover:bg-slate-50 transition text-sm font-medium text-slate-700"
    >
      <Icon className="w-6 h-6 text-primary" />
      {label}
    </Link>
  );
}

// ── Admin dashboard ───────────────────────────────────────────────────────────

function AdminDashboard({ stats }: { stats: DashboardStats }) {
  const { can } = usePermission();
  const canManageUsers = can(PERM.USER_MANAGE);
  const canImport = can(PERM.IMPORT_MEMBERS);

  return (
    <div className="space-y-6">

      {/* Society name */}
      <div>
        <h1 className="text-2xl font-semibold">
          {stats.societyName}
          <span className="ml-2 text-base font-normal text-slate-400">
            ({stats.societyCode})
          </span>
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Society overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={stats.totalMembers}
          icon={Users}
          accent="bg-blue-500"
        />
        <StatCard
          label="Total Families"
          value={stats.totalFamilies}
          icon={Home}
          accent="bg-indigo-500"
        />
        <StatCard
          label="New This Month"
          value={stats.newMembersThisMonth}
          icon={TrendingUp}
          accent="bg-green-500"
        />
        {stats.pendingUsers != null && (
          <StatCard
            label="Pending Approvals"
            value={stats.pendingUsers}
            icon={UserCheck}
            accent={stats.pendingUsers > 0 ? "bg-amber-500" : "bg-slate-400"}
          />
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            to={`${ROUTES.PRIVATE.MEMBERS}/new`}
            icon={UserPlus}
            label="Add Member"
          />
          {canImport && (
            <QuickAction
              to={`${ROUTES.PRIVATE.MEMBERS}/import`}
              icon={Download}
              label="Import Members"
            />
          )}
          <QuickAction
            to={ROUTES.PRIVATE.MEMBERS}
            icon={Users}
            label="View Members"
          />
          {canManageUsers && (
            <QuickAction
              to={ROUTES.PRIVATE.USERS}
              icon={UserCheck}
              label="Manage Users"
            />
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Upcoming Events
        </h2>
        <NoticesBanner />      
        <UpcomingEventsWidget limit={5} calendarRoute={ROUTES.PRIVATE.EVENTS} />
      </div>

    </div>
  );
}

// ── Member dashboard (own profile) ───────────────────────────────────────────

function MemberDashboard({ memberCode }: { memberCode: string }) {
  const { data: member, isLoading, isError } = useQuery<Member>({
    queryKey: ["member", memberCode],
    queryFn: () => getMember(memberCode),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-sm text-slate-500">
        Loading your profile…
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-sm text-red-500">
        Could not load your profile.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome, {member.firstName} {member.lastName ?? ""}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Your member profile</p>
      </div>

      <VillageLeadershipCard />
      <NoticesBanner />      
      <UpcomingEventsWidget limit={5} />

      {/* Profile card */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-lg font-semibold text-slate-800">
              {member.firstName} {member.lastName ?? ""}
            </div>
            <div className="text-sm text-slate-500 mt-0.5">{member.memberCode}</div>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {[
            { label: "Family", value: member.familyCode },
            { label: "Society", value: member.societyCode },
            { label: "Gender", value: member.gender },
            { label: "Date of Birth", value: member.dob },
            { label: "Contact", value: member.contactNumber },
            { label: "Education", value: member.education },
            { label: "Occupation", value: member.occupation },
            { label: "Village", value: (member as any).currentAddress?.village },
          ].map(({ label, value }) => value ? (
            <div key={label} className="flex gap-2">
              <span className="w-32 text-slate-400 shrink-0">{label}</span>
              <span className="font-medium text-slate-800">{value}</span>
            </div>
          ) : null)}
        </div>

        <div className="mt-5 pt-4 border-t flex gap-3">
          <Link
            to={`${ROUTES.PRIVATE.MEMBERS}/${member.memberCode}/view`}
            className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
          >
            View Full Details
          </Link>
        </div>
      </div>
    </div>
  );
}

function VillageLeadershipCard() {
  const { data, isLoading } = useQuery<MyLeadership>({
    queryKey: ["my-leadership"],
    queryFn: getMyLeadership,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <div className="bg-white rounded-xl shadow p-6 h-20 animate-pulse" />;
  }

  if (!data || !data.myGeoUnitName) {
    return null; // no village assigned yet — don't show an empty/confusing card
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-sm font-semibold text-slate-500 mb-3">
        Your Local Leadership — {data.myGeoUnitName}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["president", "secretary"] as const).map((key) => {
          const officer = data[key];
          return (
            <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                {key === "president" ? "P" : "S"}
              </div>
              <div>
                <div className="text-xs text-slate-400">
                  {key === "president" ? "President" : "Secretary"}
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {officer ? (officer.personName ?? officer.username) : "Not yet assigned"}
                </div>
                {officer && (
                  <div className="text-xs text-slate-400">{officer.geoUnitName}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, role } = useAuth();

  const isMemberOnly = role === "MEMBER";

  // Stats query — only for non-member roles
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    enabled: !isMemberOnly,
    staleTime: 1000 * 60 * 2,
  });

  // ── MEMBER role — show own profile ────────────────────────────────────────

  if (isMemberOnly) {
    if (!user?.memberCode) {
      return (
        <div className="text-sm text-slate-500">
          No member profile linked to your account.
        </div>
      );
    }
    return <MemberDashboard memberCode={user.memberCode} />;
  }

  // ── Admin / Editor roles — show stats ─────────────────────────────────────

  if (statsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-sm text-red-500">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  return <AdminDashboard stats={stats} />;
}
