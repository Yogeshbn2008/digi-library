import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { importBooks } from "../import-actions";

type SearchParams = Promise<{ msg?: string; error?: string }>;

export default function ImportPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Import books (CSV)</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <ImportForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ImportForm({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { msg, error } = await searchParams;

  return (
    <>
      {msg && <p className="mb-3 rounded bg-green-100 p-2 text-sm text-green-800">{msg}</p>}
      {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}

      <p className="mb-3 text-sm text-gray-600">
        Columns: <code>book_code, title, author, category, price, donated, status, remarks</code>.
        Required: book_code, title, category. Save the file as CSV UTF-8.
        Books whose code already exists are skipped.
      </p>

      <form action={importBooks} className="space-y-3">
        <input type="file" name="file" accept=".csv" required className="w-full rounded border p-2" />
        <button className="rounded bg-black px-4 py-2 text-white">Import</button>
      </form>

      <Link href="/admin" className="mt-6 inline-block underline">Back to dashboard</Link>
    </>
  );
}