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
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Edit book</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
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

  const label = "block text-sm text-gray-600";
  const box = "w-full rounded border p-2";

  return (
    <>
      {error && (
        <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>
      )}
      <form action={updateBook} className="space-y-2">
        <input type="hidden" name="id" value={book.id} />

        <label className={label}>Book code</label>
        <input name="book_code" defaultValue={book.book_code ?? ""} required maxLength={30} className={box} />

        <label className={label}>Title</label>
        <input name="title" defaultValue={book.title} required maxLength={255} className={box} />

        <label className={label}>Author (optional)</label>
        <input name="author" defaultValue={book.author ?? ""} maxLength={255} className={box} />

        <label className={label}>Category</label>
        <input name="genre" list="categories" defaultValue={book.genre} required maxLength={100} className={box} />
        <datalist id="categories">
          {genres.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>

        <label className={label}>ISBN (optional)</label>
        <input name="isbn" defaultValue={book.isbn ?? ""} maxLength={20} className={box} />

        <label className={label}>Remarks (optional)</label>
        <input name="remarks" defaultValue={book.remarks ?? ""} maxLength={255} className={box} />

        {book.status === "borrowed" ? (
          <p className="rounded bg-yellow-50 p-2 text-sm text-yellow-800">
            This book is currently borrowed. Return it from the dashboard before
            changing its status.
          </p>
        ) : (
          <>
            <label className={label}>Status</label>
            <select name="status" defaultValue={book.status} className={box}>
              <option value="available">Available</option>
              <option value="lost">Lost</option>
              <option value="unverified">Unverified (needs checking)</option>
            </select>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button className="rounded bg-black px-4 py-2 text-white">Save changes</button>
          <Link href="/admin" className="px-4 py-2 underline">Cancel</Link>
        </div>
      </form>
    </>
  );
}