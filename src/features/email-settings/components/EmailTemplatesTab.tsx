import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Pencil, Plus, X, Check, Bold as BoldIcon, Italic as ItalicIcon, Link2, List } from "lucide-react";
import {
  listEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  listMailAccounts,
} from "../services/emailSettingsService";
import { EmailTemplate, EmailTemplateInput, MailAccount } from "../email-settings-types";
import { useNotify } from "../../../services/notifications";
import Select from "@/components/form/Select";
import ResponsiveTable, { ColumnConfig } from "@/components/ResponsiveTable";

const PLACEHOLDER_HINTS: Record<string, string[]> = {
  OTP_VERIFICATION: ["otp", "expiryMinutes"],
  APPLICATION_REJECTED: ["referenceCode", "reason"],
  APPLICATION_NEEDS_INFO: ["referenceCode", "notes"],
  APPLICATION_APPROVED: ["referenceCode", "memberCode"],
};

const EMPTY_FORM: EmailTemplateInput = {
  templateKey: "",
  mailAccountId: 0,
  subject: "",
  bodyHtml: "",
  isActive: true,
};

const TEMPLATE_COLUMNS: ColumnConfig<EmailTemplate>[] = [
  { key: "templateKey", title: "Key", weight: 20 },
  { key: "subject", title: "Subject", weight: 30, truncate: true, tooltip: true },
  { key: "mailAccountLabel", title: "Mail Account", weight: 20, hideBelow: "sm" },
  { key: "isActive", title: "Status", weight: 15, align: "center" },
  { key: "actions", title: "Actions", weight: 15, align: "center" },
];

export default function EmailTemplatesTab() {
  const notify = useNotify();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EmailTemplateInput>(EMPTY_FORM);
  const [error, setError] = useState("");

  const { data: templates = [], isLoading, isError } = useQuery<EmailTemplate[]>({
    queryKey: ["email-templates"],
    queryFn: listEmailTemplates,
  });

  const { data: accounts = [] } = useQuery<MailAccount[]>({
    queryKey: ["mail-accounts"],
    queryFn: listMailAccounts,
  });

  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: form.bodyHtml,
    onUpdate: ({ editor }) => setForm((f) => ({ ...f, bodyHtml: editor.getHTML() })),
  });

  // Keep editor content in sync when switching between add/edit
  useEffect(() => {
    if (editor && editor.getHTML() !== form.bodyHtml) {
      editor.commands.setContent(form.bodyHtml || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, editingId]);

  const createMutation = useMutation({
    mutationFn: () => createEmailTemplate(form),
    onSuccess: () => {
      notify.success(`Template "${form.templateKey}" created.`);
      qc.invalidateQueries({ queryKey: ["email-templates"] });
      closeForm();
    },
    onError: (err: any) => setError(err?.response?.data?.message || err?.message || "Failed to create template."),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateEmailTemplate(editingId!, form),
    onSuccess: () => {
      notify.success("Template updated.");
      qc.invalidateQueries({ queryKey: ["email-templates"] });
      closeForm();
    },
    onError: (err: any) => setError(err?.response?.data?.message || err?.message || "Failed to update template."),
  });

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(t: EmailTemplate) {
    setForm({
      templateKey: t.templateKey,
      mailAccountId: t.mailAccountId,
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      isActive: t.isActive,
    });
    setEditingId(t.id);
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function submit() {
    if (!form.templateKey.trim() || !form.subject.trim() || !form.bodyHtml.trim() || !form.mailAccountId) {
      setError("Template key, mail account, subject and body are all required.");
      return;
    }
    setError("");
    editingId === null ? createMutation.mutate() : updateMutation.mutate();
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const hints = PLACEHOLDER_HINTS[form.templateKey.trim().toUpperCase()];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" /> Add Template
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-4 border-2 border-primary/20 space-y-3">
          <p className="text-sm font-medium text-slate-700">{editingId === null ? "New Template" : "Edit Template"}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Template Key</label>
              <input
                value={form.templateKey}
                onChange={(e) => setForm({ ...form, templateKey: e.target.value })}
                placeholder="e.g. OTP_VERIFICATION"
                disabled={editingId !== null}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Mail Account</label>
              <Select
                value={form.mailAccountId || undefined}
                onChange={(v) => setForm({ ...form, mailAccountId: Number(v) })}
                options={accounts.map((a) => ({ value: a.id, label: a.label }))}
                placeholder="Select mail account…"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Subject</label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Neelgar Society — Verification Code"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>

          {hints && (
            <p className="text-xs text-slate-500">
              Available placeholders: {hints.map((h) => `{{${h}}}`).join(", ")}
            </p>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Body</label>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              {editor && (
                <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50/60 px-2 py-1.5">
                  <ToolbarBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <BoldIcon className="w-3.5 h-3.5" />
                  </ToolbarBtn>
                  <ToolbarBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <ItalicIcon className="w-3.5 h-3.5" />
                  </ToolbarBtn>
                  <ToolbarBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <List className="w-3.5 h-3.5" />
                  </ToolbarBtn>
                  <ToolbarBtn
                    active={editor.isActive("link")}
                    onClick={() => {
                      const url = window.prompt("Link URL");
                      if (url) editor.chain().focus().setLink({ href: url }).run();
                    }}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </ToolbarBtn>
                </div>
              )}
              <EditorContent editor={editor} className="prose prose-sm max-w-none px-3 py-2 min-h-[140px] focus:outline-none" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>

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
        {isLoading && <div className="p-6 text-sm text-slate-400">Loading templates…</div>}
        {isError && <div className="p-6 text-sm text-red-500">Failed to load templates.</div>}
        {!isLoading && !isError && templates.length === 0 && (
          <div className="p-10 text-center text-slate-400 text-sm">No templates yet.</div>
        )}

        {!isLoading && !isError && templates.length > 0 && (
          <ResponsiveTable<EmailTemplate>
            columns={TEMPLATE_COLUMNS}
            data={templates}
            rowKey={(t) => t.id}
            renderCell={(t, col) => {
              if (col.key === "isActive") {
                return (
                  <span className={["text-xs px-2 py-1 rounded-full", t.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"].join(" ")}>
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                );
              }
              if (col.key === "actions") {
                return (
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-50 transition text-primary" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                );
              }
              return undefined; // falls back to default cell rendering (templateKey, subject, mailAccountLabel)
            }}
          />
        )}
      </div>
    </div>
  );
}

function ToolbarBtn({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={["p-1.5 rounded transition", active ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"].join(" ")}
    >
      {children}
    </button>
  );
}
