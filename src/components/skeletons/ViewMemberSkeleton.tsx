import { SkeletonBox } from "./generic/Primitive";

export default function ViewMemberSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto">

            {/* Identity header */}
            <div className="flex items-center gap-4 mb-6">
                <SkeletonBox className="w-16 h-16 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <SkeletonBox className="h-5 w-48" />
                    <SkeletonBox className="h-4 w-32" />
                </div>
                <SkeletonBox className="h-6 w-16 rounded-full" />
            </div>

            {/* Section */}
            <SkeletonBox className="h-4 w-40 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                        <SkeletonBox className="h-4 w-28 shrink-0" />
                        <SkeletonBox className="h-4 flex-1" />
                    </div>
                ))}
            </div>

            {/* Section */}
            <SkeletonBox className="h-4 w-36 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-2">
                        <SkeletonBox className="h-4 w-28 shrink-0" />
                        <SkeletonBox className="h-4 flex-1" />
                    </div>
                ))}
            </div>

        </div>
    );
}
