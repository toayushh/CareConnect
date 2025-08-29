import React from 'react';
import Footer from '../common/Footer';

const Stat = ({ value, label }) => (
  <div className="text-center">
    <div className="text-3xl font-extrabold text-blue-700">{value}</div>
    <div className="text-sm text-gray-600 mt-1">{label}</div>
  </div>
);

const Badge = ({ title, description }) => (
  <div className="p-5 rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
    <div className="flex items-start gap-3">
      <span className="text-2xl">✅</span>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

const LandingPage = ({ onSignIn }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-gradient-to-r from-emerald-600 to-blue-600 shadow-lg border-b border-emerald-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            {/* Enhanced Frog Logo */}
            <div className="relative">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 animate-breathe">
                <span className="text-2xl filter drop-shadow-sm">🐸</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-xs">✨</span>
              </div>
            </div>
            
            {/* Logo Text */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-1">
                <h1 className="text-xl font-black text-white tracking-tight">LeapFrog</h1>
                <span className="px-2 py-0.5 bg-yellow-400 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wide shadow-sm animate-pulse-glow">
                  AI
                </span>
              </div>
              <span className="text-xs text-emerald-100 font-medium hidden sm:block -mt-0.5">
                🏥 Healthcare Platform
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white">
            <a href="#about" className="hover:text-yellow-200 transition-colors">About</a>
            <a href="#leapfrog" className="hover:text-yellow-200 transition-colors">Leapfrog Methodology</a>
            <a href="#services" className="hover:text-yellow-200 transition-colors">Services</a>
            <a href="#outcomes" className="hover:text-yellow-200 transition-colors">Outcomes</a>
            <a href="#contact" className="hover:text-yellow-200 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-all duration-200 hover:scale-105 border border-white/30"
            >
              <span>Sign in</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/images/hero.svg')" }}
        />
        <div className="bg-gradient-to-b from-white/60 via-white/70 to-white pt-20 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                Safer, Smarter Care with the Leapfrog Methodology
              </h1>
              <p className="mt-4 text-lg text-gray-700 leading-relaxed">
                We measure, report, and improve on what matters: patient safety,
                evidence‑based care, and transparent outcomes. Our hospital is
                aligned to Leapfrog standards so every decision advances quality.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={onSignIn}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md"
                >
                  Book or Sign in
                </button>
                <a href="#leapfrog" className="px-6 py-3 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50">
                  Explore our standards
                </a>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6">
                <Stat value="A" label="Hospital Safety Grade" />
                <Stat value="99%" label="Medication scanning compliance" />
                <Stat value="24/7" label="ICU intensivist coverage" />
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-lg aspect-video bg-black">
              <video
                className="w-full h-full object-cover"
                src="/asset/vid1.mp4"
                autoPlay
                loop
                muted
                playsInline
                controls
                poster="/assets/images/hero.svg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <img
            src="/asset/img.png"
            alt="Modern patient-centered hospital"
            className="rounded-2xl shadow-md ring-1 ring-gray-100 object-cover w-full h-full"
            onError={(e) => {
              if (e.currentTarget.src.endsWith('img.png')) {
                e.currentTarget.src = '/assets/images/hero.svg';
              }
            }}
          />
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Patient‑Centered, Data‑Driven</h2>
            <p className="mt-4 text-gray-700 leading-relaxed">
              From digital triage to bedside, our teams use standardized checklists,
              closed‑loop communication, and real‑time surveillance to reduce harm
              and improve outcomes.
            </p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start gap-2"><span>🧪</span> Computerized provider order entry (CPOE) with decision support</li>
              <li className="flex items-start gap-2"><span>🩺</span> ICU care led by board‑certified intensivists</li>
              <li className="flex items-start gap-2"><span>💊</span> Bar‑code medication administration (BCMA)</li>
              <li className="flex items-start gap-2"><span>👶</span> Evidence‑based maternity care measures tracked and published</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Leapfrog methodology */}
      <section id="leapfrog" className="py-20 bg-gradient-to-b from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-900 text-center">How We Operationalize the Leapfrog Methodology</h3>
          <p className="mt-3 text-center text-gray-700 max-w-3xl mx-auto">
            We publicly report on nationally standardized measures and hard‑wire them into
            daily practice. Here are a few pillars we track continuously.
          </p>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Badge title="CPOE & Test Results Safety" description="All medication and diagnostic orders are placed electronically with clinical decision support to prevent contraindications and dosage errors." />
            <Badge title="ICU Physician Staffing" description="Intensivists provide 24/7 coverage with rapid‑response escalation pathways reducing mortality and complications." />
            <Badge title="BCMA & Pharmacy Verification" description="100% bedside bar‑code scanning with pharmacist verification for high‑alert medications." />
            <Badge title="Maternity Care" description="Lower NTSV cesarean rates, safe episiotomy practice, and respectful maternity care tracked per Leapfrog measures." />
            <Badge title="Infections & Falls" description="CLABSI, CAUTI, C. diff and fall rates monitored via real‑time dashboards with unit‑level ownership." />
            <Badge title="Transparency" description="Outcomes are shared with patients and staff; we close the loop on every safety event in under 72 hours." />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-900 text-center">Comprehensive Services</h3>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🏥',
                title: 'Emergency & Acute Care',
                text: 'Door‑to‑diagnosis in minutes with protocolized stroke, STEMI and sepsis pathways.',
              },
              { icon: '🫀', title: 'Cardiac & Imaging', text: 'Low‑dose imaging, cath lab excellence, and post‑procedure safety huddles.' },
              { icon: '🧠', title: 'Neuro & Rehab', text: 'Early mobility programs and goal‑directed neuro‑rehab.' },
            ].map((s) => (
              <div key={s.title} className="p-6 rounded-xl ring-1 ring-gray-100 shadow-sm bg-white">
                <div className="text-4xl">{s.icon}</div>
                <h4 className="mt-4 font-semibold text-gray-900">{s.title}</h4>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section id="outcomes" className="py-20 bg-gradient-to-b from-indigo-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-lg aspect-video bg-black">
            <video
              className="w-full h-full object-cover"
              src="/asset/vid2.mp4"
              controls
              playsInline
              poster="/assets/images/hero.svg"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900">Measured Results</h3>
            <ul className="mt-6 space-y-3 text-gray-700">
              <li>• 35% reduction in serious safety events YoY</li>
              <li>• 28% lower readmissions compared to regional average</li>
              <li>• Top quartile patient‑reported experience scores</li>
            </ul>
            <button onClick={onSignIn} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md">
              Get started — Sign in
            </button>
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900">Your safety comes first.</h3>
          <p className="mt-2 text-gray-700">Log in to book appointments, view records, and message your care team.</p>
          <button onClick={onSignIn} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md">
            Sign in now
          </button>
        </div>
      </section>

      <Footer onSignIn={onSignIn} />
    </div>
  );
};

export default LandingPage;


