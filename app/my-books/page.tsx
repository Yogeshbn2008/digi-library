import { Suspense } from "react";
import Link from "next/link";
import { requireStudent, getStudentLoans } from "@/lib/student-auth";
import { todayIST, dateToIso } from "@/lib/dates";

const fmt = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "—";

export default function MyBooksPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <MyBooksContent />
      </Suspense>
    </main>
  );
}

async function MyBooksContent() {
  const student = await requireStudent();
  const loans = await getStudentLoans(student.registration_no);
  const today = todayIST();
  const current = loans.filter((l) => !l.return_date);
  const past = loans.filter((l) => l.return_date);

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My books</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {student.name} ({student.registration_no})
          </p>
        </div>
        <Link href="/profile" className="rounded-md border border-gray-400 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
          My profile
        </Link>
      </div>

      <h2 className="mb-2 text-lg font-semibold">Borrowed now</h2>
      {current.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">You have no books at the moment.</p>
      ) : (
        <ul className="mb-6 space-y-2">
          {current.map((l) => {
            const overdue = dateToIso(new Date(l.due_date)) < today;
            return (
              <li key={l.id} className="rounded-lg border border-gray-300 p-3 dark:border-gray-700">
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

      <Link href="/" className="underline">Back to the library</Link>
    </>
  );
}