import React, { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email || !form.message) {
      setError("Please fill in name, email and message.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      const resp = await fetch("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error("Network error");
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Could not send message.");
    }
  }

  return (
    <div className="bg-background text-text-primary">

      {/* Header band */}
      <section className="bg-surface border-b">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
            Contact
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary">
            Get in touch
          </h1>
          <p className="mt-4 text-text-muted max-w-xl text-base md:text-lg">
            Questions, partnership inquiries or membership requests — we would love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10">

          {/* Contact info */}
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-bold">Contact information</h2>

            <ContactItem
              icon={Mail}
              label="Email"
              value="hello@neelgar.org"
              href="mailto:hello@neelgar.org"
            />
            <ContactItem
              icon={Phone}
              label="Phone"
              value="+91 12345 67890"
              href="tel:+911234567890"
            />
            <ContactItem
              icon={MapPin}
              label="Office"
              value="123 Community Lane, Bengaluru, Karnataka"
            />

            <div className="mt-4 text-xs text-text-muted">
              Developed by Saddam Khan
            </div>
          </div>

          {/* Form */}
          <div className="bg-surface rounded-xl border p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold">Send a message</h2>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={status === "sending"}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={status === "sending"}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="How can we help?"
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={status === "sending"}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Your message..."
                rows={4}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                disabled={status === "sending"}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {status === "success" && (
              <p className="text-sm text-green-700">Message sent — thank you!</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={status === "sending"}
              className="mt-1 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
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
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <div className="text-xs text-text-muted font-medium uppercase tracking-wide">{label}</div>
        {href ? (
          <a href={href} className="text-sm text-primary hover:underline mt-0.5 block">
            {value}
          </a>
        ) : (
          <div className="text-sm text-text-primary mt-0.5">{value}</div>
        )}
      </div>
    </div>
  );
}
