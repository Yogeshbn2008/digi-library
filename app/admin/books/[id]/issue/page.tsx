import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getBookById } from "@/lib/books";
import { todayIST, addDays } from "@/lib/dates";
import { issueBook } from "../../../loan-actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default function IssuePage({ params, searchParams }: Props) {
  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <Suspense fallback={<div className="animate-pulse-subtle"><div className="h-8 w-40 bg-muted-bg rounded mb-6" /><div className="card p-6"><div className="h-48 bg-muted-bg rounded" /></div></div>}>
        <IssueForm params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function IssueForm({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const bookId = Number(id);
  if (!Number.isInteger(bookId) || bookId <= 0) notFound();
  const book = await getBookById(bookId);
  if (!book) notFound();

  if (book.status !== "available") {
    return (
      <div className="animate-fade-in text-center py-12">
        <p className="text-4xl mb-4">🚫</p>
        <p className="text-lg font-medium mb-2">&ldquo;{book.title}&rdquo; is currently borrowed.</p>
        <Link href="/admin" className="btn-primary mt-4 inline-flex">Back to dashboard</Link>
      </div>
    );
  }

  const today = todayIST();

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
        📤 Issue book
      </h1>

      {/* Book info */}
      <div className="card p-4 mb-6 flex items-center gap-4">
        <span className="text-3xl">📕</span>
        <div>
          <p className="font-semibold">{book.title}</p>
          <p className="text-sm text-muted">{book.author ?? "Author not listed"}</p>
        </div>
        <span className="badge badge-success ml-auto">Available</span>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="card p-6">
        <form action={issueBook} className="space-y-4">
          <input type="hidden" name="bookId" value={book.id} />
          <div>
            <label className="block text-sm font-medium mb-1.5">Borrower name</label>
            <input name="borrowerName" placeholder="Full name of the borrower" required maxLength={100} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Registration number</label>
            <input name="registrationNo" placeholder="e.g. 2024CSE001" required maxLength={30} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Due date</label>
            <input
              type="date"
              name="dueDate"
              required
              min={today}
              max={addDays(today, 90)}
              defaultValue={addDays(today, 14)}
              className="input"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-primary">Issue book →</button>
            <Link href="/admin" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}