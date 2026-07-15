import { useState } from "react";
import MailAccountsTab from "@/features/email-settings/components/MailAccountsTab";
import EmailTemplatesTab from "@/features/email-settings/components/EmailTemplatesTab";

export default function EmailSettings() {
    const [tab, setTab] = useState<"accounts" | "templates">("accounts");

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <div>
                <h1 className="text-2xl font-semibold">Email Settings</h1>
                <p className="text-slate-500 text-sm">Manage outbound mail accounts and email templates.</p>
            </div>

            <div className="flex gap-1 border-b border-slate-200">
                {(["accounts", "templates"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={[
                            "px-4 py-2 text-sm font-medium border-b-2 transition",
                            tab === t ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700",
                        ].join(" ")}
                    >
                        {t === "accounts" ? "Mail Accounts" : "Templates"}
                    </button>
                ))}
            </div>

            {tab === "accounts" ? <MailAccountsTab /> : <EmailTemplatesTab />}
        </div>
    );
}
