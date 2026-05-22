import { Home, Users, FileText, User, BookOpen } from "lucide-react";
import { NAV, PRIVATE } from "../constants/messages";
import type { Permission } from "../constants/permissions";

export type MenuItem = {
  key: string;
  label: string;
  path?: string;
  section?: string;
  required?: Permission[];
  children?: MenuItem[];
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

export const MENU: MenuItem[] = [
  {
    key: "dashboard",
    label: NAV.DASHBOARD,
    path: "/app/dashboard",
    section: "MAIN",
    required: ["VIEW_DASHBOARD"],
    icon: Home,
  },
  {
    key: "members-group",
    label: PRIVATE.MEMBERS_TITLE,
    section: "MEMBERS",
    required: ["VIEW_MEMBERS"],
    icon: Users,
    children: [
      {
        key: "members",
        label: "Members",
        path: "/app/members",
        required: ["VIEW_MEMBERS"],
      },
      {
        key: "families",
        label: "Families",
        path: "/app/families",
        required: ["VIEW_FAMILIES"],
      },
    ],
  },
  {
    key: "logs",
    label: PRIVATE.LOGS_TITLE,
    path: "/app/logs",
    section: "ADMINISTRATION",
    required: ["VIEW_LOGS"],
    icon: FileText,
  },
  {
    key: "users",
    label: PRIVATE.USERS_TITLE,
    path: "/app/users",
    required: ["MANAGE_USERS"],
    icon: User,
  },
  {
    key: "gotras",
    label: "Gotras",
    path: "/app/gotras",
    required: ["MANAGE_GOTRAS"],
    icon: BookOpen,
  },

];
