import TableSkeleton from "./generic/TableSkeleton";

const FAMILY_COLUMNS = [
    { key: "familyCode", title: "Family" },
    { key: "village", title: "Village", hideBelow: "sm" as const },
    { key: "clan", title: "Clan", hideBelow: "sm" as const },
    { key: "members", title: "Members", hideBelow: "sm" as const },
    { key: "actions", title: "Actions" },
] as const;

export default function FamiliesSkeleton() {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
                <TableSkeleton columns={FAMILY_COLUMNS} rows={8} />
            </div>
        </div>
    );
}
