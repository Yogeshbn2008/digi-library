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
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Issue book</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
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
      <>
        <p className="mb-3">“{book.title}” is currently borrowed.</p>
        <Link href="/admin" className="underline">Back to dashboard</Link>
      </>
    );
  }

  const today = todayIST();

  return (
    <>
      <p className="mb-4 text-gray-600">
        {book.title} · {book.author}
      </p>
      {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
      <form action={issueBook} className="space-y-2">
        <input type="hidden" name="bookId" value={book.id} />
        <input name="borrowerName" placeholder="Borrower name" required maxLength={100} className="w-full rounded border p-2" />
        <input name="registrationNo" placeholder="Registration number" required maxLength={30} className="w-full rounded border p-2" />
        <label className="block text-sm text-gray-600">Due date</label>
        <input
          type="date"
          name="dueDate"
          required
          min={today}
          max={addDays(today, 90)}
          defaultValue={addDays(today, 14)}
          className="w-full rounded border p-2"
        />
        <div className="flex gap-3 pt-2">
          <button className="rounded bg-black px-4 py-2 text-white">Issue book</button>
          <Link href="/admin" className="px-4 py-2 underline">Cancel</Link>
        </div>
      </form>
    </>
  );
}