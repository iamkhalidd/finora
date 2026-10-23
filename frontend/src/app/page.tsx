import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Logo from "@/components/shell/Logo";
import RedirectIfSignedIn from "@/components/RedirectIfSignedIn";

const FEATURES = [
  {
    icon: "pie_chart",
    title: "Budgets that speak up early",
    text: "Set a monthly limit for food, transport, data or owambe. Finora shows what's left per day and warns you at 80%, not after the money is gone.",
  },
  {
    icon: "mail",
    title: "Bank alerts in, typing out",
    text: "Forward your GTBank, Kuda, Access or OPay alert emails. Finora reads the amount and merchant, suggests a category, and you approve with one tap.",
  },
  {
    icon: "candlestick_chart",
    title: "An honest trading journal",
    text: "Log entries, exits and notes for gold, forex and indices. See win rate, profit factor and which sessions and strategies actually pay.",
  },
];

// Example figures for the preview card; not anyone's real account
const SAMPLE = [
  { icon: "restaurant", name: "Food & Groceries", note: "Shoprite Lekki", amount: "-₦23,450" },
  { icon: "directions_car", name: "Transport", note: "Bolt ride", amount: "-₦4,200" },
  { icon: "payments", name: "Salary", note: "October pay", amount: "+₦850,000", income: true },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <RedirectIfSignedIn />

      <header className="max-w-6xl w-full mx-auto px-5 py-5 flex items-center justify-between gap-4">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn px-4 py-2.5 text-sm text-ink hover:bg-surface-2">Sign in</Link>
          <Link href="/register" className="btn-primary px-4 py-2.5 text-sm">Get started</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-5 pt-8 pb-16 lg:pt-16 lg:pb-24 grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <h1 className="text-[44px] sm:text-[56px] lg:text-[68px] font-extrabold leading-[1.0] tracking-tight text-balance">
              Know where every naira goes.
            </h1>
            <p className="text-lg text-muted mt-5 max-w-xl">
              Log spending in seconds, stay inside your budgets, turn bank alerts into transactions,
              and keep an honest record of your trades. On your phone or your laptop.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/register" className="btn-primary px-6">Create an account</Link>
              <Link href="/login" className="btn-ghost px-6">I have an account</Link>
            </div>
          </div>

          {/* Product preview built from the app's own styles */}
          <div className="relative mx-auto w-full max-w-sm" aria-hidden>
            <div className="hero p-6">
              <p className="text-sm font-semibold text-hero-muted">Left to spend in October</p>
              <p className="figure text-[44px] leading-[1.05] mt-1">₦237,600</p>
              <p className="text-sm text-hero-muted mt-1">You&apos;ve spent 72% of what came in</p>
              <div className="flex flex-wrap gap-2 mt-5">
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-semibold">In ₦850,000</span>
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-semibold">Out ₦612,400</span>
              </div>
            </div>
            <div className="card divide-y divide-line overflow-hidden mt-4 lg:-mr-10 lg:ml-10">
              {SAMPLE.map((t) => (
                <div key={t.name} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${t.income ? "bg-income/10 text-income" : "bg-surface-2 text-muted"}`}>
                    <Icon name={t.icon} size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold truncate">{t.name}</span>
                    <span className="block text-xs text-muted truncate">{t.note}</span>
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${t.income ? "text-income" : ""}`}>{t.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface border-y border-line">
          <div className="max-w-6xl mx-auto px-5 py-16 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="flex flex-col gap-3">
                <span className="w-12 h-12 rounded-full bg-sun/25 text-ink flex items-center justify-center">
                  <Icon name={f.icon} size={24} />
                </span>
                <h2 className="text-xl font-bold">{f.title}</h2>
                <p className="text-muted leading-relaxed">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 py-16">
          <div className="hero p-8 lg:p-12 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl lg:text-4xl font-extrabold">Start with this month.</h2>
              <p className="text-hero-muted mt-2">Add a few expenses and one budget. You&apos;ll see where the money goes within a week.</p>
            </div>
            <Link href="/register" className="btn-sun px-6 self-start lg:self-auto lg:mr-24">Create an account</Link>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl w-full mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-3 text-sm text-muted border-t border-line">
        <Logo size={24} />
        <p>Amounts in naira. Trading P&L in USD.</p>
      </footer>
    </div>
  );
}
