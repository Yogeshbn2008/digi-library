import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getBookById } from "@/lib/books";
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
  const book = await getBookById(bookId);
  if (!book) notFound();

  return (
    <>
      {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
      <form action={updateBook} className="space-y-2">
        <input type="hidden" name="id" value={book.id} />
        <input name="title" defaultValue={book.title} required maxLength={255} className="w-full rounded border p-2" />
        <input name="author" defaultValue={book.author} required maxLength={255} className="w-full rounded border p-2" />
        <input name="genre" defaultValue={book.genre} required maxLength={100} className="w-full rounded border p-2" />
        <input name="isbn" defaultValue={book.isbn ?? ""} placeholder="ISBN (optional)" maxLength={20} className="w-full rounded border p-2" />
        <div className="flex gap-3">
          <button className="rounded bg-black px-4 py-2 text-white">Save changes</button>
          <Link href="/admin" className="px-4 py-2 underline">Cancel</Link>
        </div>
      </form>
    </>
  );
}