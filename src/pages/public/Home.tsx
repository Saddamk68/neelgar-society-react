import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { Users, BookOpen, ShieldCheck, ArrowRight, CheckCircle } from "lucide-react";
import { SOCIETY } from "../../constants/society";
import UpcomingEventsWidget from "@/features/events/components/UpcomingEventsWidget";
import NoticesBanner from "@/features/notices/components/NoticesBanner";

export default function Home() {
  return (
    <div className="bg-background text-text-primary">

      {/* Hero */}
      <section className="bg-surface border-b">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
              Est. {SOCIETY.established} — {SOCIETY.headquarters}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-text-primary">
              Reforming traditions.<br />
              <span className="text-primary">Strengthening families.</span>
            </h1>
            <p className="mt-5 text-text-muted leading-relaxed max-w-md">
              {SOCIETY.mission}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={ROUTES.PUBLIC.LOGIN}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold shadow-sm hover:opacity-90 transition"
              >
                Member login <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.PUBLIC.ABOUT}
                className="inline-flex items-center px-6 py-3 rounded-lg border border-slate-200 text-text-muted hover:text-text-primary hover:bg-slate-50 transition"
              >
                About us
              </Link>
            </div>
          </div>

          {/* Right — values */}
          <div className="hidden md:flex flex-col gap-4">
            {SOCIETY.values.map((v) => (
              <div
                key={v.title}
                className="flex items-start gap-3 bg-primary/5 rounded-lg px-4 py-3 border border-primary/10"
              >
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-text-primary">{v.title}</div>
                  <div className="text-xs text-text-muted mt-0.5 leading-relaxed">{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-primary">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {SOCIETY.stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-white tracking-tight">{s.number}</div>
              <div className="mt-1 text-sm text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Samuhik Vivah highlight */}
      <section className="py-20 bg-surface border-b">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="border-l-2 border-primary pl-4 mb-6">
              <h2 className="text-2xl font-bold">Samuhik Vivah Samelan</h2>
              <p className="mt-1 text-text-muted text-sm">Our flagship annual event</p>
            </div>
            <p className="text-text-muted leading-relaxed">
              Every year, {SOCIETY.name} organizes the Samuhik Vivah Samelan — a mass
              marriage ceremony that provides families a dignified, simple and
              Islamic wedding free from wasteful customs and financial burden.
            </p>
            <p className="mt-4 text-text-muted leading-relaxed">
              This event stands as the clearest expression of our mission —
              proof that tradition and dignity do not require excess.
            </p>
            <Link
              to={ROUTES.PUBLIC.ABOUT}
              className="inline-flex items-center gap-2 mt-6 text-sm text-primary font-medium hover:underline"
            >
              Learn more about our work <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Placeholder image */}
          <div className="rounded-xl bg-primary/5 border border-primary/10 h-64 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-text-muted">Samuhik Vivah Samelan photo</p>
            <p className="text-xs text-text-muted opacity-60">Replace with actual event image</p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="border-l-2 border-primary pl-4 mb-8">
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            <p className="mt-1 text-text-muted">
              Meetings, camps and the next Samuhik Vivah Samelan.
            </p>
          </div>
          <NoticesBanner />
          <UpcomingEventsWidget limit={5} calendarRoute={ROUTES.PUBLIC.EVENTS} />
        </div>
      </section>

      {/* Activities */}
      <section id="features" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="border-l-2 border-primary pl-4 mb-10">
            <h2 className="text-2xl font-bold">What we do</h2>
            <p className="mt-1 text-text-muted">
              Our work spans welfare, reform and community building.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SOCIETY.activities.map((a) => (
              <div
                key={a.title}
                className="bg-surface rounded-xl border p-6 flex flex-col gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-text-primary">{a.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal CTA */}
      <section className="bg-surface border-t py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="border-l-2 border-primary pl-4 mb-8">
            <h2 className="text-2xl font-bold">Member portal</h2>
            <p className="mt-1 text-text-muted">
              Society administrators and members can log in to manage records,
              families and society information.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTES.PUBLIC.LOGIN}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold shadow-sm hover:opacity-90 transition"
            >
              Login <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={ROUTES.PUBLIC.CONTACT}
              className="inline-flex items-center px-6 py-3 rounded-lg border border-slate-200 text-text-muted hover:text-text-primary hover:bg-slate-50 transition"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
