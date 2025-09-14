import React from "react";
import { SkeletonBox } from "./generic/Primitive"; 
import { ListSkeleton } from "./generic/ListSkeleton";

export default function MembersSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <SkeletonBox className="h-8 w-40" /> {/* Title */}
        <SkeletonBox className="h-10 w-32" /> {/* Add Member button */}
      </div>

      {/* Search/filter bar */}
      <div className="flex gap-4">
        <SkeletonBox className="h-10 w-64" />
        <SkeletonBox className="h-10 w-32" />
      </div>

      {/* Members list/table */}
      <div className="bg-white rounded-lg shadow p-4">
        <ListSkeleton rows={8} />
      </div>
    </div>
  );
}
