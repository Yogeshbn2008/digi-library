import { Suspense } from "react";
import Link from "next/link";
import { requireStudent, getStudentLoans } from "@/lib/student-auth";
import { logoutStudent, changeStudentPassword } from "../student-actions";
import { todayIST, dateToIso } from "@/lib/dates";

type SearchParams = Promise<{ msg?: string; error?: string }>;

const fmt = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "—";

export default function MyBooksPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <MyBooksContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function MyBooksContent({ searchParams }: { searchParams: SearchParams }) {
  const student = await requireStudent();
  const { msg, error } = await searchParams;
  const loans = await getStudentLoans(student.registration_no);
  const today = todayIST();
  const current = loans.filter((l) => !l.return_date);
  const past = loans.filter((l) => l.return_date);
  const box = "w-full rounded border p-2";

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My books</h1>
          <p className="text-sm text-gray-600">
            {student.name} ({student.registration_no})
          </p>
        </div>
        <form action={logoutStudent}>
          <button className="rounded bg-black px-4 py-2 text-white">Log out</button>
        </form>
      </div>

      {msg && <p className="mb-4 rounded bg-green-100 p-2 text-sm text-green-800">{msg}</p>}
      {error && <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}

      <h2 className="mb-2 text-lg font-semibold">Borrowed now</h2>
      {current.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">You have no books at the moment.</p>
      ) : (
        <ul className="mb-6 space-y-2">
          {current.map((l) => {
            const overdue = dateToIso(new Date(l.due_date)) < today;
            return (
              <li key={l.id} className="rounded border p-3">
                <div className="font-semibold">{l.title}</div>
                <div className="text-xs text-gray-500">{l.book_code ?? "no code"}</div>
                <div className="mt-1 text-sm">
                  Due {fmt(l.due_date)}{" "}
                  {overdue && <span className="font-semibold text-red-600">(overdue)</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mb-2 text-lg font-semibold">History</h2>
      {past.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">No returned books yet.</p>
      ) : (
        <ul className="mb-6 space-y-1 text-sm">
          {past.map((l) => (
            <li key={l.id}>
              {l.title}{" "}
              <span className="text-gray-500">
                - borrowed {fmt(l.issue_date)}, returned {fmt(l.return_date)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <details className="mb-6 rounded border p-3" open={Boolean(error)}>
        <summary className="cursor-pointer font-semibold">Change my password</summary>
        <form action={changeStudentPassword} className="mt-3 space-y-2">
          <input name="current" type="password" placeholder="Current password" required autoComplete="current-password" className={box} />
          <input name="next" type="password" placeholder="New password (8 or more characters)" required minLength={8} maxLength={72} autoComplete="new-password" className={box} />
          <input name="confirm" type="password" placeholder="Repeat new password" required minLength={8} maxLength={72} autoComplete="new-password" className={box} />
          <button className="rounded bg-black px-4 py-2 text-white">Change password</button>
        </form>
      </details>

      <Link href="/" className="underline">Back to the library</Link>
    </>
  );
}