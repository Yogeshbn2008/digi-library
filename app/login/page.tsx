import { Suspense } from "react";
import Link from "next/link";
import { loginStudent } from "../student-actions";
import { login as loginAdmin } from "../admin/actions";

type SearchParams = Promise<{ as?: string; error?: string; msg?: string }>;

const STUDENT_MESSAGES: Record<string, string> = {
  "1": "Invalid registration number or password.",
  locked: "Too many failed attempts. Please wait 15 minutes and try again.",
  pending: "Your request is still waiting for approval by the committee.",
  rejected: "Your request was not approved. Please contact the committee, then request access again.",
  blocked: "This account is blocked. Please contact the committee.",
};

const ADMIN_MESSAGES: Record<string, string> = {
  "1": "Invalid username or password.",
  locked: "Too many failed attempts. Please wait 15 minutes and try again.",
};

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-sm p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Hostel Library</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Log in to search books and see your loans
        </p>
      </div>
      <Suspense>
        <LoginPanel searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginPanel({ searchParams }: { searchParams: SearchParams }) {
  const { as, error, msg } = await searchParams;
  const committee = as === "committee";

  const tab = "flex-1 rounded-md py-2 text-center text-sm font-medium";
  const active = "bg-indigo-600 text-white";
  const idle = "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800";
  const field = "w-full rounded border border-gray-300 p-2.5 dark:border-gray-700 dark:bg-gray-900";
  const label = "mb-1 block text-sm text-gray-600 dark:text-gray-400";
  const button = "w-full rounded-md bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-500";

  const messages = committee ? ADMIN_MESSAGES : STUDENT_MESSAGES;

  return (
    <>
      <nav
        role="tablist"
        aria-label="Login type"
        className="mb-5 flex gap-1 rounded-lg border border-gray-300 p-1 dark:border-gray-700"
      >
        <Link role="tab" aria-selected={!committee} href="/login" className={`${tab} ${!committee ? active : idle}`}>
          Student
        </Link>
        <Link role="tab" aria-selected={committee} href="/login?as=committee" className={`${tab} ${committee ? active : idle}`}>
          Committee
        </Link>
      </nav>

      {!committee && msg && (
        <p className="mb-3 rounded bg-green-100 p-2 text-sm text-green-800 dark:bg-green-900 dark:text-green-100">{msg}</p>
      )}
      {error && (
        <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-100">
          {messages[error] ?? messages["1"]}
        </p>
      )}

      {committee ? (
        <>
          <form action={loginAdmin} className="space-y-3">
            <div>
              <label htmlFor="username" className={label}>Username</label>
              <input id="username" name="username" required autoComplete="username" className={field} />
            </div>
            <div>
              <label htmlFor="password" className={label}>Password</label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className={field} />
            </div>
            <button className={button}>Log in as committee</button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            For library committee members only.
          </p>
        </>
      ) : (
        <>
          <form action={loginStudent} className="space-y-3">
            <div>
              <label htmlFor="registration_no" className={label}>Registration number</label>
              <input id="registration_no" name="registration_no" required maxLength={30} autoComplete="username" className={field} />
            </div>
            <div>
              <label htmlFor="password" className={label}>Password</label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className={field} />
            </div>
            <button className={button}>Log in</button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            New student? <Link href="/register" className="text-indigo-600 underline dark:text-indigo-400">Request access</Link>
          </p>
        </>
      )}

      <p className="mt-3 text-center text-sm">
        <Link href="/" className="underline">Back to the library</Link>
      </p>
    </>
  );
}