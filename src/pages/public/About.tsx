import React from "react";
import { ShieldCheck, Heart, Users } from "lucide-react";
import { SOCIETY } from "../../constants/society";

const VALUE_ICONS = [Users, ShieldCheck, Heart];

export default function About() {
  return (
    <div className="bg-background text-text-primary">

      {/* Hero */}
      <section className="bg-surface border-b">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
            Est. {SOCIETY.established} — {SOCIETY.headquarters}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-text-primary">
            About<br />
            <span className="text-primary">{SOCIETY.name}.</span>
          </h1>
          <p className="mt-5 text-text-muted leading-relaxed max-w-xl">
            {SOCIETY.tagline}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-16">
          <div>
            <div className="border-l-2 border-primary pl-4 mb-6">
              <h2 className="text-xl font-bold">Our mission</h2>
            </div>
            <p className="text-text-muted leading-relaxed">
              {SOCIETY.mission}
            </p>
            <p className="mt-4 text-text-muted leading-relaxed">
              Founded in {SOCIETY.established} in {SOCIETY.headquarters},
              the society has grown from a small local effort into a network
              spanning 50+ towns and villages — each with its own active
              committee working toward the same goal.
            </p>
          </div>

          <div>
            <div className="border-l-2 border-primary pl-4 mb-6">
              <h2 className="text-xl font-bold">Our values</h2>
            </div>
            <div className="flex flex-col gap-5">
              {SOCIETY.values.map((v, i) => {
                const Icon = VALUE_ICONS[i] ?? ShieldCheck;
                return (
                  <div key={v.title} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">{v.title}</div>
                      <div className="text-sm text-text-muted mt-1 leading-relaxed">{v.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="bg-surface border-t border-b py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="border-l-2 border-primary pl-4 mb-10">
            <h2 className="text-xl font-bold">Our activities</h2>
            <p className="mt-1 text-text-muted">
              The work we do across the community every year.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SOCIETY.activities.map((a) => (
              <div
                key={a.title}
                className="rounded-xl border p-6 flex flex-col gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-background"
              >
                <h3 className="font-semibold text-text-primary">{a.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="border-l-2 border-primary pl-4 mb-10">
            <h2 className="text-xl font-bold">Our journey</h2>
            <p className="mt-1 text-text-muted">
              How {SOCIETY.name} has grown since {SOCIETY.established}.
            </p>
          </div>
          <div className="flex flex-col">
            {SOCIETY.timeline.map((item, i) => (
              <div key={item.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1" />
                  {i < SOCIETY.timeline.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 my-1" />
                  )}
                </div>
                <div className="pb-8">
                  <div className="text-sm font-bold text-primary">{item.year}</div>
                  <div className="text-sm text-text-muted mt-0.5 leading-relaxed">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="bg-surface border-t py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="border-l-2 border-primary pl-4 mb-10">
            <h2 className="text-xl font-bold">Central leadership</h2>
            <p className="mt-1 text-text-muted">
              The central committee that oversees all town and village branches.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {SOCIETY.leadership.map((person) => (
              <div
                key={person.title}
                className="bg-background rounded-xl border p-5 flex flex-col items-center text-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Photo placeholder */}
                <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary/40" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary">{person.name}</div>
                  <div className="text-sm text-primary font-medium mt-0.5">{person.title}</div>
                  <div className="text-xs text-text-muted mt-1">{person.location}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Committee note */}
          <div className="mt-10 bg-primary/5 border border-primary/10 rounded-xl p-6">
            <h3 className="font-semibold text-text-primary mb-2">Town and village committees</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Each town and village in our network has its own dedicated committee
              with a local president and secretary. These committees are the backbone
              of {SOCIETY.name}, handling day-to-day activities and connecting
              members with the central leadership.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
