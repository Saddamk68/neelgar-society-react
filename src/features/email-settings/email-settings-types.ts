export type MailAccount = {
    id: number;
    label: string;
    smtpHost: string;
    smtpPort: number;
    username: string;
    useTls: boolean;
    fromName?: string;
    isActive: boolean;
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
};

export type MailAccountInput = {
    label: string;
    smtpHost: string;
    smtpPort: number;
    username: string;
    password?: string; // blank on update = keep existing
    useTls: boolean;
    fromName?: string;
    isActive: boolean;
};

export type EmailTemplate = {
    id: number;
    templateKey: string;
    mailAccountId: number;
    mailAccountLabel: string;
    subject: string;
    bodyHtml: string;
    isActive: boolean;
    createdAt?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
};

export type EmailTemplateInput = {
    templateKey: string;
    mailAccountId: number;
    subject: string;
    bodyHtml: string;
    isActive: boolean;
};
