import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Public marketing / landing page for Institute ERP.
 * Rendered at "/" and links into the authenticated app via "/login".
 */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeSection = useActiveSection(['features', 'problem', 'how', 'roles', 'contact']);

  const navLink = (id: string, label: string) =>
    `text-sm font-medium transition-colors ${
      activeSection === id ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
    }`;

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* ---------------------------------------------------------------- Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <LogoMark />
            </span>
            <span className="text-lg font-bold tracking-tight">Institute<span className="text-indigo-600">ERP</span></span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className={navLink('features', 'Features')}>Features</a>
            <a href="#problem" className={navLink('problem', 'Why ERP')}>Why ERP</a>
            <a href="#how" className={navLink('how', 'How it works')}>How it works</a>
            <a href="#roles" className={navLink('roles', 'Roles')}>Roles</a>
            <a href="#contact" className={navLink('contact', 'Contact')}>Contact</a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Access ERP
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-gray-100 bg-white px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#problem" className="text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>Why ERP</a>
              <a href="#how" className="text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>How it works</a>
              <a href="#roles" className="text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>Roles</a>
              <a href="#contact" className="text-sm font-medium text-gray-600" onClick={() => setMenuOpen(false)}>Contact</a>
              <Link to="/login" className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white">
                Access ERP
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* --------------------------------------------------------------- Hero */}
      <section id="top" className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-green-500" /> All-in-one institute management
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Run your institute on a <span className="text-indigo-600">single platform</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-gray-600">
              Institute ERP brings students, trainers, counsellors and admins together — manage
              attendance, evaluations, fees, assignments and reports from one secure, role-based
              dashboard. No more scattered spreadsheets.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
              >
                Access the ERP
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a href="#contact" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50">
                Book a demo
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              <Stat value="4" label="User roles" />
              <Stat value="12+" label="Modules" />
              <Stat value="QR" label="Attendance" />
              <Stat value="PDF / Excel" label="Reports" />
            </div>
          </div>

          {/* Dashboard mockup visual */}
          <div className="relative">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Social proof */}
      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
          {TRUST_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">{s.value}</div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Problem */}
      <Reveal as="section" id="problem" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Why an ERP</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">The problem we solve</h2>
          <p className="mt-4 text-lg text-gray-600">
            Educational institutes juggle attendance registers, fee ledgers, mark sheets and
            announcements across disconnected tools. Data gets lost, reports take hours, and no one
            has a clear picture. Institute ERP replaces that chaos with one connected system.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <ProblemCard
            icon={<IconScattered />}
            before="Scattered spreadsheets & paper registers"
            after="One centralized, always-up-to-date database"
          />
          <ProblemCard
            icon={<IconClock />}
            before="Hours spent compiling attendance & marks reports"
            after="One-click PDF & Excel report generation"
          />
          <ProblemCard
            icon={<IconShield />}
            before="Everyone sees everything — no access control"
            after="Role-based access with secure JWT login"
          />
        </div>
      </Reveal>

      {/* --------------------------------------------------------- How it works */}
      <section id="how" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From setup to insight in four steps</h2>
            <p className="mt-4 text-lg text-gray-600">
              The whole institute works off the same data — each role picks up exactly where the last left off.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 80} className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <svg className="absolute -right-4 top-10 hidden h-6 w-6 text-indigo-300 lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Features</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Everything your institute needs</h2>
          <p className="mt-4 text-lg text-gray-600">
            A complete toolkit, organized around what you're trying to get done.
          </p>
        </Reveal>

        <div className="mt-14 space-y-14">
          {FEATURE_GROUPS.map((group) => (
            <Reveal key={group.name}>
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  {group.icon}
                </span>
                <h3 className="text-xl font-bold">{group.name}</h3>
                <span className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((f) => (
                  <FeatureCard key={f.title} {...f} />
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- Roles */}
      <section id="roles" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto max-w-3xl text-center">
            <SectionEyebrow>Roles</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Built for every role</h2>
            <p className="mt-4 text-lg text-gray-600">
              Each user gets a focused dashboard with exactly the tools they need — nothing more.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {ROLES.map((r, i) => (
              <Reveal key={r.name} delay={i * 80} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${r.color}`}>{r.icon}</span>
                <h3 className="mt-4 text-lg font-bold">{r.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{r.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <SectionEyebrow>Loved by institutes</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">What our users say</h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 80} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <Stars />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-700">“{t.quote}”</p>
              <div className="mt-6 flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${t.color}`}>
                  {t.name.charAt(0)}
                </span>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ CTA band */}
      <section className="bg-indigo-600">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-14 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to access your dashboard?</h2>
            <p className="mt-2 text-indigo-100">Sign in with your institute credentials to get started.</p>
          </div>
          <Link
            to="/login"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-7 py-3 text-base font-semibold text-indigo-700 shadow-lg transition-colors hover:bg-indigo-50"
          >
            Access ERP
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------------- FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <Reveal className="text-center">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
        </Reveal>
        <div className="mt-10 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-gray-900">
                {f.q}
                <svg className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Contact */}
      <section id="contact" className="bg-gray-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2">
          <Reveal>
            <SectionEyebrow>Contact</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Contact & support</h2>
            <p className="mt-4 text-lg text-gray-600">
              Need help getting onboarded or have a question about your account? Our support team is
              here for students, trainers and administrators alike.
            </p>

            <div className="mt-8 space-y-5">
              <ContactRow icon={<IconMail />} label="Email support" value="support@institute-erp.com" href="mailto:support@institute-erp.com" />
              <ContactRow icon={<IconPhone />} label="Phone" value="+91 98765 43210" href="tel:+919876543210" />
              <ContactRow icon={<IconChat />} label="Help desk hours" value="Mon–Sat, 9:00 AM – 6:00 PM IST" />
              <ContactRow icon={<IconDocs />} label="API documentation" value="/docs (Swagger UI)" href="/docs" />
            </div>
          </Reveal>

          {/* Support card */}
          <Reveal delay={120} className="rounded-2xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-white p-8 shadow-sm">
            <h3 className="text-xl font-bold">Get in touch</h3>
            <p className="mt-1 text-sm text-gray-600">Send us a message and we'll respond within one business day.</p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = 'mailto:support@institute-erp.com';
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <input aria-label="Your name" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Your name" required />
                <input aria-label="Email address" type="email" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Email address" required />
              </div>
              <input aria-label="Subject" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Subject" />
              <textarea aria-label="Message" rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="How can we help?" required />
              <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                Send message
              </button>
            </form>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------- Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <LogoMark />
            </span>
            <span className="font-bold">Institute<span className="text-indigo-600">ERP</span></span>
          </div>
          <p className="text-sm text-gray-500">© {2026} Institute ERP. All rights reserved.</p>
          <Link to="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in →
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ Data */

const TRUST_STATS = [
  { value: '250+', label: 'Students managed' },
  { value: '12', label: 'Active batches' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 1s', label: 'Report generation' },
];

const STEPS = [
  { title: 'Admin sets up', desc: 'Create batches, modules and users, then assign trainers and counsellors in a few clicks.' },
  { title: 'Trainers teach', desc: 'Run lectures, mark QR attendance, post assignments and record evaluations.' },
  { title: 'Students engage', desc: 'Submit work, track performance and attendance, and never miss an announcement.' },
  { title: 'Everyone reports', desc: 'Generate attendance and marks reports as PDF or Excel — instantly, for any batch.' },
];

const FEATURE_GROUPS = [
  {
    name: 'Teach & track',
    icon: <IconChart />,
    items: [
      { title: 'Attendance Management', desc: 'QR code-based and manual attendance tracking with secure, HMAC-signed session tokens.', icon: <IconCheck /> },
      { title: 'Evaluation System', desc: 'Marks management and mock interviews with multi-parameter scoring for every student.', icon: <IconChart /> },
      { title: 'Assignments & Resources', desc: 'Upload assignments, collect submissions and share learning resources with file support.', icon: <IconFile /> },
    ],
  },
  {
    name: 'Engage & communicate',
    icon: <IconBell />,
    items: [
      { title: 'Notifications', desc: 'Role-targeted and batch-specific announcements keep everyone informed in real time.', icon: <IconBell /> },
      { title: 'Dashboard Analytics', desc: 'Visual dashboards with charts tailored to each role for instant insight.', icon: <IconGauge /> },
      { title: 'Batch & Module Management', desc: 'Organize students into batches, assign modules and link trainers effortlessly.', icon: <IconLayers /> },
    ],
  },
  {
    name: 'Manage & report',
    icon: <IconReport />,
    items: [
      { title: 'Fee Management', desc: 'Track payments, pending amounts, due dates and full payment history at a glance.', icon: <IconWallet /> },
      { title: 'Reporting', desc: 'Generate professional attendance and marks reports as PDF or Excel in one click.', icon: <IconReport /> },
      { title: 'Secure Access Control', desc: 'JWT authentication with four distinct roles ensures everyone sees only what they should.', icon: <IconLock /> },
    ],
  },
];

const ROLES = [
  { name: 'Admin', desc: 'Full system management — users, batches, modules and reports.', color: 'bg-indigo-100 text-indigo-700', icon: <IconCrown /> },
  { name: 'Trainer', desc: 'Lectures, attendance, assignments, evaluations and mock interviews.', color: 'bg-purple-100 text-purple-700', icon: <IconTeach /> },
  { name: 'Counsellor', desc: 'Student mentoring, fee tracking and early-warning alerts.', color: 'bg-emerald-100 text-emerald-700', icon: <IconChat /> },
  { name: 'Student', desc: 'View attendance, performance, assignments, resources and notices.', color: 'bg-amber-100 text-amber-700', icon: <IconGrad /> },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Center Director', color: 'bg-indigo-100 text-indigo-700', quote: 'We replaced four spreadsheets and a WhatsApp group with one dashboard. Attendance and fee tracking finally live in the same place.' },
  { name: 'Rahul Verma', role: 'Senior Trainer', color: 'bg-purple-100 text-purple-700', quote: 'QR attendance takes seconds, and mock-interview scoring is built right in. I spend my time teaching, not on paperwork.' },
  { name: 'Anjali Nair', role: 'Counsellor', color: 'bg-emerald-100 text-emerald-700', quote: 'Fee alerts and performance flags mean I can reach out to students before small issues become big ones.' },
];

const FAQS = [
  { q: 'Is my institute’s data secure?', a: 'Yes. Access is protected by JWT authentication with strict role-based permissions, so every user only sees the data relevant to their role. Attendance QR codes are HMAC-signed to prevent tampering.' },
  { q: 'Do I need to install anything?', a: 'No. Institute ERP runs in any modern web browser. Administrators can also self-host it via Docker if they prefer to run it on their own infrastructure.' },
  { q: 'Can I export attendance and marks reports?', a: 'Absolutely. Reports can be generated as PDF or Excel files in one click for any batch or student.' },
  { q: 'Which roles are supported?', a: 'Four roles out of the box — Admin, Trainer, Counsellor and Student — each with its own focused dashboard and permissions.' },
  { q: 'How do I get login credentials?', a: 'Your institute administrator creates accounts and shares credentials. Once you have them, just use the “Access ERP” button to sign in.' },
];

/* ------------------------------------------------------------- Components */

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-semibold uppercase tracking-wider text-indigo-600">{children}</span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-indigo-600">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function Stars() {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.364 1.118l1.287 3.96c.3.922-.755 1.688-1.54 1.118l-3.367-2.448a1 1 0 00-1.175 0l-3.367 2.448c-.784.57-1.838-.196-1.539-1.118l1.286-3.96a1 1 0 00-.363-1.118L2.075 9.387c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.286-3.96z" />
        </svg>
      ))}
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
    </div>
  );
}

function ProblemCard({ icon, before, after }: { icon: React.ReactNode; before: string; after: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">{icon}</span>
      <p className="mt-4 flex items-start gap-2 text-sm text-gray-500 line-through decoration-red-300">
        {before}
      </p>
      <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-gray-900">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        {after}
      </p>
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-4">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">{icon}</span>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</div>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href} className="block transition-opacity hover:opacity-80">{content}</a> : content;
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl shadow-indigo-600/10">
      {/* window bar */}
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-3 text-xs font-medium text-gray-400">Admin Dashboard</span>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Students" value="248" tone="bg-indigo-50 text-indigo-700" />
        <MiniStat label="Batches" value="12" tone="bg-purple-50 text-purple-700" />
        <MiniStat label="Trainers" value="18" tone="bg-emerald-50 text-emerald-700" />
      </div>

      {/* bar chart */}
      <div className="mt-4 rounded-xl border border-gray-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">Attendance overview</span>
          <span className="text-xs text-gray-400">This week</span>
        </div>
        <div className="flex h-24 items-end gap-2">
          {[55, 78, 64, 90, 72, 84, 60].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* list rows */}
      <div className="mt-4 space-y-2">
        {['Mock interview scheduled', 'Fee reminder sent', 'New assignment uploaded'].map((t) => (
          <div key={t} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="text-xs text-gray-600">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-xl p-3 ${tone}`}>
      <div className="text-lg font-extrabold">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide opacity-70">{label}</div>
    </div>
  );
}

/* ----------------------------------------------------- Scroll-reveal utils */

/**
 * Wraps children in an element that fades/slides in when scrolled into view.
 * Honors prefers-reduced-motion via the `.reveal` CSS (which renders it static).
 */
function Reveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section';
  id?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLElement>}
      id={id}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/** Tracks which section is currently in view to highlight the active nav link. */
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState('');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

/* ----------------------------------------------------------------- Icons */
/* Minimal inline SVGs — no external image dependencies. */

function LogoMark() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.42A12 12 0 0112 21a12 12 0 01-6.16-10.42L12 14z" />
    </svg>
  );
}

const ic = 'h-6 w-6';
function IconCheck() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IconChart() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function IconWallet() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>; }
function IconFile() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>; }
function IconReport() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }
function IconBell() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>; }
function IconGauge() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9A9.004 9.004 0 0015 3.512V9h5.488z" /></svg>; }
function IconLayers() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>; }
function IconLock() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>; }

function IconScattered() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>; }
function IconClock() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IconShield() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>; }

function IconMail() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>; }
function IconPhone() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>; }
function IconChat() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>; }
function IconDocs() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>; }

function IconCrown() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5zm0 0h14" /></svg>; }
function IconTeach() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.42A12 12 0 0112 21a12 12 0 01-6.16-10.42L12 14z" /></svg>; }
function IconGrad() { return <svg className={ic} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.42A12 12 0 0112 21a12 12 0 01-6.16-10.42L12 14z" /></svg>; }
