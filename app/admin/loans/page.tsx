import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { searchLoans, LOAN_FILTERS, LoanFilter } from "@/lib/history";
import { todayIST, dateToIso } from "@/lib/dates";
import Pager from "@/components/Pager";

type SearchParams = Promise<{ q?: string; filter?: string; page?: string }>;

const fmt = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "—";

export default function LoansPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
        📋 Loan history
      </h1>
      <Suspense fallback={<div className="card p-12 text-center animate-pulse-subtle"><div className="h-6 w-32 bg-muted-bg rounded mx-auto" /></div>}>
        <LoansContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoansContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { q, filter, page } = await searchParams;

  const safeFilter: LoanFilter = (LOAN_FILTERS as readonly string[]).includes(filter ?? "")
    ? (filter as LoanFilter)
    : "all";

  const result = await searchLoans({ q, filter: safeFilter, page: Number(page) || 1 });
  const today = todayIST();

  return (
    <div className="animate-fade-in">
      <form className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search borrower, reg. no., book title or code"
            className="input pl-10"
          />
        </div>
        <select name="filter" defaultValue={safeFilter} className="input sm:w-44">
          <option value="all">All loans</option>
          <option value="open">Not returned</option>
          <option value="overdue">Overdue</option>
          <option value="returned">Returned</option>
        </select>
        <button className="btn-primary">Search</button>
      </form>

      <p className="mb-4 text-sm text-muted">
        {result.total} loan{result.total === 1 ? "" : "s"} found
      </p>

      <div className="table-wrapper">
        <table className="min-w-[760px]">
          <thead>
            <tr>
              <th>Book</th>
              <th>Borrower</th>
              <th>Issued</th>
              <th>Due</th>
              <th>Returned</th>
              <th>Issued by</th>
            </tr>
          </thead>
          <tbody>
            {result.loans.map((l) => {
              const overdue = !l.return_date && dateToIso(new Date(l.due_date)) < today;
              return (
                <tr key={l.id}>
                  <td>
                    <span className="font-medium">{l.title}</span>
                    <div className="text-xs text-muted">{l.book_code ?? "no code"}</div>
                  </td>
                  <td>
                    <span className="font-medium">{l.borrower_name}</span>
                    <div className="text-xs text-muted">{l.registration_no}</div>
                  </td>
                  <td className="text-muted">{fmt(l.issue_date)}</td>
                  <td className="text-muted">{fmt(l.due_date)}</td>
                  <td>
                    {l.return_date ? (
                      <span className="badge badge-success">{fmt(l.return_date)}</span>
                    ) : overdue ? (
                      <span className="badge badge-danger">⚠ Overdue</span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </td>
                  <td className="text-muted">{l.issued_by ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pager
        basePath="/admin/loans"
        params={{ q, filter: safeFilter === "all" ? undefined : safeFilter }}
        page={result.page}
        pages={result.pages}
      />

      <Link href="/admin" className="mt-6 inline-flex text-sm text-muted hover:text-primary transition-colors">
        ← Back to dashboard
      </Link>
    </div>
  );
}