import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Mail, Phone } from "lucide-react";
import {
    listApplications,
    ApplicationStatus,
    MemberApplicationSummary,
} from "@/features/member-applications/services/memberApplicationService";
import ResponsiveTable, { ColumnConfig } from "@/components/ResponsiveTable";
import Tooltip from "@/components/Tooltip";
import { useNotify } from "@/services/notifications";
import { ROUTES } from "@/constants/routes";

const TABS: { label: string; status: ApplicationStatus }[] = [
    { label: "Pending", status: "PENDING" },
    { label: "Under Review", status: "UNDER_REVIEW" },
    { label: "Needs Info", status: "NEEDS_INFO" },
    { label: "Approved", status: "APPROVED" },
    { label: "Rejected", status: "REJECTED" },
];

export default function MemberApplications() {
    const notify = useNotify();
    const [status, setStatus] = useState<ApplicationStatus>("PENDING");
    const [page, setPage] = useState(0);
    const size = 30;

    const { data, isLoading, isError } = useQuery({
        queryKey: ["member-applications", status, page],
        queryFn: () => listApplications(status, page, size),
    });

    useEffect(() => {
        if (isError) notify.error("Failed to load applications.");
    }, [isError]);

    const columns: ColumnConfig<MemberApplicationSummary>[] = [
        { key: "referenceCode", title: "Reference", weight: 1.2 },
        { key: "name", title: "Applicant", weight: 1.5 },
        { key: "dob", title: "DOB", weight: 1, hideBelow: "md" },
        { key: "geoUnitName", title: "Village/Town", weight: 1.2, hideBelow: "md" },
        { key: "verified", title: "Verified", align: "center", weight: 1 },
        { key: "submittedAt", title: "Submitted", weight: 1, hideBelow: "sm" },
        { key: "actions", title: "", align: "center", weight: 0.6 },
    ];

    const renderCell = (row: MemberApplicationSummary, col: ColumnConfig<MemberApplicationSummary>) => {
        if (col.key === "referenceCode") {
            return <span className="font-mono text-xs font-semibold">{row.referenceCode}</span>;
        }
        if (col.key === "name") {
            return (
                <span className="text-sm font-medium text-slate-800">
                    {row.firstName} {row.lastName}
                </span>
            );
        }
        if (col.key === "dob") {
            return (
                <span className="text-sm text-slate-600">
                    {new Date(row.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
            );
        }
        if (col.key === "verified") {
            return (
                <div className="flex items-center justify-center gap-1.5">
                    <Tooltip content={row.emailVerified ? "Email verified" : "Email not verified"} offset={20}>
                        <Mail className={`w-3.5 h-3.5 ${row.emailVerified ? "text-green-600" : "text-slate-300"}`} />
                    </Tooltip>
                    <Tooltip content={row.mobileVerified ? "Mobile verified" : "Mobile not verified"} offset={20}>
                        <Phone className={`w-3.5 h-3.5 ${row.mobileVerified ? "text-green-600" : "text-slate-300"}`} />
                    </Tooltip>
                </div>
            );
        }
        if (col.key === "submittedAt") {
            return (
                <span className="text-xs text-slate-500">
                    {new Date(row.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
            );
        }
        if (col.key === "actions") {
            return (
                <div className="flex items-center justify-center">
                    <Tooltip content="Review" offset={20}>
                        <Link
                            to={`${ROUTES.PRIVATE.MEMBER_APPLICATIONS}/${row.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:bg-sky-50"
                        >
                            <Eye className="w-4 h-4 text-primary" />
                        </Link>
                    </Tooltip>
                </div>
            );
        }
        return undefined;
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">Member Applications</h1>
                <p className="text-slate-500 text-sm">
                    {data ? `${data.totalElements} application(s)` : "Review public membership applications"}
                </p>
            </div>

            <div className="flex items-center gap-1 border-b overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.status}
                        onClick={() => {
                            setStatus(tab.status);
                            setPage(0);
                        }}
                        className={[
                            "px-4 py-2 text-sm font-medium whitespace-nowrap transition",
                            status === tab.status
                                ? "border-b-2 border-primary text-primary"
                                : "text-slate-500 hover:text-slate-800",
                        ].join(" ")}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading && (
                <div className="bg-white p-6 rounded-xl shadow text-slate-400 text-sm text-center">Loading…</div>
            )}

            {isError && (
                <div className="bg-white p-4 rounded shadow text-red-500 text-sm">Failed to load applications.</div>
            )}

            {!isLoading && !isError && data && data.content.length === 0 && (
                <div className="bg-white p-6 rounded-xl shadow text-slate-400 text-sm text-center">
                    No applications in this status.
                </div>
            )}

            {!isLoading && !isError && data && data.content.length > 0 && (
                <div className="bg-white rounded-xl shadow overflow-hidden flex flex-col">
                    <ResponsiveTable<MemberApplicationSummary>
                        columns={columns}
                        data={data.content}
                        renderCell={renderCell}
                        rowKey={(r) => r.id}
                    />

                    {data.totalPages > 1 && (
                        <div className="flex justify-center py-2 text-xs text-gray-600 border-t bg-gray-50 gap-1">
                            <span
                                className={`cursor-pointer mx-1 ${page === 0 ? "text-gray-400" : "hover:underline"}`}
                                onClick={() => page > 0 && setPage(page - 1)}
                            >
                                Prev
                            </span>
                            {Array.from({ length: data.totalPages }, (_, i) => i).map((p) => (
                                <span
                                    key={p}
                                    className={`cursor-pointer mx-1 ${p === page ? "font-bold text-primary underline" : "hover:underline"}`}
                                    onClick={() => setPage(p)}
                                >
                                    {p + 1}
                                </span>
                            ))}
                            <span
                                className={`cursor-pointer mx-1 ${page >= data.totalPages - 1 ? "text-gray-400" : "hover:underline"}`}
                                onClick={() => page < data.totalPages - 1 && setPage(page + 1)}
                            >
                                Next
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
