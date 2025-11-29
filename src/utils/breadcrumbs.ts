import { MENU } from "../config/menu";

export type BreadcrumbItem = {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

/**
 * Builds breadcrumb items based on the current pathname
 * Example:
 *   /app/members/new → [ Members, Add Member ]
 */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [];

  for (const item of MENU) {
    if (item.path && pathname.startsWith(item.path)) {
      crumbs.push({ label: item.label, path: item.path, icon: item.icon });

      // Handle children/sub-routes (Add/Edit)
      if (pathname.includes("/new")) {
        crumbs.push({ label: "Add Member" });
      } else if (pathname.match(/\/\d+\/edit/)) {
        crumbs.push({ label: "Edit Member" });
      }
      break;
    }
  }

  // Fallback → Dashboard
  if (crumbs.length === 0) {
    const dashboard = MENU.find(m => m.key === "dashboard");
    if (dashboard) {
      crumbs.push({ label: dashboard.label, path: dashboard.path, icon: dashboard.icon });
    }
  }

  return crumbs;
}
