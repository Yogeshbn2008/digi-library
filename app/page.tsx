import { Suspense } from "react";
import Link from "next/link";
import { searchBooks, getGenres } from "@/lib/books";
import Pager from "@/components/Pager";

type SearchParams = Promise<{ q?: string; genre?: string; page?: string }>;

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Hostel Library</h1>
      <Suspense fallback={<p className="text-gray-500">Loading books...</p>}>
        <Catalog searchParams={searchParams} />
      </Suspense>
      <Link
        href="/admin/login"
        className="mt-8 inline-block text-sm text-gray-500 underline"
      >
        Admin login
      </Link>
    </main>
  );
}

async function Catalog({ searchParams }: { searchParams: SearchParams }) {
  const { q, genre, page } = await searchParams;
  const [result, genres] = await Promise.all([
    searchBooks({ q, genre, page: Number(page) || 1 }),
    getGenres(),
  ]);
  const { books, total } = result;

  return (
    <>
            <form className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title, author or book code"
          className="flex-1 rounded border p-2"
        />
        <select
          name="genre"
          defaultValue={genre ?? ""}
          className="rounded border p-2"
        >
          <option value="">All categories</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button className="rounded bg-black px-4 text-white">Search</button>
      </form>

      <p className="mb-3 text-sm text-gray-600">
        {total} book{total === 1 ? "" : "s"} found
      </p>

      <ul className="space-y-3">
        {books.map((b) => (
          <li key={b.id} className="rounded border p-4">
            <div className="font-semibold">{b.title}</div>
            <div className="text-sm text-gray-600">
              {b.author ?? "Author not listed"} · {b.genre}
            </div>
            <div className="text-xs text-gray-500">
              Code: {b.book_code ?? "N/A"}
            </div>
            <div className="mt-1 text-sm">
              {b.status === "available" ? (
                <span className="text-green-600">Available</span>
              ) : b.status === "borrowed" ? (
                <span className="text-red-600">
                  Borrowed · due{" "}
                  {b.due_date
                    ? new Date(b.due_date).toLocaleDateString("en-IN")
                    : "N/A"}
                </span>
              ) : (
                <span className="text-gray-500">Not available</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Pager
        basePath="/"
        params={{ q, genre }}
        page={result.page}
        pages={result.pages}
      />
    </>
  );
}