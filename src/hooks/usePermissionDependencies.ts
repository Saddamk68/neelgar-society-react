import { useMemo } from "react";
import type { PermissionMeta } from "../features/users/services/roleService";

export type PermissionState = "on" | "off";

export type DependencyHook = {
    /** Toggle a permission. Cascades automatically in both directions. */
    toggle: (permName: string, current: Record<string, PermissionState>) =>
        { next: Record<string, PermissionState>; notice: string | null };

    /** Returns the permission names that depend on the given permission. */
    dependants: (permName: string) => string[];

    /** Returns the permission name this one depends on, or null. */
    dependencyOf: (permName: string) => string | null;

    /** True if this permission has an unmet dependency in the given state map. */
    isBlocked: (permName: string, states: Record<string, PermissionState>) => boolean;

    /** Human-readable reason why a permission is blocked, or null. */
    blockReason: (permName: string, states: Record<string, PermissionState>) => string | null;
};

export function usePermissionDependencies(
    allPermissions: PermissionMeta[]
): DependencyHook {

    // dependsOnMap: permName → the permission it depends on (or null)
    const dependsOnMap = useMemo(() => {
        const map: Record<string, string | null> = {};
        allPermissions.forEach(p => { map[p.name] = p.dependsOn; });
        return map;
    }, [allPermissions]);

    // dependantsMap: permName → list of permissions that depend on it
    const dependantsMap = useMemo(() => {
        const map: Record<string, string[]> = {};
        allPermissions.forEach(p => {
            if (p.dependsOn) {
                if (!map[p.dependsOn]) map[p.dependsOn] = [];
                map[p.dependsOn].push(p.name);
            }
        });
        return map;
    }, [allPermissions]);

    const dependants = (permName: string): string[] =>
        dependantsMap[permName] ?? [];

    const dependencyOf = (permName: string): string | null =>
        dependsOnMap[permName] ?? null;

    const isBlocked = (
        permName: string,
        states: Record<string, PermissionState>
    ): boolean => {
        const dep = dependsOnMap[permName];
        return dep != null && states[dep] !== "on";
    };

    const blockReason = (
        permName: string,
        states: Record<string, PermissionState>
    ): string | null => {
        const dep = dependsOnMap[permName];
        if (dep && states[dep] !== "on") {
            return `Requires "${dep}" to be enabled first`;
        }
        return null;
    };

    const toggle = (
        permName: string,
        current: Record<string, PermissionState>
    ): { next: Record<string, PermissionState>; notice: string | null } => {

        const next = { ...current };
        const turningOn = current[permName] !== "on";

        if (turningOn) {
            // ── Turning ON ──────────────────────────────────────────────────────────
            next[permName] = "on";

            // Auto-enable dependency if not already on
            const dep = dependsOnMap[permName];
            let notice: string | null = null;

            if (dep && next[dep] !== "on") {
                next[dep] = "on";
                notice = `"${dep}" was enabled automatically because "${permName}" requires it.`;
            }

            return { next, notice };

        } else {
            // ── Turning OFF ─────────────────────────────────────────────────────────
            next[permName] = "off";

            // Auto-disable everything that depends on this permission
            const cascaded: string[] = [];
            const queue = [...(dependantsMap[permName] ?? [])];

            while (queue.length > 0) {
                const child = queue.shift()!;
                if (next[child] === "on") {
                    next[child] = "off";
                    cascaded.push(child);
                    // cascade further if child also has dependants
                    queue.push(...(dependantsMap[child] ?? []));
                }
            }

            const notice = cascaded.length > 0
                ? `${cascaded.length} permission(s) were also disabled because they require "${permName}": ${cascaded.join(", ")}.`
                : null;

            return { next, notice };
        }
    };

    return { toggle, dependants, dependencyOf, isBlocked, blockReason };
}
