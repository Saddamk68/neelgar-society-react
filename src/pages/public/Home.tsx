// Replace your existing file at: src/pages/public/Home.tsx
import React from 'react';

export default function Home() {
  return (
    <main id="home" className="bg-slate-50 text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              Empowering communities — one life at a time
            </h1>
            <p className="mt-4 text-slate-700 max-w-xl">
              Practical programs in education, health and livelihoods that deliver measurable, lasting impact.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/donate" className="inline-flex items-center px-5 py-3 rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-700">
                Donate
              </a>
              <a href="/volunteer" className="inline-flex items-center px-5 py-3 rounded-md border border-slate-200 text-slate-800 hover:bg-slate-100">
                Volunteer
              </a>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden shadow-lg">
            <div className="w-full h-64 md:h-80 bg-slate-200 flex items-center justify-center text-slate-500">
              {/* Replace with real image: /images/hero-community.jpg */}
              <span>Hero image</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Stat label="People helped" value="12,450" />
            <Stat label="Active projects" value="34" />
            <Stat label="Years of service" value="18" />
          </div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section id="programs" className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold">What we do</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">Programs focused on education, healthcare and livelihoods — designed with the community.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Education" desc="After-school coaching, scholarships and learning centers." />
            <Card title="Healthcare" desc="Health camps, maternal & child care, awareness drives." />
            <Card title="Livelihoods" desc="Skill training and micro-grants for small businesses." />
          </div>
        </div>
      </section>

      {/* FEATURED STORY */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-xl font-semibold">A story of change</h3>
            <p className="mt-4 text-slate-700">Through our vocational training, Asha started a tailoring unit and now supports her family.</p>
            <blockquote className="mt-4 border-l-4 border-emerald-100 pl-4 italic text-slate-800">“I can now earn for my children — thank you Neelgar.”</blockquote>
          </div>
          <div className="rounded overflow-hidden shadow bg-slate-100 h-56 flex items-center justify-center text-slate-500">
            {/* Replace with /images/featured-asha.jpg */}
            <span>Featured image</span>
          </div>
        </div>
      </section>
    </main>
  );
}

/* Small presentational components (local, no external imports) */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-2 text-sm text-slate-600">{label}</div>
    </div>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <article className="p-6 bg-white rounded-lg shadow-sm">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
      <a href={`/programs/${title.toLowerCase()}`} className="mt-4 inline-block text-indigo-600 text-sm">Learn more →</a>
    </article>
  );
}
