import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, X, Check } from "lucide-react";
import {
    listMailAccounts,
    createMailAccount,
    updateMailAccount,
} from "../services/emailSettingsService";
import { MailAccount, MailAccountInput } from "../email-settings-types";
import { useNotify } from "../../../services/notifications";

const EMPTY_FORM: MailAccountInput = {
    label: "",
    smtpHost: "",
    smtpPort: 465,
    username: "",
    password: "",
    useTls: true,
    fromName: "",
    isActive: true,
};

export default function MailAccountsTab() {
    const notify = useNotify();
    const qc = useQueryClient();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<MailAccountInput>(EMPTY_FORM);
    const [error, setError] = useState("");

    const { data: accounts = [], isLoading, isError } = useQuery<MailAccount[]>({
        queryKey: ["mail-accounts"],
        queryFn: listMailAccounts,
    });

    const createMutation = useMutation({
        mutationFn: () => createMailAccount(form),
        onSuccess: () => {
            notify.success(`Mail account "${form.label}" created.`);
            qc.invalidateQueries({ queryKey: ["mail-accounts"] });
            closeForm();
        },
        onError: (err: any) => setError(err?.response?.data?.message || err?.message || "Failed to create account."),
    });

    const updateMutation = useMutation({
        mutationFn: () => updateMailAccount(editingId!, form),
        onSuccess: () => {
            notify.success("Mail account updated.");
            qc.invalidateQueries({ queryKey: ["mail-accounts"] });
            closeForm();
        },
        onError: (err: any) => setError(err?.response?.data?.message || err?.message || "Failed to update account."),
    });

    function openAdd() {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setError("");
        setShowForm(true);
    }

    function openEdit(a: MailAccount) {
        setForm({
            label: a.label,
            smtpHost: a.smtpHost,
            smtpPort: a.smtpPort,
            username: a.username,
            password: "", // write-only — blank means "keep unchanged"
            useTls: a.useTls,
            fromName: a.fromName ?? "",
            isActive: a.isActive,
        });
        setEditingId(a.id);
        setError("");
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
    }

    function submit() {
        if (!form.label.trim() || !form.smtpHost.trim() || !form.username.trim()) {
            setError("Label, SMTP host and username are required.");
            return;
        }
        if (editingId === null && !form.password?.trim()) {
            setError("Password is required when creating a new account.");
            return;
        }
        setError("");
        editingId === null ? createMutation.mutate() : updateMutation.mutate();
    }

    const saving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {!showForm && (
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
                    >
                        <Plus className="w-4 h-4" /> Add Mail Account
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white rounded-xl shadow p-4 border-2 border-primary/20 space-y-3">
                    <p className="text-sm font-medium text-slate-700">{editingId === null ? "New Mail Account" : "Edit Mail Account"}</p>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Label" value={form.label} onChange={(v) => setForm({ ...form, label: v })} placeholder="e.g. Applications Mailbox" />
                        <Field label="From Name" value={form.fromName ?? ""} onChange={(v) => setForm({ ...form, fromName: v })} placeholder="e.g. Neelgar Society" />
                        <Field label="SMTP Host" value={form.smtpHost} onChange={(v) => setForm({ ...form, smtpHost: v })} placeholder="smtp.zoho.com" />
                        <Field label="SMTP Port" value={String(form.smtpPort)} onChange={(v) => setForm({ ...form, smtpPort: Number(v) || 0 })} placeholder="465" />
                        <Field label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="applications@neelgarsociety.com" />
                        <Field
                            label={editingId === null ? "Password" : "Password (leave blank to keep unchanged)"}
                            value={form.password ?? ""}
                            onChange={(v) => setForm({ ...form, password: v })}
                            type="password"
                        />
                    </div>

                    <div className="flex items-center gap-6 pt-1">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={form.useTls} onChange={(e) => setForm({ ...form, useTls: e.target.checked })} />
                            Use TLS/SSL
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                            Active
                        </label>
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <div className="flex items-center gap-2 pt-1">
                        <button
                            onClick={submit}
                            disabled={saving}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                        >
                            <Check className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
                        </button>
                        <button onClick={closeForm} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-sm hover:bg-slate-50 transition">
                            <X className="w-4 h-4 text-slate-500" /> Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
                {isLoading && <div className="p-6 text-sm text-slate-400">Loading mail accounts…</div>}
                {isError && <div className="p-6 text-sm text-red-500">Failed to load mail accounts.</div>}
                {!isLoading && !isError && accounts.length === 0 && (
                    <div className="p-10 text-center text-slate-400 text-sm">No mail accounts yet.</div>
                )}

                {!isLoading && !isError && accounts.length > 0 && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50/60 text-left">
                                <th className="px-4 py-3 font-medium text-slate-500">Label</th>
                                <th className="px-4 py-3 font-medium text-slate-500">SMTP Host</th>
                                <th className="px-4 py-3 font-medium text-slate-500">Username</th>
                                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                                <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((a) => (
                                <tr key={a.id} className="border-b last:border-0 hover:bg-slate-50/50 transition">
                                    <td className="px-4 py-3 font-medium text-slate-800">{a.label}</td>
                                    <td className="px-4 py-3 text-slate-600">{a.smtpHost}:{a.smtpPort}</td>
                                    <td className="px-4 py-3 text-slate-600">{a.username}</td>
                                    <td className="px-4 py-3">
                                        <span className={["text-xs px-2 py-1 rounded-full", a.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"].join(" ")}>
                                            {a.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-blue-50 transition text-primary" title="Edit">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
        </div>
    );
}
