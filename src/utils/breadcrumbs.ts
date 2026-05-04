import { MENU, MenuItem } from "../config/menu";

export type BreadcrumbItem = {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
};

// Flatten menu tree into a single list of items that have paths,
// carrying the parent's icon for the first crumb when inside a group.
function flattenMenu(items: MenuItem[], parentIcon?: MenuItem["icon"]): {
  path: string;
  label: string;
  icon?: MenuItem["icon"];
  groupLabel?: string;
  groupPath?: string;
  groupIcon?: MenuItem["icon"];
}[] {
  const result: ReturnType<typeof flattenMenu> = [];

  for (const item of items) {
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        if (child.path) {
          result.push({
            path: child.path,
            label: child.label,
            icon: item.icon,           // child uses parent's icon
            groupLabel: item.label,
            groupPath: child.path,     // no single path for the group itself
            groupIcon: item.icon,
          });
        }
      }
    } else if (item.path) {
      result.push({
        path: item.path,
        label: item.label,
        icon: item.icon ?? parentIcon,
      });
    }
  }

  return result;
}

/**
 * Builds breadcrumb items based on the current pathname.
 * Handles both flat and grouped menu items.
 *
 * Examples:
 *   /app/members                          → [ All Members ]
 *   /app/members/NEE2603/view             → [ All Members > View Member ]
 *   /app/members/NEE2603/edit             → [ All Members > Edit Member ]
 *   /app/members/new                      → [ All Members > Add Member ]
 *   /app/members/import                   → [ All Members > Import Members ]
 *   /app/families                         → [ Family Directory ]
 *   /app/families/FAM-001/view            → [ Family Directory > View Family ]
 *   /app/families/FAM-001/print           → [ Family Directory > Print Family ]
 */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [];
  const flat = flattenMenu(MENU);

  // longest path match wins — prevents /app/members matching /app/families
  const matched = flat
    .filter((entry) => pathname.startsWith(entry.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

  if (matched) {
    // Root crumb — the list page
    crumbs.push({
      label: matched.label,
      path: matched.path,
      icon: matched.icon,
    });

    // ── Members sub-pages ──────────────────────────────────────────────────
    if (matched.path.includes("/members")) {
      if (pathname.endsWith("/new")) crumbs.push({ label: "Add Member" });
      else if (pathname.endsWith("/import")) crumbs.push({ label: "Import Members" });
      else if (pathname.endsWith("/view")) crumbs.push({ label: "View Member" });
      else if (pathname.endsWith("/edit")) crumbs.push({ label: "Edit Member" });
      else if (pathname.endsWith("/print")) crumbs.push({ label: "Print Member" });
    }

    // ── Families sub-pages ─────────────────────────────────────────────────
    if (matched.path.includes("/families")) {
      if (pathname.endsWith("/view")) crumbs.push({ label: "View Family" });
      else if (pathname.endsWith("/print")) crumbs.push({ label: "Print Family" });
    }
  } else {
    // Fallback → Dashboard
    const dashboard = MENU.find((m) => m.key === "dashboard");
    if (dashboard) {
      crumbs.push({ label: dashboard.label, path: dashboard.path, icon: dashboard.icon });
    }
  }

  return crumbs;
}
