import React, { useEffect, useRef, useState } from "react";
import Tooltip from "./Tooltip";

export type ColumnConfig<T = any> = {
  key: keyof T | string;
  title: string;
  headerRenderer?: () => React.ReactNode;
  weight?: number;
  width?: string;
  align?: "center" | "left";
  truncate?: boolean;
  tooltip?: boolean;
  sortable?: boolean;
  hideBelow?: "sm" | "md" | "lg";
};

export type SortConfig = {
  key: string | null;
  direction: "asc" | "desc";
};

export type ResponsiveTableProps<T> = {
  columns: ColumnConfig<T>[];
  data: T[];
  className?: string;
  sortConfig?: SortConfig;
  onSort?: (key: string) => void;
  renderCell?: (row: T, col: ColumnConfig<T>) => React.ReactNode;
  rowKey?: (row: T) => string | number;
  expandedRowKey?: string | number | null;
  renderExpandedRow?: (row: T) => React.ReactNode;
};

function parsePx(w?: string) {
  if (!w) return 0;
  const match = String(w).match(/^(\d+)\s*px$/);
  return match ? Number(match[1]) : 0;
}

// Tailwind default breakpoints
const BREAKPOINTS: Record<"sm" | "md" | "lg", number> = {
  sm: 640,
  md: 768,
  lg: 1024,
};

/** Tracks current window width so we can drop hidden columns from the DOM
 *  entirely (instead of just CSS-hiding cells), which keeps table-fixed
 *  column widths accurate. */
function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

function isColumnVisible(col: { hideBelow?: "sm" | "md" | "lg" }, width: number) {
  if (!col.hideBelow) return true;
  return width >= BREAKPOINTS[col.hideBelow];
}

/**
 * Truncatable span:
 * - renders a span with CSS truncation (inline-block width:100%)
 * - measures overflow using scrollWidth > clientWidth
 * - if overflow and tooltipOnOverflow true -> wraps with Tooltip
 * - sets tabIndex=0 so keyboard users can focus to trigger tooltip
 */
function Truncatable({
  text,
  tooltipOnOverflow,
  offset,
}: {
  text: React.ReactNode;
  tooltipOnOverflow?: boolean;
  offset?: number;
}) {
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const check = () => {
      // Use scrollWidth/clientWidth to detect truncation
      const isOverflow = el.scrollWidth > el.clientWidth + 1;
      setOverflowing(isOverflow);
    };

    // initial check after layout
    requestAnimationFrame(check);

    // observe for changes (font/load/resize)
    const ro = new ResizeObserver(check);
    ro.observe(el);

    // also check on window resize
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [text]);

  // inline-block width:100% so it fills the cell wrapper and is measurable
  const content = (
    <span
      ref={spanRef}
      tabIndex={0}
      className="truncate inline-block"
      style={{
        width: "100%",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {text ?? "-"}
    </span>
  );

  if (tooltipOnOverflow && overflowing) {
    return <Tooltip content={String(text ?? "")} offset={offset ?? 18}>{content}</Tooltip>;
  }

  return content;
}

export default function ResponsiveTable<T>({
  columns,
  data,
  className,
  sortConfig,
  onSort,
  renderCell,
  rowKey,
  expandedRowKey,
  renderExpandedRow,
}: ResponsiveTableProps<T>) {
  const width = useWindowWidth();

  // Only columns that should actually render at this width —
  // this is what fixes the blank reserved-space bug.
  const visibleColumns = columns.filter((c) => isColumnVisible(c, width));

  const hasWeights = visibleColumns.some((c) => typeof c.weight === "number" && c.weight > 0);

  let colPercents: string[] = [];

  if (hasWeights) {
    const totalWeight = visibleColumns.reduce((s, c) => s + (c.weight ?? 0), 0) || visibleColumns.length;
    colPercents = visibleColumns.map((c) => `${Math.round(((c.weight ?? 0) / totalWeight) * 10000) / 100}%`);
  } else {
    const numericWidths = visibleColumns.map((c) => parsePx(c.width));
    const totalPx = numericWidths.reduce((s, v) => s + v, 0);
    if (totalPx > 0) {
      colPercents = numericWidths.map((px) => (px > 0 ? `${(px / totalPx) * 100}%` : `${(1 / visibleColumns.length) * 100}%`));
    } else {
      const per = 100 / visibleColumns.length;
      colPercents = visibleColumns.map(() => `${per}%`);
    }
  }

  const handleHeaderClick = (col: ColumnConfig<T>) => {
    if (!col.sortable || !onSort) return;
    onSort(String(col.key));
  };

  const getThAlign = (col: ColumnConfig<T>) => (col.align === "center" ? "text-center" : "text-left");

  return (
    <div className={`overflow-x-auto ${className ?? ""}`}>
      <table className="table-fixed w-full text-sm border-collapse">
        <colgroup>
          {visibleColumns.map((col, i) => (
            <col key={String(col.key)} style={{ width: colPercents[i] }} />
          ))}
        </colgroup>

        <thead className="sticky top-0 z-10 bg-gray-200 shadow-sm">
          <tr>
            {visibleColumns.map((col) => {
              const isActive = sortConfig?.key === String(col.key);

              const headerTitle = (
                <div
                  style={{
                    minWidth: 0,
                    maxWidth: "100%",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                >
                  {col.title}
                </div>
              );

              return (
                <th
                  key={String(col.key)}
                  scope="col"
                  className={`py-3 px-4 font-bold text-gray-800 text-sm uppercase tracking-wide border-b ${getThAlign(col)
                    } ${col.sortable ? "cursor-pointer select-none" : ""}`}
                  style={{
                    width: col.width ?? undefined,
                    minWidth: 0,
                    maxWidth: "100%",
                  }}
                  onClick={() => handleHeaderClick(col)}
                >
                  {col.headerRenderer ? (
                    col.headerRenderer()
                  ) : (
                    <span
                      className="inline-flex items-center gap-1"
                      style={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}
                    >
                      {headerTitle}
                      {col.sortable && isActive && (
                        <span className="ml-0.5 text-xs" aria-hidden>
                          {sortConfig?.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {data.length > 0 ? (
            data.map((row, rIdx) => {
              const key = rowKey ? String(rowKey(row)) : String((row as any).id ?? rIdx);
              const isExpanded = expandedRowKey != null && String(expandedRowKey) === key;

              return (
                <React.Fragment key={key}>
                  <tr
                    className={`${rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-primary/5 transition-colors`}
                  >
                    {visibleColumns.map((col) => {
                      const alignStyle = { textAlign: col.align === "center" ? "center" : "left" } as React.CSSProperties;

                      if (renderCell) {
                        const rendered = renderCell(row, col);
                        if (rendered !== undefined && rendered !== null) {
                          return (
                            <td
                              key={String(col.key)}
                              className="py-2 px-4 border-b"
                              style={{ ...alignStyle, minWidth: 0, overflow: "hidden" }}
                            >
                              <div style={{ minWidth: 0 }}>{rendered}</div>
                            </td>
                          );
                        }
                      }

                      const raw = (row as any)[col.key];

                      if (col.truncate || col.tooltip) {
                        return (
                          <td
                            key={String(col.key)}
                            className="py-2 px-4 border-b"
                            style={{ ...alignStyle, minWidth: 0, overflow: "hidden" }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <Truncatable text={raw ?? "-"} tooltipOnOverflow={Boolean(col.tooltip)} offset={18} />
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={String(col.key)}
                          className="py-2 px-4 border-b"
                          style={{ ...alignStyle, minWidth: 0, overflow: "hidden" }}
                        >
                          <div style={{ minWidth: 0 }}>{raw ?? "-"}</div>
                        </td>
                      );
                    })}
                  </tr>

                  {isExpanded && renderExpandedRow && renderExpandedRow(row)}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan={visibleColumns.length} className="py-6 text-center text-text-muted">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
