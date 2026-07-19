import {
  Home,
  Users,
  FileText,
  User,
  BookOpen,
  Shield,
  MapPin,
  Landmark,
  Database,
  CalendarDays,
  ClipboardCheck,
  Mail
} from "lucide-react";
import { NAV, PRIVATE } from "../constants/messages";
import { PERM } from "../constants/permissions";
import type { Perm } from "../constants/permissions";

export type MenuItem = {
  key: string;
  label: string;
  path?: string;
  section?: string;
  required?: Perm[];
  children?: MenuItem[];
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

export const MENU: MenuItem[] = [
  {
    key: "dashboard",
    label: NAV.DASHBOARD,
    path: "/app/dashboard",
    section: "MAIN",
    required: [PERM.VIEW_DASHBOARD],
    icon: Home,
  },
  {
    key: "members-group",
    label: PRIVATE.MEMBERS_TITLE,
    section: "MEMBERS",
    required: [PERM.MEMBER_VIEW],
    icon: Users,
    children: [
      {
        key: "member-applications",
        label: "Applications",
        path: "/app/member-applications",
        required: [PERM.MEMBER_APPLICATION_REVIEW],
        icon: ClipboardCheck,
      },
      {
        key: "member-edit-requests",
        label: "Edit Requests",
        path: "/app/member-edit-requests",
        required: [PERM.MEMBER_EDIT_REQUEST_REVIEW],
        icon: ClipboardCheck,
      },
      {
        key: "families",
        label: "Families",
        path: "/app/families",
        required: [PERM.FAMILY_VIEW],
      },
      {
        key: "members",
        label: "Members",
        path: "/app/members",
        required: [PERM.MEMBER_VIEW],
      },
    ],
  },
  {
    key: "events",
    label: "Events",
    path: "/app/events",
    section: "ADMINISTRATION",
    required: [PERM.EVENT_MANAGE],
    icon: CalendarDays,
  },
  {
    key: "users",
    label: PRIVATE.USERS_TITLE,
    path: "/app/users",
    required: [PERM.USER_MANAGE],
    icon: User,
  },
  {
    key: "logs",
    label: PRIVATE.LOGS_TITLE,
    path: "/app/logs",
    required: [PERM.VIEW_LOGS],
    icon: FileText,
  },
  {
    key: "gotras",
    label: "Gotras",
    path: "/app/gotras",
    required: [PERM.GOTRA_MANAGE],
    icon: BookOpen,
  },
  {
    key: "local-authority",
    label: "Local Leadership",
    path: "/app/local-authority",
    required: [PERM.USER_MANAGE],
    icon: Landmark,
  },
  {
    key: "permissions",
    label: "Permissions",
    path: "/app/permissions",
    required: [PERM.USER_MANAGE],
    icon: Shield,
  },
  {
    key: "backups",
    label: "Database Backups",
    path: "/app/backups",
    required: [PERM.DB_BACKUP_MANAGE],
    icon: Database,
  },
  {
    key: "email-settings",
    label: "Email Settings",
    path: "/app/email-settings",
    required: [PERM.EMAIL_SETTINGS_MANAGE],
    icon: Mail,
  },
  {
    key: "geo-units",
    label: "States / Districts / Towns",
    path: "/app/geo-units",
    required: [PERM.GEO_UNIT_MANAGE],
    icon: MapPin,
  },

];

export const MEMBER_MENU: MenuItem[] = [
  {
    key: "dashboard",
    label: NAV.DASHBOARD,
    path: "/app/dashboard",
    section: "MAIN",
    icon: Home,
  },
  {
    key: "my-family",
    label: "My Family",
    path: "/app/my-family",
    section: "MAIN",
    icon: Users,
  },
];
