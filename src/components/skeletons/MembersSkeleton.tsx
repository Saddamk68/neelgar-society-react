import TableSkeleton from "./generic/TableSkeleton";
import { MEMBER_COLUMNS } from "../../features/members/tableConfig";

export default function MembersSkeleton() {
  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4">
        <TableSkeleton columns={MEMBER_COLUMNS} rows={8} />
      </div>
    </div>
  );
}
