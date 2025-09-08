export default function About() {
  return (
    <main id="about" className="bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold">About Neelgar Society</h1>
        <p className="mt-4 text-slate-700 max-w-2xl">
          Founded in 2007, Neelgar Society works across education, health and livelihoods to empower communities.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold">Our mission</h2>
            <p className="mt-3 text-slate-600">To create sustainable opportunities and improve quality of life for families living in underserved areas.</p>

            <h3 className="mt-6 font-semibold">Our values</h3>
            <ul className="mt-3 space-y-2 text-slate-600 list-disc list-inside">
              <li>Community-led solutions</li>
              <li>Transparency & accountability</li>
              <li>Dignity & inclusion</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Milestones</h2>
            <ol className="mt-3 space-y-4 text-slate-600">
              <li><strong>2007</strong> — Founded and launched first learning center.</li>
              <li><strong>2012</strong> — First health camp; reached 5,000 beneficiaries.</li>
              <li><strong>2019</strong> — Launched livelihoods program.</li>
              <li><strong>2023</strong> — Reached 10,000 community members.</li>
            </ol>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Our team</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Person name="Rita Sharma" title="Founder & Executive Director" bio="Community leader with 20+ years experience." />
            <Person name="Arjun Patel" title="Programs Lead" bio="Designs and runs on-the-ground programs." />
            <Person name="Maya Rao" title="Finance & Operations" bio="Oversees grants and partnerships." />
          </div>
        </section>
      </div>
    </main>
  );
}

function Person({ name, title, bio }: { name: string; title: string; bio: string }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow flex items-start gap-4">
      <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">{initials(name)}</div>
      <div>
        <div className="font-semibold">{name}</div>
        <div className="text-sm text-slate-600">{title}</div>
        <p className="mt-2 text-sm text-slate-600">{bio}</p>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0,2).join('');
}
