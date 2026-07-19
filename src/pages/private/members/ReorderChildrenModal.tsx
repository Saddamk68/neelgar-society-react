import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import Modal from "@/components/Modal";
import MemberAvatar from "@/components/MemberAvatar";
import { useNotify } from "@/services/notifications";
import { updateBirthOrder } from "@/features/members/services/memberService";
import type { DescendantNode } from "@/hooks/useLineageTree";

function effectiveSortValue(node: DescendantNode): [number, string] {
    // Sort key: manual birthOrder (if set) first, else dob, else keep stable by name
    if (node.member.birthOrder != null) return [0, String(node.member.birthOrder).padStart(10, "0")];
    if (node.member.dob) return [1, node.member.dob];
    return [2, node.member.firstName];
}

export default function ReorderChildrenModal({
    children,
    onClose,
    onSaved,
}: {
    children: DescendantNode[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const notify = useNotify();
    const [ordered, setOrdered] = useState<DescendantNode[]>(
        [...children].sort((a, b) => {
            const [ta, va] = effectiveSortValue(a);
            const [tb, vb] = effectiveSortValue(b);
            if (ta !== tb) return ta - tb;
            return va < vb ? -1 : va > vb ? 1 : 0;
        })
    );
    const [saving, setSaving] = useState(false);

    function move(index: number, dir: -1 | 1) {
        const next = [...ordered];
        const target = index + dir;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setOrdered(next);
    }

    async function handleSave() {
        setSaving(true);
        try {
            await Promise.all(
                ordered.map((node, idx) => updateBirthOrder(node.member.memberCode, idx + 1))
            );
            notify.success("Sibling order updated.");
            onSaved();
            onClose();
        } catch (err: any) {
            notify.error(err?.message || "Failed to save order.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal isOpen onClose={onClose} title="Reorder children">
            <p className="text-sm text-slate-500 mb-4 shrink-0">
                Eldest first. Drag order is saved as the final order — DOB is only used as a fallback for members you haven't manually ordered yet.
            </p>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {ordered.map((node, idx) => (
                    <div
                        key={node.member.memberCode}
                        className="flex items-center gap-3 border rounded-lg px-3 py-2"
                    >
                        <span className="text-xs font-mono text-slate-400 w-5">{idx + 1}</span>
                        <MemberAvatar
                            memberCode={node.member.memberCode}
                            firstName={node.member.firstName}
                            lastName={node.member.lastName}
                            hasPhoto={node.member.hasPhoto ?? false}
                            size="sm"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">
                                {node.member.firstName} {node.member.lastName ?? ""}
                            </div>
                            <div className="text-xs text-slate-400">
                                {node.member.dob ? `DOB: ${node.member.dob.substring(0, 10)}` : "No DOB on file"}
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <button
                                type="button"
                                onClick={() => move(idx, -1)}
                                disabled={idx === 0 || saving}
                                className="p-1 rounded border hover:bg-slate-50 disabled:opacity-30 transition"
                            >
                                <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => move(idx, 1)}
                                disabled={idx === ordered.length - 1 || saving}
                                className="p-1 rounded border hover:bg-slate-50 disabled:opacity-30 transition"
                            >
                                <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mt-5 shrink-0">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition disabled:opacity-60"
                >
                    {saving ? "Saving…" : "Save order"}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 transition"
                >
                    Cancel
                </button>
            </div>
        </Modal>
    );
}
