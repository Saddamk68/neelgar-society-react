import { MENU } from "../config/menu";

export type BreadcrumbItem = {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

/**
 * Builds breadcrumb items based on the current pathname.
 * Examples:
 *   /app/members           → [ Members ]
 *   /app/members/new       → [ Members, Add Member ]
 *   /app/members/import    → [ Members, Import Members ]
 *   /app/members/NEE2603-4F7A9C/view  → [ Members, View Member ]
 *   /app/members/NEE2603-4F7A9C/edit  → [ Members, Edit Member ]
 */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [];

  for (const item of MENU) {
    if (item.path && pathname.startsWith(item.path)) {
      crumbs.push({ label: item.label, path: item.path, icon: item.icon });

      if (pathname.endsWith("/new")) {
        crumbs.push({ label: "Add Member" });
      } else if (pathname.endsWith("/import")) {
        crumbs.push({ label: "Import Members" });
      } else if (pathname.endsWith("/view")) {
        crumbs.push({ label: "View Member" });
      } else if (pathname.endsWith("/edit")) {
        crumbs.push({ label: "Edit Member" });
      } else if (pathname.endsWith("/print")) {
        crumbs.push({ label: "Print Member" });
      }

      break;
    }
  }

  // Fallback → Dashboard
  if (crumbs.length === 0) {
    const dashboard = MENU.find((m) => m.key === "dashboard");
    if (dashboard) {
      crumbs.push({ label: dashboard.label, path: dashboard.path, icon: dashboard.icon });
    }
  }

  return crumbs;
}
