import React, { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";

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
            Questions about your membership, family records or account access —
            reach out and we will get back to you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12">

          {/* Left — contact info */}
          <div>
            <div className="border-l-2 border-primary pl-4 mb-8">
              <h2 className="text-xl font-bold">Contact information</h2>
              <p className="mt-1 text-text-muted text-sm">
                Reach us through any of the channels below.
              </p>
            </div>

            <div className="flex flex-col gap-6">
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
            </div>

            <div className="mt-12 pt-6 border-t">
              <p className="text-xs text-text-muted">Developed by Saddam Khan</p>
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
          <a
            href={href}
            className="text-sm text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <div className="text-sm text-text-primary leading-relaxed">{value}</div>
        )}
      </div>
    </div >
  );
}
