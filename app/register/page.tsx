import { Suspense } from "react";
import Link from "next/link";
import { registerStudent } from "../student-actions";

type SearchParams = Promise<{ error?: string }>;

export default function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-1 text-2xl font-bold">Request access</h1>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Send your details to the library committee. You can log in after they approve you.
      </p>
      <Suspense>
        <RegisterForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function RegisterForm({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  const needsCode = Boolean(process.env.JOIN_CODE);

  const field = "w-full rounded border border-gray-300 p-2.5 dark:border-gray-700 dark:bg-gray-900";
  const label = "mb-1 block text-sm text-gray-600 dark:text-gray-400";

  return (
    <>
      {error && (
        <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-100">{error}</p>
      )}
      <form action={registerStudent} className="space-y-3">
        {needsCode && (
          <div>
            <label htmlFor="join_code" className={label}>Hostel code (ask the committee)</label>
            <input id="join_code" name="join_code" required maxLength={64} autoComplete="off" className={field} />
          </div>
        )}
        <div>
          <label htmlFor="registration_no" className={label}>Registration number</label>
          <input id="registration_no" name="registration_no" required maxLength={30} autoComplete="username" className={field} />
        </div>
        <div>
          <label htmlFor="name" className={label}>Full name</label>
          <input id="name" name="name" required maxLength={100} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="room_no" className={label}>Room number (for example B-214)</label>
          <input id="room_no" name="room_no" required maxLength={10} autoComplete="off" className={field} />
        </div>
        <div>
          <label htmlFor="password" className={label}>Password (8 or more characters)</label>
          <input id="password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={field} />
        </div>
        <div>
          <label htmlFor="confirm" className={label}>Repeat password</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={field} />
        </div>
        <button className="w-full rounded-md bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500">
          Send request
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already approved? <Link href="/login" className="text-indigo-600 underline dark:text-indigo-400">Log in</Link>
      </p>
    </>
  );
}