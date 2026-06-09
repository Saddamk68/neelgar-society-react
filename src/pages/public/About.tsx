import React from "react";
import { ShieldCheck, Heart, Users } from "lucide-react";

export default function About() {
  return (
    <div className="bg-background text-text-primary">

      {/* Header band */}
      <section className="bg-surface border-b">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-20">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
            About us
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary">
            Neelgar Society
          </h1>
          <p className="mt-4 text-text-muted max-w-2xl text-base md:text-lg">
            A community-driven society working to keep families connected,
            records organized and administration transparent.
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-xl font-bold mb-3">Our mission</h2>
            <p className="text-text-muted leading-relaxed">
              To provide every member of Neelgar Society with a reliable,
              transparent and easy-to-use platform for managing their community
              information — from family records to society activities.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">Our values</h2>
            <div className="flex flex-col gap-4">
              <ValueItem icon={Users} title="Community first" desc="Every decision is made with the community's best interest in mind." />
              <ValueItem icon={ShieldCheck} title="Transparency" desc="Open records and accountable administration at every level." />
              <ValueItem icon={Heart} title="Dignity and inclusion" desc="Every member is treated with respect regardless of their role." />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-surface border-t border-b py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-8">Milestones</h2>
          <div className="flex flex-col gap-0">
            <TimelineItem year="2007" text="Society founded and first membership records established." />
            <TimelineItem year="2012" text="Expanded to cover 500 families across the community." />
            <TimelineItem year="2019" text="Launched digital record-keeping for member profiles." />
            <TimelineItem year="2024" text="Introduced this management portal for full online administration." />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-2">Leadership</h2>
          <p className="text-text-muted mb-8">The people who keep Neelgar Society running.</p>
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
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <div className="font-medium text-text-primary">{title}</div>
        <div className="text-sm text-text-muted mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function TimelineItem({ year, text }: { year: string; text: string }) {
  return (
    <div className="flex gap-6 pb-8 last:pb-0 relative">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary mt-1 shrink-0" />
        <div className="flex-1 w-px bg-slate-200 mt-1 last:hidden" />
      </div>
      <div className="pb-2">
        <div className="text-sm font-semibold text-primary">{year}</div>
        <div className="text-sm text-text-muted mt-0.5">{text}</div>
      </div>
    </div>
  );
}

function PersonCard({ name, title }: { name: string; title: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("");
  return (
    <div className="bg-surface rounded-xl border p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
        {initials}
      </div>
      <div>
        <div className="font-semibold text-text-primary">{name}</div>
        <div className="text-sm text-text-muted">{title}</div>
      </div>
    </div>
  );
}
