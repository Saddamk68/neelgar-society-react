import React from "react";
import { ShieldCheck, Heart, Users } from "lucide-react";

export default function About() {
  return (
    <div className="bg-background text-text-primary">

      {/* Hero */}
      <section className="bg-surface border-b">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
            About us
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-text-primary">
            Built for the<br />
            <span className="text-primary">Neelgar community.</span>
          </h1>
          <p className="mt-5 text-text-muted leading-relaxed max-w-xl">
            A community-driven society working to keep families connected,
            records organized and administration transparent — for everyone.
          </p>
        </div>
      </section>

      {/* Mission and Values */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-16">

          <div>
            <div className="border-l-2 border-primary pl-4 mb-6">
              <h2 className="text-xl font-bold">Our mission</h2>
            </div>
            <p className="text-text-muted leading-relaxed">
              To provide every member of Neelgar Society with a reliable,
              transparent and easy-to-use platform for managing their community
              information — from family records to society activities.
            </p>
            <p className="mt-4 text-text-muted leading-relaxed">
              We believe good administration strengthens communities. When
              records are accurate, roles are clear and information is
              accessible, people can focus on what matters — their families
              and their neighbours.
            </p>
          </div>

          <div>
            <div className="border-l-2 border-primary pl-4 mb-6">
              <h2 className="text-xl font-bold">Our values</h2>
            </div>
            <div className="flex flex-col gap-5">
              <ValueItem
                icon={Users}
                title="Community first"
                desc="Every decision is made with the community's best interest in mind — not technology for its own sake."
              />
              <ValueItem
                icon={ShieldCheck}
                title="Transparency"
                desc="Open records and accountable administration at every level. Nothing hidden."
              />
              <ValueItem
                icon={Heart}
                title="Dignity and inclusion"
                desc="Every member is treated with respect regardless of their role or standing."
              />
            </div>
          </div>

        </div>
      </section>

      {/* Timeline */}
      <section className="bg-surface border-t border-b py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="border-l-2 border-primary pl-4 mb-10">
            <h2 className="text-xl font-bold">Our journey</h2>
            <p className="mt-1 text-text-muted">How Neelgar Society has grown over the years.</p>
          </div>
          <div className="flex flex-col">
            <TimelineItem year="2007" text="Society founded and first membership records established." last={false} />
            <TimelineItem year="2012" text="Expanded to cover 500 families across the community." last={false} />
            <TimelineItem year="2019" text="Launched digital record-keeping for member profiles." last={false} />
            <TimelineItem year="2024" text="Introduced this management portal for full online administration." last={true} />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="border-l-2 border-primary pl-4 mb-10">
            <h2 className="text-xl font-bold">Leadership</h2>
            <p className="mt-1 text-text-muted">The people who keep Neelgar Society running.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <PersonCard name="Rita Sharma" title="President" />
            <PersonCard name="Arjun Patel" title="Secretary" />
            <PersonCard name="Maya Rao" title="Treasurer" />
          </div>
        </div>
      </section>

    </div>
  );
}

function ValueItem({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <div className="font-semibold text-text-primary">{title}</div>
        <div className="text-sm text-text-muted mt-1 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

function TimelineItem({ year, text, last }: { year: string; text: string; last: boolean }) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1" />
        {!last && <div className="w-px flex-1 bg-slate-200 my-1" />}
      </div>
      <div className="pb-8">
        <div className="text-sm font-bold text-primary">{year}</div>
        <div className="text-sm text-text-muted mt-0.5 leading-relaxed">{text}</div>
      </div>
    </div>
  );
}

function PersonCard({ name, title }: { name: string; title: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("");
  return (
    <div className="bg-surface rounded-xl border p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
        {initials}
      </div>
      <div>
        <div className="font-semibold text-text-primary">{name}</div>
        <div className="text-sm text-text-muted mt-0.5">{title}</div>
      </div>
    </div>
  );
}
