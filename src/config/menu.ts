import { NAV, PRIVATE } from "../constants/messages";
import type { Permission } from "../constants/permissions";

export type MenuItem = {
  key: string;
  label: string;
  path?: string;
  required?: Permission[];     // permissions needed to see this item
  children?: MenuItem[];       // optional sub-items
};

export const MENU: MenuItem[] = [
  {
    key: "dashboard",
    label: NAV.DASHBOARD,
    path: "/app/dashboard",
    required: ["VIEW_DASHBOARD"],
  },
  {
    key: "members",
    label: PRIVATE.MEMBERS_TITLE,
    path: "/app/members",
    required: ["VIEW_MEMBERS"],
  },
  {
    key: "logs",
    label: PRIVATE.LOGS_TITLE,
    path: "/app/logs",
    required: ["VIEW_LOGS"],
  },
  {
    key: "users",
    label: PRIVATE.USERS_TITLE,
    path: "/app/users",
    required: ["MANAGE_USERS"],
  },
];
