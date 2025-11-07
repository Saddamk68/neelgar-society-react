// Replace your existing file at: src/pages/public/Contact.tsx
import React, { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle'|'sending'|'success'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);

    if (!form.name || !form.email || !form.message) {
      setError('Please fill name, email and message.');
      setStatus('error');
      return;
    }

    try {
      // If your backend contact API exists, update the endpoint.
      const resp = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error('Network error');
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err:any) {
      setStatus('error');
      setError(err.message || 'Could not send message.');
    }
  }

  return (
    <main id="contact" className="bg-slate-50 text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold">Contact us</h1>
        <p className="mt-2 text-slate-600">Questions, partnership inquiries or media requests — we’d love to hear from you.</p>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold">Get in touch</h3>
            <p className="mt-3 text-sm text-slate-600">
              Email: <a className="text-indigo-600 underline" href="mailto:hello@neelgar.org">hello@neelgar.org</a>
            </p>
            <p className="mt-2 text-sm text-slate-600">Phone: <a className="text-indigo-600 underline" href="tel:+911234567890">+91 12345 67890</a></p>

            <div className="mt-6">
              <h4 className="text-sm font-semibold">Office</h4>
              <address className="not-italic text-sm text-slate-600 mt-1">
                Neelgar Society<br />123 Community Lane<br />Bengaluru, Karnataka
              </address>
            </div>
          </div>

          <form className="bg-white p-6 rounded-lg shadow" onSubmit={submit} noValidate>
            <div className="grid gap-3">
              <label className="text-sm">Name
                <input className="mt-1 block w-full p-2 border rounded" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
              </label>
              <label className="text-sm">Email
                <input type="email" className="mt-1 block w-full p-2 border rounded" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
              </label>
              <label className="text-sm">Subject
                <input className="mt-1 block w-full p-2 border rounded" value={form.subject} onChange={e=>setForm({...form, subject: e.target.value})} />
              </label>
              <label className="text-sm">Message
                <textarea className="mt-1 block w-full p-2 border rounded h-28" value={form.message} onChange={e=>setForm({...form, message: e.target.value})} />
              </label>

              {error && <div className="text-sm text-red-600">{error}</div>}
              {status === 'success' && <div className="text-sm text-green-700">Message sent — thank you!</div>}

              <div>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={status==='sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Developer credit placed inside the Contact section so it won't collide with your app footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          {/* © {new Date().getFullYear()} Neelgar Society —  */}
          Developed by Saddam Khan
        </div>
      </div>
    </main>
  );
}
