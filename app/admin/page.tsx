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
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse-subtle">
            <div className="h-8 w-56 bg-muted-bg rounded" />
            <div className="grid grid-cols-4 gap-4 mt-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-6"><div className="h-16 bg-muted-bg rounded" /></div>
              ))}
            </div>
          </div>
        }
      >
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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span>🛡️</span> Admin Dashboard
          </h1>
          <p className="text-sm text-muted mt-1">Welcome, {admin.name}</p>
        </div>
        <form action={logout}>
          <button className="btn-secondary text-danger hover:text-danger">
            Log out
          </button>
        </form>
      </div>

      {/* Alerts */}
      {msg && <div className="alert alert-success mb-4 animate-slide-in">{msg}</div>}
      {error && <div className="alert alert-danger mb-4 animate-slide-in">{error}</div>}

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="card border-danger/40 bg-danger-bg/20 p-5 mb-6 animate-slide-in">
          <h2 className="text-base font-semibold text-danger flex items-center gap-2 mb-3">
            ⚠️ Overdue ({overdue.length})
          </h2>
          <div className="space-y-2">
            {overdue.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span>
                  <strong>{b.title}</strong>
                  <span className="text-muted"> — {b.borrower_name ?? "unknown borrower"}
                  {b.registration_no ? ` (${b.registration_no})` : ""}</span>
                </span>
                <span className="badge badge-danger">Due {fmt(b.due_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 stagger">
        <Link href="/admin/students" className="card card-interactive p-4 text-center animate-fade-in group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">👥</span>
          <span className="text-sm font-medium">Students</span>
          {pendingStudents > 0 && (
            <span className="badge badge-warning ml-1">{pendingStudents}</span>
          )}
        </Link>
        <Link href="/admin/loans" className="card card-interactive p-4 text-center animate-fade-in group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">📋</span>
          <span className="text-sm font-medium">Loan History</span>
        </Link>
        <Link href="/admin/reports" className="card card-interactive p-4 text-center animate-fade-in group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">📊</span>
          <span className="text-sm font-medium">Reports</span>
        </Link>
        <Link href="/admin/audit" className="card card-interactive p-4 text-center animate-fade-in group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">🔍</span>
          <span className="text-sm font-medium">Audit Log</span>
        </Link>
        <Link href="/admin/admins" className="card card-interactive p-4 text-center animate-fade-in group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">⚙️</span>
          <span className="text-sm font-medium">Admins</span>
        </Link>
        <Link href="/admin/import" className="card card-interactive p-4 text-center animate-fade-in group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">📥</span>
          <span className="text-sm font-medium">Import CSV</span>
        </Link>
        <a href="/admin/export/books" className="card card-interactive p-4 text-center animate-fade-in group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">📤</span>
          <span className="text-sm font-medium">Export Books</span>
        </a>
        <a href="/admin/export/loans" className="card card-interactive p-4 text-center animate-fade-in group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">📤</span>
          <span className="text-sm font-medium">Export Loans</span>
        </a>
      </div>

      {/* Add a book */}
      <section className="card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          ➕ Add a book
        </h2>
        <form action={addBook} className="grid gap-3 sm:grid-cols-2">
          <input name="book_code" placeholder="Book code (e.g. MBBS-120)" required maxLength={30} className="input" />
          <input name="title" placeholder="Title" required maxLength={255} className="input" />
          <input name="author" placeholder="Author (optional)" maxLength={255} className="input" />
          <input name="genre" list="categories" placeholder="Category" required maxLength={100} className="input" />
          <datalist id="categories">
            {genres.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          <input name="isbn" placeholder="ISBN (optional)" maxLength={20} className="input" />
          <button className="btn-primary sm:col-span-2">Add book</button>
        </form>
      </section>

      {/* All books */}
      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            📚 All books
            <span className="badge badge-muted">{result.total}</span>
          </h2>
        </div>

        <form className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search title, author, code, borrower or reg. no."
              className="input pl-10"
            />
          </div>
          <button className="btn-primary">Search</button>
        </form>

        <div className="table-wrapper">
          <table className="min-w-[720px]">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Borrower</th>
                <th>Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span className="font-medium">{b.title}</span>
                    <div className="text-xs text-muted mt-0.5">
                      {b.book_code ?? "no code"} · {b.author ?? "no author"}
                    </div>
                  </td>
                  <td><span className="badge badge-muted">{b.genre}</span></td>
                  <td>
                    {b.status === "available" ? (
                      <span className="badge badge-success">Available</span>
                    ) : b.status === "borrowed" ? (
                      <span className="badge badge-warning">Borrowed</span>
                    ) : (
                      <span className="badge badge-muted">{b.status}</span>
                    )}
                  </td>
                  <td className="text-sm">
                    {b.borrower_name
                      ? <><span className="font-medium">{b.borrower_name}</span> <span className="text-muted text-xs">({b.registration_no})</span></>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="text-sm text-muted">
                    {b.status === "borrowed" ? fmt(b.due_date) : "—"}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      {b.status === "available" && (
                        <Link href={`/admin/books/${b.id}/issue`} className="btn-primary text-xs py-1 px-3">
                          Issue
                        </Link>
                      )}
                      {b.status === "borrowed" && (
                        <form action={returnBook}>
                          <input type="hidden" name="bookId" value={b.id} />
                          <button className="btn-secondary text-xs py-1 px-3 text-warning hover:text-warning">Return</button>
                        </form>
                      )}
                      <Link href={`/admin/books/${b.id}/edit`} className="btn-secondary text-xs py-1 px-3">
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
      </section>
    </div>
  );
}