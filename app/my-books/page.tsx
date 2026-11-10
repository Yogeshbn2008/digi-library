import { Suspense } from "react";
import Link from "next/link";
import { requireStudent, getStudentLoans } from "@/lib/student-auth";
import { logoutStudent } from "../student-actions";
import { todayIST, dateToIso } from "@/lib/dates";

const fmt = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "—";

export default function MyBooksPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse-subtle">
            <div className="h-8 w-48 bg-muted-bg rounded" />
            <div className="h-4 w-32 bg-muted-bg rounded" />
            <div className="card p-6 mt-6"><div className="h-20 bg-muted-bg rounded" /></div>
          </div>
        }
      >
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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span>📖</span> My books
          </h1>
          <p className="text-sm text-muted mt-1">
            {student.name} · {student.registration_no}
          </p>
        </div>
        <form action={logoutStudent}>
          <button className="btn-secondary text-danger hover:text-danger">
            Log out
          </button>
        </form>
      </div>

      {/* Current loans */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📗</span> Borrowed now
          {current.length > 0 && (
            <span className="badge badge-primary">{current.length}</span>
          )}
        </h2>
        {current.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-muted font-medium">No books borrowed</p>
            <p className="text-muted text-sm mt-1">
              Visit the library to borrow a book
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 stagger">
            {current.map((l) => {
              const overdue = dateToIso(new Date(l.due_date)) < today;
              return (
                <div
                  key={l.id}
                  className={`card p-4 animate-fade-in ${
                    overdue ? "border-danger/40 bg-danger-bg/30" : ""
                  }`}
                >
                  <h3 className="font-semibold">{l.title}</h3>
                  <p className="text-xs text-muted mt-0.5">
                    {l.book_code ?? "No code"}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted">Due {fmt(l.due_date)}</span>
                    {overdue ? (
                      <span className="badge badge-danger">⚠ Overdue</span>
                    ) : (
                      <span className="badge badge-success">On time</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* History */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>📜</span> History
        </h2>
        {past.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted text-sm">No returned books yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrowed</th>
                  <th>Returned</th>
                </tr>
              </thead>
              <tbody>
                {past.map((l) => (
                  <tr key={l.id}>
                    <td className="font-medium">{l.title}</td>
                    <td className="text-muted">{fmt(l.issue_date)}</td>
                    <td>
                      <span className="badge badge-success">{fmt(l.return_date)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Link
        href="/"
        className="text-sm text-muted hover:text-primary transition-colors"
      >
        ← Back to the library
      </Link>
    </div>
  );
}