import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldCheck, ShieldX, RotateCcw } from "lucide-react";
import {
    getUserEffectivePermissions,
    updateUserPermissions,
} from "../services/roleService";
import type { PermissionOverride } from "../services/roleService";
import { useNotify } from "@/services/notifications";
import { PERM } from "@/constants/permissions";

// All 15 permissions with display labels — grouped for readability
const ALL_PERMISSIONS: { perm: string; label: string; group: string }[] = [
    { perm: PERM.VIEW_DASHBOARD, label: "View Dashboard", group: "General" },
    { perm: PERM.MEMBER_VIEW, label: "View Members", group: "Members" },
    { perm: PERM.MEMBER_CREATE, label: "Create Members", group: "Members" },
    { perm: PERM.MEMBER_UPDATE, label: "Edit Members", group: "Members" },
    { perm: PERM.MEMBER_DEACTIVATE, label: "Deactivate Members", group: "Members" },
    { perm: PERM.IMPORT_MEMBERS, label: "Import Members", group: "Members" },
    { perm: PERM.FAMILY_VIEW, label: "View Families", group: "Families" },
    { perm: PERM.FAMILY_CREATE, label: "Create Families", group: "Families" },
    { perm: PERM.RELATIONSHIP_MANAGE, label: "Manage Relationships", group: "Families" },
    { perm: PERM.ADDRESS_MANAGE, label: "Manage Addresses", group: "Families" },
    { perm: PERM.USER_MANAGE, label: "Manage Users", group: "Admin" },
    { perm: PERM.USER_APPROVE, label: "Approve Users", group: "Admin" },
    { perm: PERM.USER_REJECT, label: "Reject Users", group: "Admin" },
    { perm: PERM.VIEW_LOGS, label: "View Logs", group: "Admin" },
    { perm: PERM.GOTRA_MANAGE, label: "Manage Gotras", group: "Admin" },
];

const GROUPS = ["General", "Members", "Families", "Admin"];

export default function UserPermissionsPanel({ userId, username }: {
    userId: number;
    username: string;
}) {
    const notify = useNotify();
    const queryClient = useQueryClient();

    // Local state — tracks pending changes before save
    // null = no override (use role default), true = grant, false = revoke
    const [pending, setPending] = useState<Record<string, boolean | null>>({});
    const [isDirty, setIsDirty] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["user-permissions", userId],
        queryFn: () => getUserEffectivePermissions(userId),
    });

    // Reset pending changes whenever fresh data arrives
    useEffect(() => {
        if (data) {
            setPending({});
            setIsDirty(false);
        }
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: (overrides: PermissionOverride[]) =>
            updateUserPermissions(userId, overrides),
        onSuccess: () => {
            notify.success("Permissions updated successfully");
            queryClient.invalidateQueries({ queryKey: ["user-permissions", userId] });
            setPending({});
            setIsDirty(false);
        },
        onError: () => {
            notify.error("Failed to update permissions");
        },
    });

    if (isLoading || !data) {
        return (
            <div className="py-6 text-center text-sm text-slate-400">
                Loading permissions…
            </div>
        );
    }

    const permissionData = data;

    // Compute what each permission's state is in the UI
    // Priority: pending override > saved override > role default
    function getState(perm: string): "granted" | "revoked" | "role" {
        if (perm in pending) {
            if (pending[perm] === true) return "granted";
            if (pending[perm] === false) return "revoked";
            // null = cleared override, fall through to saved state
        }
        const savedOverride = permissionData.overrides.find(o => o.permissionName === perm);
        if (savedOverride) {
            return savedOverride.granted ? "granted" : "revoked";
        }
        return "role";
    }

    function isEffective(perm: string): boolean {
        const state = getState(perm);
        if (state === "granted") return true;
        if (state === "revoked") return false;
        return permissionData.rolePermissions.includes(perm);
    }

    function toggle(perm: string) {
        const current = getState(perm);
        const fromRole = permissionData.rolePermissions.includes(perm);

        setPending(prev => {
            const next = { ...prev };
            if (current === "role") {
                // No override yet — grant if role doesn't have it, revoke if it does
                next[perm] = !fromRole;
            } else if (current === "granted" && !fromRole) {
                // Was extra-granted, clear the override (back to role default = no access)
                next[perm] = null;
            } else if (current === "granted" && fromRole) {
                // Role has it, user wants to revoke
                next[perm] = false;
            } else if (current === "revoked" && fromRole) {
                // Was revoked from role, clear override (back to role default = has access)
                next[perm] = null;
            } else {
                // Was revoked from non-role permission, clear
                next[perm] = null;
            }
            return next;
        });
        setIsDirty(true);
    }

    function handleSave() {
        // Build the full override list:
        // Start with saved overrides, apply pending changes on top
        const overrideMap: Record<string, boolean> = {};

        // Existing saved overrides as base
        permissionData.overrides.forEach(o => {
            overrideMap[o.permissionName] = o.granted;
        });

        // Apply pending changes
        Object.entries(pending).forEach(([perm, value]) => {
            if (value === null) {
                delete overrideMap[perm]; // clear the override
            } else {
                overrideMap[perm] = value;
            }
        });

        const overrides: PermissionOverride[] = Object.entries(overrideMap).map(
            ([permissionName, granted]) => ({ permissionName, granted })
        );

        saveMutation.mutate(overrides);
    }

    function handleReset() {
        setPending({});
        setIsDirty(false);
    }

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-700">
                        Role: <span className="font-semibold text-slate-900">{data.roleName}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Toggles below override the role defaults for <span className="font-medium">{username}</span> only.
                    </p>
                </div>
                <div className="flex gap-2">
                    {isDirty && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
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

            {/* Permission groups */}
            {GROUPS.map(group => {
                const perms = ALL_PERMISSIONS.filter(p => p.group === group);
                return (
                    <div key={group}>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            {group}
                        </p>
                        <div className="space-y-1">
                            {perms.map(({ perm, label }) => {
                                const state = getState(perm);
                                const effective = isEffective(perm);
                                const fromRole = data.rolePermissions.includes(perm);
                                const hasOverride = state !== "role";

                                return (
                                    <div
                                        key={perm}
                                        className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            {effective
                                                ? <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                : <ShieldX className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                            }
                                            <span className={`text-sm ${effective ? "text-slate-800" : "text-slate-400"}`}>
                                                {label}
                                            </span>
                                            {hasOverride && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${state === "granted"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-red-100 text-red-600"
                                                    }`}>
                                                    {state === "granted" ? "extra grant" : "revoked"}
                                                </span>
                                            )}
                                            {!hasOverride && fromRole && (
                                                <span className="text-xs text-slate-400">from role</span>
                                            )}
                                        </div>

                                        {/* Toggle */}
                                        <button
                                            onClick={() => toggle(perm)}
                                            className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${effective ? "bg-green-500" : "bg-slate-200"
                                                }`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${effective ? "translate-x-5" : "translate-x-0"
                                                }`} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Legend */}
            <div className="pt-2 border-t border-slate-100 flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" /> from role = role default, no override
                </span>
                <span className="flex items-center gap-1 text-blue-500">
                    extra grant = granted beyond role
                </span>
                <span className="flex items-center gap-1 text-red-400">
                    revoked = removed from role
                </span>
            </div>
        </div>
    );
}
