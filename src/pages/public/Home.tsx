import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { Users, BookOpen, ShieldCheck, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background text-text-primary">

      <section className="bg-surface border-b">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
            Neelgar Society Portal
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-text-primary">
            Manage your community, the right way
          </h1>
          <p className="mt-5 text-text-muted max-w-xl mx-auto text-base md:text-lg">
            A secure, organized portal for managing society members, families,
            relationships and records — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              to={ROUTES.PUBLIC.LOGIN}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-white font-medium shadow hover:opacity-90 transition"
            >
              Login to portal <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center px-6 py-3 rounded-md border border-slate-200 text-text-primary hover:bg-slate-50 transition"
            >
              Learn more
            </a>
          </div>
        </div>
      </section >

      <section className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <Stat value="Families" label="Tracked and organized" />
          <Stat value="Members" label="Profiles managed" />
          <Stat value="Roles" label="Access controlled" />
          <Stat value="Secure" label="Auth and permissions" />
        </div>
      </section>

      <section id="features" className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center">What the portal offers</h2>
          <p className="mt-2 text-text-muted text-center max-w-xl mx-auto">
            Built for society administrators and members alike.
          </p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Users}
              title="Member and family management"
              desc="Maintain detailed profiles for every member and family unit, including relationships and lineage."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Role-based access"
              desc="Fine-grained permissions ensure the right people access the right data — nothing more."
            />
            <FeatureCard
              icon={BookOpen}
              title="Audit and activity logs"
              desc="Every action is recorded. Stay informed about who changed what and when."
            />
          </div>
        </div>
      </section>

      <section className="bg-primary/5 border-t border-b py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="mt-3 text-text-muted">
            Contact your society administrator to get your account set up,
            or log in if you already have access.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link
              to={ROUTES.PUBLIC.LOGIN}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-white font-medium shadow hover:opacity-90 transition"
            >
              Login <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={ROUTES.PUBLIC.CONTACT}
              className="inline-flex items-center px-6 py-3 rounded-md border border-slate-200 text-text-primary hover:bg-slate-50 transition"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

    </div >
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-sm text-text-muted">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-surface rounded-xl border p-6 flex flex-col gap-3 hover:shadow-md transition">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-muted">{desc}</p>
    </div>
  );
}
