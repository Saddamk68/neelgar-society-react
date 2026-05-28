import { useAuth } from "../context/AuthContext";
import type { Perm } from "../constants/permissions";

/**
 * Hook for permission-based UI gating.
 * Reads actual JWT permissions — not role names.
 *
 * Usage:
 *   const { can } = usePermission();
 *   if (can(PERM.MEMBER_CREATE)) { ... }
 */
export function usePermission() {
    const { hasPermission } = useAuth();

    return {
        /** True if the user has this permission. */
        can: (perm: Perm): boolean => hasPermission(perm),

        /** True if the user has ANY of the given permissions. */
        canAny: (...perms: Perm[]): boolean => perms.some(p => hasPermission(p)),

        /** True if the user has ALL of the given permissions. */
        canAll: (...perms: Perm[]): boolean => perms.every(p => hasPermission(p)),
    };
    
}
