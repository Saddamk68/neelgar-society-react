import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { Users, BookOpen, ShieldCheck, ArrowRight, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-background text-text-primary">

      {/* Hero */}
      <section className="bg-surface border-b">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-5">
              Society Management Portal
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-text-primary">
              Your community,<br /> organized and<br />
              <span className="text-primary">in one place.</span>
            </h1>
            <p className="mt-5 text-text-muted leading-relaxed max-w-md">
              Neelgar Society Portal helps administrators and members manage families,
              records and roles — securely and transparently.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={ROUTES.PUBLIC.LOGIN}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold shadow-sm hover:opacity-90 transition"
              >
                Login to portal <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center px-6 py-3 rounded-lg border border-slate-200 text-text-muted hover:text-text-primary hover:bg-slate-50 transition"
              >
                Learn more
              </a>
            </div>
          </div>

          {/* Right side — trust signals */}
          <div className="hidden md:flex flex-col gap-4">
            <TrustCard text="Secure role-based access for every member" />
            <TrustCard text="Complete family and relationship records" />
            <TrustCard text="Full audit trail of all administrative actions" />
            <TrustCard text="Managed by your society — not a third party" />
          </div>
        </div>
      </section >

      {/* Stats band */}
      < section className="bg-primary border-b" >
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <StatItem number="500+" label="Registered families" />
          <StatItem number="2,000+" label="Member profiles" />
          <StatItem number="10+" label="Years of records" />
          <StatItem number="100%" label="Self-hosted and private" />
        </div>
      </section >

      {/* Features */}
      < section id="features" className="py-20" >
        <div className="max-w-5xl mx-auto px-6">
          <div className="border-l-2 border-primary pl-4 mb-10">
            <h2 className="text-2xl font-bold text-text-primary">What the portal offers</h2>
            <p className="mt-1 text-text-muted">
              Built for society administrators and members alike.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Users}
              title="Member and family management"
              desc="Maintain detailed profiles for every member and family unit, with full relationship and lineage tracking."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Role-based access control"
              desc="Fine-grained permissions ensure the right people see the right data — admins, members and guests each have their place."
            />
            <FeatureCard
              icon={BookOpen}
              title="Audit and activity logs"
              desc="Every action is recorded. Know who changed what and when — full accountability built in."
            />
          </div>
        </div>
      </section >

      {/* CTA band */}
      < section className="bg-surface border-t py-20" >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="border-l-2 border-primary pl-4 text-left mb-8 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold">Already a member?</h2>
            <p className="mt-1 text-text-muted">
              Log in to access your profile, family records and society information.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
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
      </section >

    </div >
  );
}

function TrustCard({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 bg-primary/5 rounded-lg px-4 py-3 border border-primary/10">
      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <span className="text-sm text-text-primary leading-snug">{text}</span>
    </div>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-extrabold text-white tracking-tight">{number}</div>
      <div className="mt-1 text-sm text-white/70">{label}</div>
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
    <div className="bg-surface rounded-xl border p-6 flex flex-col gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold text-text-primary">{title}</h3>
      <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
    </div>
  );
}
