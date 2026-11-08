import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { searchAdminBooks, getOverdue } from "@/lib/loans";
import { logout } from "./actions";
import { addBook, deleteBook } from "./book-actions";
import { returnBook } from "./loan-actions";
import { getGenres } from "@/lib/books";
import DeleteButton from "@/components/DeleteButton";
import Pager from "@/components/Pager";
import { countPendingStudents } from "@/lib/students";

type SearchParams = Promise<{
  msg?: string;
  error?: string;
  q?: string;
  page?: string;
}>;

const fmt = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "N/A";

export default function AdminHome({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Admin Dashboard</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <AdminContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AdminContent({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin();
  const { msg, error, q, page } = await searchParams;
      const [result, overdue, genres, pendingStudents] = await Promise.all([
    searchAdminBooks({ q, page: Number(page) || 1 }),
    getOverdue(),
    getGenres(),
    countPendingStudents(),
  ]);
  const books = result.books;

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

      {overdue.length > 0 && (
        <section className="mb-8 rounded border border-red-300 p-4">
          <h2 className="mb-2 text-lg font-semibold text-red-700">
            Overdue ({overdue.length})
          </h2>
          <ul className="space-y-1 text-sm">
            {overdue.map((b) => (
              <li key={b.id}>
                <strong>{b.title}</strong> — {b.borrower_name ?? "unknown borrower"}
                {b.registration_no ? ` (${b.registration_no})` : ""}, was due {fmt(b.due_date)}
              </li>
            ))}
          </ul>
        </section>
      )}

            <div className="mb-6 flex flex-wrap gap-4">
        <Link href="/admin/import" className="text-blue-600 underline">
          Import books from CSV
        </Link>
        <Link href="/admin/admins" className="text-blue-600 underline">
          Manage admins
        </Link>
         <Link href="/admin/loans" className="text-blue-600 underline">
          Loan history
        </Link>
        <Link href="/admin/audit" className="text-blue-600 underline">
          Audit log
        </Link>
        <Link href="/admin/reports" className="text-blue-600 underline">
          Reports
        </Link>
         <Link href="/admin/students" className="text-blue-600 underline">
          Student requests{pendingStudents > 0 ? ` (${pendingStudents} waiting)` : ""}
        </Link>
        <a href="/admin/export/books" className="text-blue-600 underline">
          Download books (CSV)
        </a>
        <a href="/admin/export/loans" className="text-blue-600 underline">
          Download loan history (CSV)
        </a>
      </div>

      <h2 className="mb-2 text-lg font-semibold">Add a book</h2>
            <form action={addBook} className="mb-8 grid gap-2 sm:grid-cols-2">
        <input name="book_code" placeholder="Book code (e.g. MBBS-120)" required maxLength={30} className="rounded border p-2" />
        <input name="title" placeholder="Title" required maxLength={255} className="rounded border p-2" />
        <input name="author" placeholder="Author (optional)" maxLength={255} className="rounded border p-2" />
        <input name="genre" list="categories" placeholder="Category" required maxLength={100} className="rounded border p-2" />
        <datalist id="categories">
          {genres.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <input name="isbn" placeholder="ISBN (optional)" maxLength={20} className="rounded border p-2" />
        <button className="rounded bg-black p-2 text-white sm:col-span-2">Add book</button>
      </form>

      <h2 className="mb-2 text-lg font-semibold">All books ({result.total})</h2>
            <form className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title, author, code, borrower or registration no."
          className="flex-1 rounded border p-2"
        />
        <button className="rounded bg-black px-4 text-white">Search</button>
      </form>

      <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Title</th>
              <th className="p-2">Category</th>
              <th className="p-2">Status</th>
              <th className="p-2">Borrower</th>
              <th className="p-2">Due</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="p-2">
                  {b.title}
                  <div className="text-xs text-gray-500">
                    {b.book_code ?? "no code"} · {b.author ?? "no author"}
                  </div>
                </td>
                <td className="p-2">{b.genre}</td>
                <td className="p-2">{b.status}</td>
                <td className="p-2">
                  {b.borrower_name
                    ? `${b.borrower_name} (${b.registration_no})`
                    : "—"}
                </td>
                <td className="p-2">{b.status === "borrowed" ? fmt(b.due_date) : "—"}</td>
                <td className="p-2">
                  <div className="flex flex-wrap items-center gap-3">
                    {b.status === "available" && (
                      <Link href={`/admin/books/${b.id}/issue`} className="text-green-700 underline">
                        Issue
                      </Link>
                    )}
                    {b.status === "borrowed" && (
                      <form action={returnBook}>
                        <input type="hidden" name="bookId" value={b.id} />
                        <button className="text-orange-600 underline">Return</button>
                      </form>
                    )}
                    <Link href={`/admin/books/${b.id}/edit`} className="text-blue-600 underline">
                      Edit
                    </Link>
                    <form action={deleteBook}>
                      <input type="hidden" name="id" value={b.id} />
                      <DeleteButton />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager basePath="/admin" params={{ q }} page={result.page} pages={result.pages} />
    </>
  );
}