import { Home, Users, FileText, User, BookOpen } from "lucide-react";
import { NAV, PRIVATE } from "../constants/messages";
import type { Permission } from "../constants/permissions";

export type MenuItem = {
  key: string;
  label: string;
  path?: string;
  required?: Permission[];      // permissions needed to see this item
  children?: MenuItem[];        // optional sub-items
  icon?: React.ComponentType<{ size?: number; className?: string }>; // optional icon
};

export const MENU: MenuItem[] = [
  {
    key: "dashboard",
    label: NAV.DASHBOARD,
    path: "/app/dashboard",
    required: ["VIEW_DASHBOARD"],
    icon: Home,
  },
  {
    key: "members-group",
    label: PRIVATE.MEMBERS_TITLE,
    required: ["VIEW_MEMBERS"],
    icon: Users,
    children: [
      {
        key: "members",
        label: "All Members",
        path: "/app/members",
        required: ["VIEW_MEMBERS"],
      },
      {
        key: "families",
        label: "Family Directory",
        path: "/app/families",
        required: ["VIEW_FAMILIES"],
      },
    ],
  },
  {
    key: "logs",
    label: PRIVATE.LOGS_TITLE,
    path: "/app/logs",
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
