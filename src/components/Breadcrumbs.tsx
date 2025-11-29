import { Link, useLocation } from "react-router-dom";
import { buildBreadcrumbs } from "../utils/breadcrumbs";

export default function Breadcrumbs() {
  const location = useLocation();
  const crumbs = buildBreadcrumbs(location.pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-600">
      {crumbs.map((crumb, idx) => {
        const Icon = crumb.icon;
        const isLast = idx === crumbs.length - 1;

        return (
          <span key={idx} className="flex items-center gap-1">
            {Icon && <Icon size={16} className="text-gray-400" />}
            {!isLast && crumb.path ? (
              <Link to={crumb.path} className="hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-800">{crumb.label}</span>
            )}
            {!isLast && <span className="mx-1 text-gray-400">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
