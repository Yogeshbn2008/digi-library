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
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Reports</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
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
    ["Books in library", summary.totalBooks],
    ["Borrowed now", summary.borrowed],
    ["Lost", summary.lost],
    ["Unverified", summary.unverified],
    ["Loans ever made", summary.totalLoans],
  ] as const;

  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded border p-3">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-gray-600">{label}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-semibold">Most borrowed books</h2>
      {topBooks.length === 0 ? (
        <p className="mb-8 text-sm text-gray-500">No loans yet.</p>
      ) : (
        <ol className="mb-8 list-decimal space-y-1 pl-5 text-sm">
          {topBooks.map((b) => (
            <li key={b.book_code ?? b.title}>
              {b.title} <span className="text-gray-500">({b.book_code ?? "no code"})</span>{" "}
              - {Number(b.times_borrowed)} time{Number(b.times_borrowed) === 1 ? "" : "s"}
            </li>
          ))}
        </ol>
      )}

      <h2 className="mb-2 text-lg font-semibold">Loans by category</h2>
      {byCategory.length === 0 ? (
        <p className="mb-8 text-sm text-gray-500">No loans yet.</p>
      ) : (
        <ul className="mb-8 space-y-1 text-sm">
          {byCategory.map((c) => (
            <li key={c.genre}>
              {c.genre}: <strong>{Number(c.loans)}</strong>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-2 text-lg font-semibold">Loans per month (last 6 months)</h2>
      {perMonth.length === 0 ? (
        <p className="mb-8 text-sm text-gray-500">No loans in this period.</p>
      ) : (
        <ul className="mb-8 space-y-1 text-sm">
          {perMonth.map((m) => (
            <li key={m.ym}>
              {m.ym}: <strong>{Number(m.loans)}</strong>
            </li>
          ))}
        </ul>
      )}

      <Link href="/admin" className="underline">Back to dashboard</Link>
    </>
  );
}