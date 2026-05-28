import { useState } from "react";
import { Shield } from "lucide-react";
import UserListPanel from "@/features/users/components/UserListPanel";
import PermissionEditor from "@/features/users/components/PermissionEditor";
import { useSearchParams } from "react-router-dom";
import type { UserRecord } from "@/features/users/types";

export default function Permissions() {
    const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
    const [searchParams] = useSearchParams();
    const preselectedId = searchParams.get("user") ? Number(searchParams.get("user")) : null;

    return (
        <div className="flex flex-col h-full">

            {/* Page header */}
            <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h1 className="text-lg font-semibold text-slate-800">
                        Permission Management
                    </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                    Customise individual user permissions beyond their role defaults.
                    Admin-level accounts always have full access and cannot be modified.
                </p>
            </div>

            {/* Two-panel layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left — user list */}
                <div className="w-72 flex-shrink-0 overflow-hidden flex flex-col">
                    <UserListPanel
                        selectedUserId={selectedUser?.id ?? preselectedId}
                        onSelect={setSelectedUser}
                        preselectedId={preselectedId}
                    />
                </div>

                {/* Right — permission editor */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {selectedUser ? (
                        <PermissionEditor user={selectedUser} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center px-8">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                <Shield className="w-6 h-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">
                                Select a user
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Choose a user from the left to view and edit their permissions
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
