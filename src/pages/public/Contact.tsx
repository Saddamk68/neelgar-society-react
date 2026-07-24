import React, { useState } from "react";
import { Mail, Phone, MapPin, Users } from "lucide-react";
import { SOCIETY } from "../../constants/society";
import { sendContactMessage } from "@/features/public-membership/services/publicMembershipService";
import { isValidEmail } from "@/utils/validation";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    if (!form.name || !form.email || !form.message) {
      setError("Please fill in name, email and message.");
      setStatus("error");
      return;
    }

    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      await sendContactMessage(form);
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Could not send message.");
    }
  }

  return (
    <div className="bg-background text-text-primary">

      {/* Hero */}
      <section className="bg-surface border-b">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
            Contact
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-text-primary">
            We are here<br />
            <span className="text-primary">to help.</span>
          </h1>
          <p className="mt-5 text-text-muted leading-relaxed max-w-xl">
            Questions about membership, the Samuhik Vivah Samelan, or your
            local committee — reach out and we will get back to you.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12">

          {/* Left — contact info */}
          <div className="flex flex-col gap-8">

            <div>
              <div className="border-l-2 border-primary pl-4 mb-6">
                <h2 className="text-xl font-bold">Central office</h2>
                <p className="mt-1 text-text-muted text-sm">
                  Headquartered in {SOCIETY.headquarters}.
                </p>
              </div>
              <div className="flex flex-col gap-6">
                <ContactItem
                  icon={Mail}
                  label="Email"
                  value={SOCIETY.email}
                  href={`mailto:${SOCIETY.email}`}
                />
                <ContactItem
                  icon={Phone}
                  label="Phone"
                  value={SOCIETY.phone}
                  href={`tel:${SOCIETY.phone.replace(/\s/g, "")}`}
                />
                <ContactItem
                  icon={MapPin}
                  label="Headquarters"
                  value={SOCIETY.headquarters}
                />
              </div>
            </div>

            {/* Local committee note */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary text-sm">
                    Looking for your local committee?
                  </div>
                  <p className="text-sm text-text-muted mt-1 leading-relaxed">
                    Every town and village in our network has a local president
                    and secretary. Log in to the member portal to find your
                    nearest committee contact.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-text-muted mt-1">
                Developed by <b>Saddam Khan</b>
              </p>
            </div>

          </div>

          {/* Right — form */}
          <div className="bg-surface rounded-xl border shadow-sm p-8 flex flex-col gap-5">
            <div className="border-l-2 border-primary pl-4">
              <h2 className="text-xl font-bold">Send a message</h2>
              <p className="mt-1 text-text-muted text-sm">
                We typically respond within one business day.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                className="border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                disabled={status === "sending"}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                className="border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                disabled={status === "sending"}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="How can we help?"
                className="border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                disabled={status === "sending"}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Your message..."
                rows={4}
                className="border rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
                disabled={status === "sending"}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {status === "success" && (
              <p className="text-sm text-green-700 font-medium">
                Message sent — thank you, we will be in touch.
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={status === "sending"}
              className="mt-1 px-6 py-3 bg-primary text-white rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send message"}
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">
          {label}
        </div>
        {href ? (
          <a href={href} className="text-sm text-primary hover:underline">
            {value}
          </a>
        ) : (
          <div className="text-sm text-text-primary leading-relaxed">{value}</div>
        )}
      </div>
    </div>
  );
}
