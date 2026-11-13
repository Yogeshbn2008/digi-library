import { Suspense } from "react";
import Link from "next/link";
import { requireStudent, getStudentLoans } from "@/lib/student-auth";
import { logoutStudent, changeStudentPassword, updateRoom } from "../student-actions";

type SearchParams = Promise<{ msg?: string; error?: string }>;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

export default function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <ProfileContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ProfileContent({ searchParams }: { searchParams: SearchParams }) {
  const student = await requireStudent();
  const { msg, error } = await searchParams;
  const loans = await getStudentLoans(student.registration_no);
  const borrowedNow = loans.filter((l) => !l.return_date).length;

  const card = "rounded-lg border border-gray-300 p-4 dark:border-gray-700";
  const field = "w-full rounded border border-gray-300 p-2.5 dark:border-gray-700 dark:bg-gray-900";
  const primary = "rounded-md bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-500";
  const row = "flex items-center justify-between gap-3 border-b border-gray-200 py-2 text-sm dark:border-gray-800";

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
          {initials(student.name)}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <span className="mt-1 inline-block rounded-full bg-green-100 px-3 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-100">
            Approved
          </span>
        </div>
      </div>

      {msg && <p className="mb-4 rounded bg-green-100 p-2 text-sm text-green-800 dark:bg-green-900 dark:text-green-100">{msg}</p>}
      {error && <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-100">{error}</p>}
      {!student.room_no && (
        <p className="mb-4 rounded bg-amber-100 p-2 text-sm text-amber-900 dark:bg-amber-900 dark:text-amber-100">
          Please add your room number below so the committee can reach you.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className={card}>
          <h2 className="mb-2 font-semibold">Your details</h2>
          <div className={row}>
            <span className="text-gray-600 dark:text-gray-400">Registration no.</span>
            <span>{student.registration_no}</span>
          </div>
          <div className={row}>
            <span className="text-gray-600 dark:text-gray-400">Books borrowed now</span>
            <Link href="/my-books" className="underline">{borrowedNow}</Link>
          </div>
          <form action={updateRoom} className="mt-3">
            <label htmlFor="room_no" className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Room number</label>
            <div className="flex gap-2">
              <input id="room_no" name="room_no" defaultValue={student.room_no ?? ""} required maxLength={10} autoComplete="off" className={field} />
              <button className="rounded-md border border-gray-400 px-4 hover:bg-gray-100 dark:hover:bg-gray-800">Save</button>
            </div>
          </form>
          <p className="mt-3 text-xs text-gray-500">
            Your name and registration number can only be changed by the committee.
          </p>
        </section>

        <section className={card}>
          <h2 className="mb-2 font-semibold">Change password</h2>
          <form action={changeStudentPassword} className="space-y-3">
            <div>
              <label htmlFor="current" className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Current password</label>
              <input id="current" name="current" type="password" required autoComplete="current-password" className={field} />
            </div>
            <div>
              <label htmlFor="next" className="mb-1 block text-sm text-gray-600 dark:text-gray-400">New password (8 or more characters)</label>
              <input id="next" name="next" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={field} />
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1 block text-sm text-gray-600 dark:text-gray-400">Repeat new password</label>
              <input id="confirm" name="confirm" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={field} />
            </div>
            <button className={primary}>Update password</button>
          </form>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <form action={logoutStudent}>
          <button className="rounded-md border border-gray-400 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800">Log out</button>
        </form>
        <Link href="/my-books" className="underline">My books</Link>
        <Link href="/" className="underline">Back to the library</Link>
      </div>
    </>
  );
}