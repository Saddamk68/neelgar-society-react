import React from "react";
import { SkeletonBox } from "./Primitive";

type ListSkeletonProps = {
  rows?: number;
};

export function ListSkeleton({ rows = 6 }: ListSkeletonProps) {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <SkeletonBox className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-1/3" />
            <SkeletonBox className="h-3 w-1/2" />
          </div>
          <SkeletonBox className="h-6 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}
