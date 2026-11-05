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
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Loan history</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
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
    <>
      <form className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search borrower, registration no., book title or code"
          className="flex-1 rounded border p-2"
        />
        <select name="filter" defaultValue={safeFilter} className="rounded border p-2">
          <option value="all">All loans</option>
          <option value="open">Not returned</option>
          <option value="overdue">Overdue</option>
          <option value="returned">Returned</option>
        </select>
        <button className="rounded bg-black px-4 text-white">Search</button>
      </form>

      <p className="mb-3 text-sm text-gray-600">
        {result.total} loan{result.total === 1 ? "" : "s"} found
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Book</th>
              <th className="p-2">Borrower</th>
              <th className="p-2">Issued</th>
              <th className="p-2">Due</th>
              <th className="p-2">Returned</th>
              <th className="p-2">Issued by</th>
            </tr>
          </thead>
          <tbody>
            {result.loans.map((l) => {
              const overdue = !l.return_date && dateToIso(new Date(l.due_date)) < today;
              return (
                <tr key={l.id} className="border-b">
                  <td className="p-2">
                    {l.title}
                    <div className="text-xs text-gray-500">{l.book_code ?? "no code"}</div>
                  </td>
                  <td className="p-2">
                    {l.borrower_name}
                    <div className="text-xs text-gray-500">{l.registration_no}</div>
                  </td>
                  <td className="p-2">{fmt(l.issue_date)}</td>
                  <td className="p-2">{fmt(l.due_date)}</td>
                  <td className="p-2">
                    {l.return_date ? (
                      fmt(l.return_date)
                    ) : overdue ? (
                      <span className="font-semibold text-red-600">Overdue</span>
                    ) : (
                      <span className="text-orange-600">Not returned yet</span>
                    )}
                  </td>
                  <td className="p-2">{l.issued_by ?? "—"}</td>
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

      <Link href="/admin" className="mt-6 inline-block underline">Back to dashboard</Link>
    </>
  );
}