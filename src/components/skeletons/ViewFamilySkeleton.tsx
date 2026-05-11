import { SkeletonBox } from "./generic/Primitive";

export default function ViewFamilySkeleton() {
    return (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto">

            {/* Identity header */}
            <div className="flex items-center gap-4 mb-6">
                <SkeletonBox className="w-20 h-20 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <SkeletonBox className="h-5 w-44" />
                    <SkeletonBox className="h-4 w-28" />
                    <SkeletonBox className="h-5 w-20 rounded-full" />
                </div>
                <SkeletonBox className="h-6 w-16 rounded-full" />
            </div>

            {/* Family info section */}
            <SkeletonBox className="h-4 w-40 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-8">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                        <SkeletonBox className="h-4 w-28 shrink-0" />
                        <SkeletonBox className="h-4 flex-1" />
                    </div>
                ))}
            </div>

            {/* Members section */}
            <SkeletonBox className="h-4 w-32 mb-3" />
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                        <SkeletonBox className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <SkeletonBox className="h-4 w-36" />
                            <SkeletonBox className="h-3 w-24" />
                        </div>
                        <SkeletonBox className="h-4 w-16 shrink-0" />
                    </div>
                ))}
            </div>

        </div>
    );
}
