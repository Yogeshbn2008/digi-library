import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { importBooks } from "../import-actions";

type SearchParams = Promise<{ msg?: string; error?: string }>;

export default function ImportPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
        📥 Import books (CSV)
      </h1>
      <Suspense fallback={<div className="card p-12 text-center animate-pulse-subtle"><div className="h-6 w-32 bg-muted-bg rounded mx-auto" /></div>}>
        <ImportForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ImportForm({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { msg, error } = await searchParams;

  return (
    <div className="animate-fade-in">
      {msg && <div className="alert alert-success mb-4 animate-slide-in">{msg}</div>}
      {error && <div className="alert alert-danger mb-4 animate-slide-in">{error}</div>}

      {/* Instructions */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-2">📄 CSV Format</h3>
        <p className="text-sm text-muted mb-2">
          Columns: <code className="bg-muted-bg px-1.5 py-0.5 rounded text-xs font-mono">book_code, title, author, category, price, donated, status, remarks</code>
        </p>
        <p className="text-sm text-muted">
          Required: <strong>book_code</strong>, <strong>title</strong>, <strong>category</strong>. 
          Save the file as CSV UTF-8. Books whose code already exists are skipped.
        </p>
      </div>

      {/* Upload */}
      <div className="card p-6">
        <form action={importBooks} className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors">
            <p className="text-3xl mb-3">📂</p>
            <p className="text-sm font-medium mb-1">Choose a CSV file</p>
            <p className="text-xs text-muted mb-4">or drag and drop it here</p>
            <input
              type="file"
              name="file"
              accept=".csv"
              required
              className="input max-w-xs mx-auto text-sm"
            />
          </div>
          <button className="btn-primary w-full">Import →</button>
        </form>
      </div>

      <Link href="/admin" className="mt-6 inline-flex text-sm text-muted hover:text-primary transition-colors">
        ← Back to dashboard
      </Link>
    </div>
  );
}