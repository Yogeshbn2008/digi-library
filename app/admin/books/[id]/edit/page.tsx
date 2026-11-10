import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getBookById, getGenres } from "@/lib/books";
import { updateBook } from "../../../book-actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default function EditBookPage({ params, searchParams }: Props) {
  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <Suspense fallback={<div className="animate-pulse-subtle"><div className="h-8 w-40 bg-muted-bg rounded mb-6" /><div className="card p-6"><div className="h-64 bg-muted-bg rounded" /></div></div>}>
        <EditForm params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function EditForm({ params, searchParams }: Props) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const bookId = Number(id);
  if (!Number.isInteger(bookId) || bookId <= 0) notFound();
  const [book, genres] = await Promise.all([getBookById(bookId), getGenres()]);
  if (!book) notFound();

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
        ✏️ Edit book
      </h1>
      <p className="text-sm text-muted mb-6">Update the details for &quot;{book.title}&quot;</p>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div className="card p-6">
        <form action={updateBook} className="space-y-4">
          <input type="hidden" name="id" value={book.id} />

          <div>
            <label className="block text-sm font-medium mb-1.5">Book code</label>
            <input name="book_code" defaultValue={book.book_code ?? ""} required maxLength={30} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input name="title" defaultValue={book.title} required maxLength={255} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Author (optional)</label>
            <input name="author" defaultValue={book.author ?? ""} maxLength={255} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Category</label>
            <input name="genre" list="categories" defaultValue={book.genre} required maxLength={100} className="input" />
            <datalist id="categories">
              {genres.map((g) => <option key={g} value={g} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">ISBN (optional)</label>
            <input name="isbn" defaultValue={book.isbn ?? ""} maxLength={20} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Remarks (optional)</label>
            <input name="remarks" defaultValue={book.remarks ?? ""} maxLength={255} className="input" />
          </div>

          {book.status === "borrowed" ? (
            <div className="alert alert-warning">
              This book is currently borrowed. Return it from the dashboard before changing its status.
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5">Status</label>
              <select name="status" defaultValue={book.status} className="input">
                <option value="available">Available</option>
                <option value="lost">Lost</option>
                <option value="unverified">Unverified (needs checking)</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button className="btn-primary">Save changes</button>
            <Link href="/admin" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}