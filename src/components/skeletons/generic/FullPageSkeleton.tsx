import React from "react";
import { SkeletonBox } from "./Primitive";

export default function FullPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-4xl p-6">
        <SkeletonBox className="h-8 w-1/4 mb-4" />
        <SkeletonBox className="h-6 w-1/6 mb-8" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <SkeletonBox className="h-40 rounded" />
          <SkeletonBox className="h-40 rounded" />
          <SkeletonBox className="h-40 rounded" />
        </div>
      </div>
    </div>
  );
}
