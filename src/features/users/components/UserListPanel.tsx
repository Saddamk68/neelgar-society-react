import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { listUsers, listUsersByActiveStatus } from "../services/userService";
import type { UserRecord } from "../types";
import type { Role } from "@/constants/roles";
import { ALL_ROLES } from "@/constants/roles";

// Admin-level roles — shown with a lock badge, not editable
const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "PRESIDENT"];

interface Props {
    selectedUserId: number | null;
    preselectedId?: number | null;
    onSelect: (user: UserRecord) => void;
}

export default function UserListPanel({ selectedUserId, onSelect, preselectedId }: Props) {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<Role | "">("");

    const { data, isLoading } = useQuery({
        queryKey: ["users-for-permissions", true],
        queryFn: () =>
            listUsersByActiveStatus({
                isActive: true,
                size: 200,
            }),
    });

    const users = data?.content ?? [];

    const filtered = users.filter((u) => {
        const matchesSearch =
            !search ||
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            (u.personName ?? "").toLowerCase().includes(search.toLowerCase());
        const matchesRole = !roleFilter || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    useEffect(() => {
        if (!preselectedId || !users.length) return;
        const match = users.find(u => u.id === preselectedId);
        if (match) onSelect(match);
    }, [preselectedId, users]);

    return (
        <div className="flex flex-col h-full border-r border-slate-100">

            {/* Search */}
            <div className="p-3 border-b border-slate-100 space-y-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search name or username…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as Role | "")}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-slate-600"
                >
                    <option value="">All roles</option>
                    {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto">
                {isLoading && (
                    <p className="text-xs text-slate-400 text-center py-6">Loading…</p>
                )}
                {!isLoading && filtered.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No users found</p>
                )}
                {filtered.map((u) => {
                    const isAdmin = ADMIN_ROLES.includes(u.role);
                    const isSelected = u.id === selectedUserId;

                    return (
                        <button
                            key={u.id}
                            onClick={() => onSelect(u)}
                            className={`w-full text-left px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 transition-colors ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className={`text-sm font-medium truncate ${isSelected ? "text-primary" : "text-slate-800"
                                        }`}>
                                        {u.personName || u.username}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">{u.username}</p>
                                </div>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${isAdmin
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                                    }`}>
                                    {u.role}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="px-3 py-2 border-t border-slate-100">
                <p className="text-xs text-slate-400">{filtered.length} user(s)</p>
            </div>
        </div>
    );
}
