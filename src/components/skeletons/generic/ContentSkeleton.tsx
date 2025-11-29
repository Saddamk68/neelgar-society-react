import React from "react";
import { SkeletonBox } from "./Primitive";

export default function ContentSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className="p-6 space-y-4">
      <SkeletonBox className="h-8 w-1/3" />
      <SkeletonBox className="h-6 w-1/4" />
      <div className={`grid gap-4 grid-cols-1 md:grid-cols-${columns}`}>
        <SkeletonBox className="h-40 rounded" />
        <SkeletonBox className="h-40 rounded" />
        <SkeletonBox className="h-40 rounded" />
      </div>
    </div>
  );
}
