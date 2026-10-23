import { Suspense } from "react";
import Link from "next/link";
import { getCurrentAdmin, requireAdmin } from "@/lib/auth";
import { getBooks } from "@/lib/books";
import { logout } from "./actions";
import { addBook, deleteBook } from "./book-actions";
import DeleteButton from "@/components/DeleteButton";

type SearchParams = Promise<{ msg?: string; error?: string }>;

export default function AdminHome({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Admin Dashboard</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <AdminContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AdminContent({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const { msg, error } = await searchParams;
  const books = await getBooks({});

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p>Logged in as {admin.name}</p>
        <form action={logout}>
          <button className="rounded bg-black px-4 py-2 text-white">Log out</button>
        </form>
      </div>

      {msg && <p className="mb-3 rounded bg-green-100 p-2 text-sm text-green-800">{msg}</p>}
      {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}

      <h2 className="mb-2 mt-6 text-lg font-semibold">Add a book</h2>
      <form action={addBook} className="mb-8 grid gap-2 sm:grid-cols-2">
        <input name="title" placeholder="Title" required maxLength={255} className="rounded border p-2" />
        <input name="author" placeholder="Author" required maxLength={255} className="rounded border p-2" />
        <input name="genre" placeholder="Genre" required maxLength={100} className="rounded border p-2" />
        <input name="isbn" placeholder="ISBN (optional)" maxLength={20} className="rounded border p-2" />
        <button className="rounded bg-black p-2 text-white sm:col-span-2">Add book</button>
      </form>

      <h2 className="mb-2 text-lg font-semibold">All books ({books.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Title</th>
              <th className="p-2">Author</th>
              <th className="p-2">Genre</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="p-2">{b.title}</td>
                <td className="p-2">{b.author}</td>
                <td className="p-2">{b.genre}</td>
                <td className="p-2">{b.status}</td>
                <td className="flex gap-3 p-2">
                  <Link href={`/admin/books/${b.id}/edit`} className="text-blue-600 underline">
                    Edit
                  </Link>
                  <form action={deleteBook}>
                    <input type="hidden" name="id" value={b.id} />
                    <DeleteButton />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}