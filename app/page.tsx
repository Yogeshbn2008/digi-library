import { getBooks, getGenres } from "@/lib/books";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; genre?: string }>;
}) {
  const { q, genre } = await searchParams;
  const [books, genres] = await Promise.all([
    getBooks({ q, genre }),
    getGenres(),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Hostel Library</h1>

      <form className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search title or author"
          className="flex-1 rounded border p-2"
        />
        <select
          name="genre"
          defaultValue={genre ?? ""}
          className="rounded border p-2"
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button className="rounded bg-black px-4 text-white">Search</button>
      </form>

      <ul className="space-y-3">
        {books.map((b) => (
          <li key={b.id} className="rounded border p-4">
            <div className="font-semibold">{b.title}</div>
            <div className="text-sm text-gray-600">
              {b.author} · {b.genre}
            </div>
            <div className="mt-1 text-sm">
              {b.status === "available" ? (
                <span className="text-green-600">Available</span>
              ) : (
                <span className="text-red-600">
                  Borrowed · due{" "}
                  {b.due_date
                    ? new Date(b.due_date).toLocaleDateString("en-IN")
                    : "N/A"}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}