import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { searchAudit } from "@/lib/audit";
import Pager from "@/components/Pager";

type SearchParams = Promise<{ q?: string; page?: string }>;

export default function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
        🔍 Audit log
      </h1>
      <Suspense fallback={<div className="card p-12 text-center animate-pulse-subtle"><div className="h-6 w-32 bg-muted-bg rounded mx-auto" /></div>}>
        <AuditContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AuditContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { q, page } = await searchParams;
  const result = await searchAudit({ q, page: Number(page) || 1 });

  return (
    <div className="animate-fade-in">
      <form className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search admin, action, book code or details"
            className="input pl-10"
          />
        </div>
        <button className="btn-primary">Search</button>
      </form>

      <p className="mb-4 text-sm text-muted">
        {result.total} entr{result.total === 1 ? "y" : "ies"} (newest first, Indian time)
      </p>

      <div className="table-wrapper">
        <table className="min-w-[720px]">
          <thead>
            <tr>
              <th>When</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {result.entries.map((e) => (
              <tr key={e.id} className="align-top">
                <td className="whitespace-nowrap text-muted">
                  {new Date(e.created_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="font-medium">{e.admin_username}</td>
                <td>
                  <span className="badge badge-muted font-mono text-xs">{e.action}</span>
                </td>
                <td className="text-muted">{e.target ?? "—"}</td>
                <td className="text-muted text-sm max-w-xs truncate">{e.details ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager basePath="/admin/audit" params={{ q }} page={result.page} pages={result.pages} />

      <Link href="/admin" className="mt-6 inline-flex text-sm text-muted hover:text-primary transition-colors">
        ← Back to dashboard
      </Link>
    </div>
  );
}