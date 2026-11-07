import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { searchAudit } from "@/lib/audit";
import Pager from "@/components/Pager";

type SearchParams = Promise<{ q?: string; page?: string }>;

export default function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Audit log</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
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
    <>
      <form className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search admin, action, book code or details"
          className="flex-1 rounded border p-2"
        />
        <button className="rounded bg-black px-4 text-white">Search</button>
      </form>

      <p className="mb-3 text-sm text-gray-600">
        {result.total} entr{result.total === 1 ? "y" : "ies"} (newest first, Indian time)
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">When</th>
              <th className="p-2">Admin</th>
              <th className="p-2">Action</th>
              <th className="p-2">Target</th>
              <th className="p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {result.entries.map((e) => (
              <tr key={e.id} className="border-b align-top">
                <td className="p-2 whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="p-2">{e.admin_username}</td>
                <td className="p-2 font-mono text-xs">{e.action}</td>
                <td className="p-2">{e.target ?? "—"}</td>
                <td className="p-2">{e.details ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager basePath="/admin/audit" params={{ q }} page={result.page} pages={result.pages} />

      <Link href="/admin" className="mt-6 inline-block underline">Back to dashboard</Link>
    </>
  );
}