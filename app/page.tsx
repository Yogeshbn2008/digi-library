import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { searchBooks, getGenres } from "@/lib/books";
import { canViewCatalog, getCurrentStudent } from "@/lib/student-auth";
import { logoutStudent } from "./student-actions";
import Pager from "@/components/Pager";

type SearchParams = Promise<{ q?: string; genre?: string; page?: string }>;

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl" role="img" aria-label="books">📚</span>
            <h1 className="text-3xl font-bold tracking-tight">Hostel Library</h1>
          </div>
          <p className="text-muted text-sm">Search and browse our book collection</p>
        </div>
        <Suspense fallback={null}>
          <StudentNav />
        </Suspense>
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse-subtle">
                <div className="h-5 w-48 bg-muted-bg rounded" />
                <div className="h-4 w-32 bg-muted-bg rounded mt-3" />
              </div>
            ))}
          </div>
        }
      >
        <Catalog searchParams={searchParams} />
      </Suspense>

      {/* Admin link */}
      <div className="mt-10 pt-6 border-t border-border">
        <Link
          href="/admin/login"
          className="text-sm text-muted hover:text-primary transition-colors"
        >
          🔐 Admin login
        </Link>
      </div>
    </main>
  );
}

async function StudentNav() {
  const student = await getCurrentStudent();

  if (!student) {
    return (
      <div className="flex gap-2">
        <Link href="/login" className="btn-secondary text-sm py-2 px-4">
          Log in
        </Link>
        <Link href="/register" className="btn-primary text-sm py-2 px-4">
          Request access
        </Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="badge badge-primary">👋 {student.name}</span>
      <Link href="/my-books" className="btn-secondary text-sm py-2 px-4">
        My books
      </Link>
      <form action={logoutStudent}>
        <button className="btn-secondary text-sm py-2 px-4 text-danger hover:text-danger">
          Log out
        </button>
      </form>
    </div>
  );
}

async function Catalog({ searchParams }: { searchParams: SearchParams }) {
  if (!(await canViewCatalog())) redirect("/login");

  const { q, genre, page } = await searchParams;
  const [result, genres] = await Promise.all([
    searchBooks({ q, genre, page: Number(page) || 1 }),
    getGenres(),
  ]);
  const { books, total } = result;

  return (
    <div className="animate-fade-in-up">
      {/* Search bar */}
      <form className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search title, author or book code..."
            className="input pl-10"
          />
        </div>
        <select name="genre" defaultValue={genre ?? ""} className="input sm:w-48">
          <option value="">All categories</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <button className="btn-primary">Search</button>
      </form>

      {/* Results count */}
      <p className="mb-4 text-sm text-muted">
        📖 {total} book{total === 1 ? "" : "s"} found
        {q && <> for &quot;<strong className="text-foreground">{q}</strong>&quot;</>}
        {genre && <> in <strong className="text-foreground">{genre}</strong></>}
      </p>

      {/* Book list */}
      {books.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-muted font-medium">No books found</p>
          <p className="text-muted text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 stagger">
          {books.map((b) => (
            <div key={b.id} className="card card-interactive p-5 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base truncate">{b.title}</h3>
                  <p className="text-sm text-muted mt-1">
                    {b.author ?? "Author not listed"}
                  </p>
                </div>
                {b.status === "available" ? (
                  <span className="badge badge-success">✓ Available</span>
                ) : b.status === "borrowed" ? (
                  <span className="badge badge-danger">Borrowed</span>
                ) : (
                  <span className="badge badge-muted">Unavailable</span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                <span className="badge badge-muted">{b.genre}</span>
                <span>Code: {b.book_code ?? "N/A"}</span>
              </div>
              {b.status === "borrowed" && b.due_date && (
                <p className="mt-2 text-xs text-danger">
                  Due {new Date(b.due_date).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Pager
        basePath="/"
        params={{ q, genre }}
        page={result.page}
        pages={result.pages}
      />
    </div>
  );
}