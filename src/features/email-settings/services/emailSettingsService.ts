import { api } from "../../../services/apiClient";
import { ENDPOINTS } from "../../../config/endpoints";
import { MailAccount, MailAccountInput, EmailTemplate, EmailTemplateInput } from "../email-settings-types";

function unwrap<T>(res: any): T {
    return res.data?.data ?? res.data;
}

// ── Mail Accounts ──────────────────────────────────────────
export async function listMailAccounts(): Promise<MailAccount[]> {
    const res = await api.get(ENDPOINTS.mailAccounts.list());
    return unwrap<MailAccount[]>(res);
}

export async function createMailAccount(input: MailAccountInput): Promise<MailAccount> {
    const res = await api.post(ENDPOINTS.mailAccounts.create(), input);
    return unwrap<MailAccount>(res);
}

export async function updateMailAccount(id: number, input: MailAccountInput): Promise<MailAccount> {
    const res = await api.put(ENDPOINTS.mailAccounts.update(id), input);
    return unwrap<MailAccount>(res);
}

// ── Email Templates ────────────────────────────────────────
export async function listEmailTemplates(): Promise<EmailTemplate[]> {
    const res = await api.get(ENDPOINTS.emailTemplates.list());
    return unwrap<EmailTemplate[]>(res);
}

export async function createEmailTemplate(input: EmailTemplateInput): Promise<EmailTemplate> {
    const res = await api.post(ENDPOINTS.emailTemplates.create(), input);
    return unwrap<EmailTemplate>(res);
}

export async function updateEmailTemplate(id: number, input: EmailTemplateInput): Promise<EmailTemplate> {
    const res = await api.put(ENDPOINTS.emailTemplates.update(id), input);
    return unwrap<EmailTemplate>(res);
}
