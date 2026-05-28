import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldX, RotateCcw, AlertTriangle } from "lucide-react";
import {
    getUserEffectivePermissions,
    updateUserPermissions,
    listAllPermissions,
} from "../services/roleService";
import type { PermissionOverride } from "../services/roleService";
import { usePermissionDependencies } from "@/hooks/usePermissionDependencies";
import type { PermissionState } from "@/hooks/usePermissionDependencies";
import { useNotify } from "@/services/notifications";
import type { UserRecord } from "../types";
import type { Role } from "@/constants/roles";

const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "PRESIDENT"];

interface Props {
    user: UserRecord;
}

export default function PermissionEditor({ user }: Props) {
    const notify = useNotify();
    const queryClient = useQueryClient();
    const isAdminLevel = ADMIN_ROLES.includes(user.role);

    // ── Fetch all permission metadata (labels, groups, dependencies) ──────────
    const { data: allPerms = [] } = useQuery({
        queryKey: ["all-permissions"],
        queryFn: listAllPermissions,
        staleTime: Infinity, // permission metadata never changes at runtime
    });

    // ── Fetch this user's current effective permissions ───────────────────────
    const { data: effectiveData, isLoading } = useQuery({
        queryKey: ["user-permissions", user.id],
        queryFn: () => getUserEffectivePermissions(user.id),
        enabled: !isAdminLevel,
    });

    // ── Local toggle state — permission name → on/off ─────────────────────────
    const [states, setStates] = useState<Record<string, PermissionState>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    const deps = usePermissionDependencies(allPerms);

    // Initialise states when data loads
    useEffect(() => {
        if (!effectiveData || allPerms.length === 0) return;
        const initial: Record<string, PermissionState> = {};
        allPerms.forEach((p) => {
            initial[p.name] = effectiveData.effectivePermissions.includes(p.name)
                ? "on"
                : "off";
        });
        setStates(initial);
        setIsDirty(false);
        setNotice(null);
    }, [effectiveData, allPerms]);

    // ── Mutation ──────────────────────────────────────────────────────────────
    const saveMutation = useMutation({
        mutationFn: (overrides: PermissionOverride[]) =>
            updateUserPermissions(user.id, overrides),
        onSuccess: () => {
            notify.success("Permissions saved successfully");
            queryClient.invalidateQueries({ queryKey: ["user-permissions", user.id] });
            setIsDirty(false);
            setNotice(null);
        },
        onError: (err: any) => {
            const msg =
                err?.response?.data?.message ?? "Failed to save permissions";
            notify.error(msg);
        },
    });

    // ── Toggle handler ────────────────────────────────────────────────────────
    function handleToggle(permName: string) {
        const { next, notice: cascadeNotice } = deps.toggle(permName, states);
        setStates(next);
        setIsDirty(true);
        if (cascadeNotice) setNotice(cascadeNotice);
        else setNotice(null);
    }

    // ── Save handler ─────────────────────────────────────────────────────────
    function handleSave() {
        if (!effectiveData) return;

        // Build overrides: compare current states against role defaults
        const rolePerms = new Set(effectiveData.rolePermissions);
        const overrides: PermissionOverride[] = [];

        Object.entries(states).forEach(([permName, state]) => {
            const inRole = rolePerms.has(permName);
            const isOn = state === "on";

            if (isOn && !inRole) {
                // Extra grant — not in role but turned on
                overrides.push({ permissionName: permName, granted: true });
            } else if (!isOn && inRole) {
                // Revoke — in role but turned off
                overrides.push({ permissionName: permName, granted: false });
            }
            // If state matches role default → no override needed
        });

        saveMutation.mutate(overrides);
    }

    function handleReset() {
        if (!effectiveData || allPerms.length === 0) return;
        const reset: Record<string, PermissionState> = {};
        allPerms.forEach((p) => {
            reset[p.name] = effectiveData.rolePermissions.includes(p.name)
                ? "on"
                : "off";
        });
        setStates(reset);
        setIsDirty(false);
        setNotice(null);
    }

    // ── Group permissions by display_group ───────────────────────────────────
    const groups = Array.from(
        new Set(allPerms.map((p) => p.displayGroup ?? "Other"))
    );

    // ── Render: admin-level user ──────────────────────────────────────────────
    if (isAdminLevel) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                    Admin-level account
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                    <span className="font-medium">{user.personName || user.username}</span> has
                    the <span className="font-medium">{user.role}</span> role. Admin-level
                    accounts always have full access and cannot be customised.
                </p>
            </div>
        );
    }

    // ── Render: no user selected ──────────────────────────────────────────────
    if (isLoading || !effectiveData) {
        return (
            <div className="flex items-center justify-center h-full py-12">
                <p className="text-sm text-slate-400">Loading permissions…</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
                <div>
                    <p className="text-sm font-semibold text-slate-800">
                        {user.personName || user.username}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Role: <span className="font-medium text-slate-600">{user.role}</span>
                        {" · "}
                        {effectiveData.effectivePermissions.length} active permission(s)
                    </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    {isDirty && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!isDirty || saveMutation.isPending}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ShieldCheck className="w-3 h-3" />
                        {saveMutation.isPending ? "Saving…" : "Save changes"}
                    </button>
                </div>
            </div>

            {/* Cascade notice */}
            {notice && (
                <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
                    {notice}
                </div>
            )}

            {/* Permission groups */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {groups.map((group) => {
                    const perms = allPerms.filter(
                        (p) => (p.displayGroup ?? "Other") === group
                    );

                    return (
                        <div key={group}>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                {group}
                            </p>
                            <div className="space-y-1">
                                {perms.map((p) => {
                                    const isOn = states[p.name] === "on";
                                    const blocked = deps.isBlocked(p.name, states);
                                    const reason = deps.blockReason(p.name, states);
                                    const inRole = effectiveData.rolePermissions.includes(p.name);
                                    const hasOverride = (() => {
                                        if (isOn && !inRole) return "granted";
                                        if (!isOn && inRole) return "revoked";
                                        return null;
                                    })();

                                    return (
                                        <div
                                            key={p.name}
                                            className={`flex items-center justify-between py-2 px-3 rounded-lg ${blocked ? "opacity-50" : "hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {isOn
                                                    ? <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                    : <ShieldX className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                }
                                                <div className="min-w-0">
                                                    <span className={`text-sm ${isOn ? "text-slate-800" : "text-slate-400"
                                                        }`}>
                                                        {p.displayLabel ?? p.name}
                                                    </span>
                                                    {reason && (
                                                        <p className="text-xs text-amber-500 mt-0.5">{reason}</p>
                                                    )}
                                                </div>
                                                {hasOverride === "granted" && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                                                        extra grant
                                                    </span>
                                                )}
                                                {hasOverride === "revoked" && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-600 flex-shrink-0">
                                                        revoked
                                                    </span>
                                                )}
                                                {!hasOverride && inRole && (
                                                    <span className="text-xs text-slate-300 flex-shrink-0">
                                                        from role
                                                    </span>
                                                )}
                                            </div>

                                            {/* Toggle */}
                                            <button
                                                onClick={() => !blocked && handleToggle(p.name)}
                                                disabled={blocked}
                                                className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none flex-shrink-0 ${isOn ? "bg-green-500" : "bg-slate-200"
                                                    } ${blocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOn ? "translate-x-5" : "translate-x-0"
                                                    }`} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="px-5 py-3 border-t border-slate-100 flex gap-4 flex-wrap text-xs text-slate-400">
                <span>from role = role default</span>
                <span className="text-blue-500">extra grant = added beyond role</span>
                <span className="text-red-400">revoked = removed from role</span>
            </div>
        </div>
    );
}
