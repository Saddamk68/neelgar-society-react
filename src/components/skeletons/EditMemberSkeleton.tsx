import { SkeletonBox } from "./generic/Primitive";

function SectionSkeleton({ rows = 4, cols = 2 }: { rows?: number; cols?: number }) {
    return (
        <div className="bg-white rounded-xl shadow p-6">
            <SkeletonBox className="h-5 w-40 mb-4" />
            <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-4`}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                        <SkeletonBox className="h-4 w-24" />
                        <SkeletonBox className="h-9 w-full rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function EditMemberSkeleton() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Photo section */}
            <div className="bg-white rounded-xl shadow p-6">
                <SkeletonBox className="h-5 w-32 mb-4" />
                <div className="flex items-center gap-5">
                    <SkeletonBox className="w-24 h-24 rounded-full shrink-0" />
                    <div className="space-y-2">
                        <SkeletonBox className="h-4 w-48" />
                        <SkeletonBox className="h-8 w-28 rounded-md" />
                    </div>
                </div>
            </div>
            {/* Personal info */}
            <SectionSkeleton rows={8} cols={2} />
            {/* Current address */}
            <SectionSkeleton rows={4} cols={2} />
            {/* Parental address */}
            <SectionSkeleton rows={2} cols={2} />
        </div>
    );
}
