import { SkeletonBox } from "./Primitive";

// Minimal shape we care about (matches your MEMBER_COLUMNS entries)
type Column = {
  key: string;
  title: string;
  hideBelow?: "sm" | "md" | "lg";
  width?: string;
  weight?: number;
};

type TableSkeletonProps = {
  columns: readonly Column[]; // 🔹 allow readonly arrays
  rows?: number;
};

export default function TableSkeleton({ columns, rows = 8 }: TableSkeletonProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 text-left font-medium text-gray-500 ${
                  col.hideBelow ? `hidden ${col.hideBelow}:table-cell` : ""
                }`}
                style={col.width ? { width: col.width } : {}}
              >
                <SkeletonBox className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2 ${
                    col.hideBelow ? `hidden ${col.hideBelow}:table-cell` : ""
                  }`}
                >
                  <SkeletonBox className="h-4 w-24" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
