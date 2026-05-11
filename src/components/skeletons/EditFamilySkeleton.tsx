import { SkeletonBox } from "./generic/Primitive";

export default function EditFamilySkeleton() {
    return (
        <div className="max-w-2xl mx-auto">
            {/* Read-only banner */}
            <div className="mb-4 flex gap-6 px-4 py-3 border border-slate-100 rounded-lg">
                <SkeletonBox className="h-4 w-32" />
                <SkeletonBox className="h-4 w-24" />
            </div>
            {/* Form card */}
            <div className="bg-white rounded-xl shadow p-6 space-y-5">
                <SkeletonBox className="h-5 w-36 mb-2" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                        <SkeletonBox className="h-4 w-24" />
                        <SkeletonBox className="h-9 w-full rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    );
}
