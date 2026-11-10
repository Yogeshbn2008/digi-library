import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  getSummary,
  getMostBorrowed,
  getLoansByCategory,
  getLoansPerMonth,
} from "@/lib/history";

export default function ReportsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
        📊 Reports
      </h1>
      <Suspense fallback={<div className="grid grid-cols-5 gap-4 animate-pulse-subtle">{[...Array(5)].map((_, i) => <div key={i} className="stat-card"><div className="h-16 bg-muted-bg rounded" /></div>)}</div>}>
        <ReportsContent />
      </Suspense>
    </main>
  );
}

async function ReportsContent() {
  await requireAdmin();
  const [summary, topBooks, byCategory, perMonth] = await Promise.all([
    getSummary(),
    getMostBorrowed(),
    getLoansByCategory(),
    getLoansPerMonth(),
  ]);

  const stats = [
    { icon: "📚", label: "Books in Library", value: summary.totalBooks },
    { icon: "📖", label: "Borrowed Now", value: summary.borrowed },
    { icon: "❌", label: "Lost", value: summary.lost },
    { icon: "❓", label: "Unverified", value: summary.unverified },
    { icon: "📋", label: "Total Loans", value: summary.totalLoans },
  ];

  return (
    <div className="animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10 stagger">
        {stats.map((s) => (
          <div key={s.label} className="stat-card animate-fade-in text-center">
            <p className="text-2xl mb-2">{s.icon}</p>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Most borrowed */}
      <section className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🏆 Most borrowed books
        </h2>
        {topBooks.length === 0 ? (
          <p className="text-sm text-muted">No loans yet.</p>
        ) : (
          <div className="space-y-2">
            {topBooks.map((b, i) => (
              <div key={b.book_code ?? b.title} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="text-lg font-bold text-muted w-8">#{i + 1}</span>
                <div className="flex-1">
                  <span className="font-medium">{b.title}</span>
                  <span className="text-xs text-muted ml-2">({b.book_code ?? "no code"})</span>
                </div>
                <span className="badge badge-primary">
                  {Number(b.times_borrowed)} time{Number(b.times_borrowed) === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* By category & per month side by side */}
      <div className="grid gap-6 sm:grid-cols-2 mb-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📁 Loans by category
          </h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted">No loans yet.</p>
          ) : (
            <div className="space-y-2">
              {byCategory.map((c) => (
                <div key={c.genre} className="flex items-center justify-between py-1.5">
                  <span className="text-sm">{c.genre}</span>
                  <span className="badge badge-muted font-bold">{Number(c.loans)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📅 Loans per month (last 6)
          </h2>
          {perMonth.length === 0 ? (
            <p className="text-sm text-muted">No loans in this period.</p>
          ) : (
            <div className="space-y-2">
              {perMonth.map((m) => (
                <div key={m.ym} className="flex items-center justify-between py-1.5">
                  <span className="text-sm font-mono">{m.ym}</span>
                  <span className="badge badge-primary font-bold">{Number(m.loans)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors">
        ← Back to dashboard
      </Link>
    </div>
  );
}