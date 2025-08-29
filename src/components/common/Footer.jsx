import React, { useState } from 'react';

const SocialLink = ({ href, label, children }) => (
  <a
    href={href}
    aria-label={label}
    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 hover:bg-white text-slate-600 hover:text-blue-700 shadow-sm ring-1 ring-slate-200 transition"
    target="_blank"
    rel="noreferrer"
  >
    {children}
  </a>
);

const Footer = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  return (
    <footer className="mt-20 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🐸</span>
              <span className="text-xl font-extrabold text-blue-700">LeapFrog Health</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Safer care through transparency and the Leapfrog methodology.
            </p>
            <div className="mt-5 space-y-1 text-sm text-slate-700">
              <p>123 Clinical Way, Safe City</p>
              <p>
                <a href="tel:+11234567890" className="hover:text-blue-700">(+1) 123‑456‑7890</a>
              </p>
              <p>
                <a href="mailto:care@leapfrog.health" className="hover:text-blue-700">care@leapfrog.health</a>
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <SocialLink href="#" label="X / Twitter">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.49 11.24H16.55l-5.53-7.239-6.32 7.239H1.39l7.73-8.85L1 2.25h6.61l5 6.593 5.634-6.593Zm-1.157 18.5h1.833L7.01 4.13H5.05l12.037 16.62Z"/></svg>
              </SocialLink>
              <SocialLink href="#" label="LinkedIn">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 23.5h4V7.5h-4v16zM8.5 7.5h3.82v2.16h.05c.53-1 1.82-2.16 3.75-2.16 4.01 0 4.75 2.64 4.75 6.07v9.93h-4v-8.8c0-2.1-.04-4.79-2.92-4.79-2.92 0-3.36 2.28-3.36 4.63v8.96h-4V7.5z"/></svg>
              </SocialLink>
              <SocialLink href="#" label="YouTube">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .6 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.3.6 9.3.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.4V8.6l6.2 3.4-6.2 3.4Z"/></svg>
              </SocialLink>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-900">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {[
                { label: 'About', href: '#about' },
                { label: 'Leapfrog Methodology', href: '#leapfrog' },
                { label: 'Services', href: '#services' },
                { label: 'Outcomes', href: '#outcomes' },
                { label: 'Contact', href: '#contact' },
              ].map((l) => (
                <li key={l.label}>
                  <a className="hover:text-blue-700" href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="font-semibold text-slate-900">Portals</h4>
            <p className="mt-4 text-sm text-slate-700">Secure access for patients and clinicians.</p>
            <div className="mt-5 space-y-3">
              <button onClick={onSignIn} className="w-full text-left px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm">Patient Sign in</button>
              <button onClick={onSignIn} className="w-full text-left px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">Doctor Sign in</button>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-slate-900">Stay in the loop</h4>
            <p className="mt-4 text-sm text-slate-700">Get quality and safety updates from LeapFrog Health.</p>
            {subscribed ? (
              <div className="mt-5 rounded-lg bg-green-50 text-green-700 text-sm p-3 ring-1 ring-green-200">Thanks! You are subscribed.</div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-5 flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Subscribe</button>
              </form>
            )}
            <p className="mt-2 text-xs text-slate-500">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-slate-600 flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} LeapFrog Health</p>
          <div className="flex items-center gap-4 text-xs">
            <a href="#" className="hover:text-blue-700">Privacy</a>
            <a href="#" className="hover:text-blue-700">Terms</a>
            <a href="#" className="hover:text-blue-700">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


