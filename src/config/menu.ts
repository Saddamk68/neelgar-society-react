import { Home, Users, FileText, User, BookOpen, Shield, MapPin, Landmark } from "lucide-react";
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
        key: "members",
        label: "Members",
        path: "/app/members",
        required: [PERM.MEMBER_VIEW],
      },
      {
        key: "families",
        label: "Families",
        path: "/app/families",
        required: [PERM.FAMILY_VIEW],
      },
    ],
  },
  {
    key: "logs",
    label: PRIVATE.LOGS_TITLE,
    path: "/app/logs",
    section: "ADMINISTRATION",
    required: [PERM.VIEW_LOGS],
    icon: FileText,
  },
  {
    key: "users",
    label: PRIVATE.USERS_TITLE,
    path: "/app/users",
    required: [PERM.USER_MANAGE],
    icon: User,
  },
  {
    key: "gotras",
    label: "Gotras",
    path: "/app/gotras",
    required: [PERM.GOTRA_MANAGE],
    icon: BookOpen,
  },
  {
    key: "geo-units",
    label: "States / Districts / Villages",
    path: "/app/geo-units",
    required: [PERM.GEO_UNIT_MANAGE],
    icon: MapPin,
  },
  {
    key: "local-authority",
    label: "Village Leadership",
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

];
