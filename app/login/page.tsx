import { Suspense } from "react";
import Link from "next/link";
import { loginStudent } from "../student-actions";

type SearchParams = Promise<{ error?: string; msg?: string }>;

const MESSAGES: Record<string, string> = {
  "1": "Invalid registration number or password.",
  locked: "Too many failed attempts. Please wait 15 minutes and try again.",
  pending: "Your request is still waiting for approval by the committee.",
  rejected: "Your request was not approved. Please contact the committee, then request access again.",
  blocked: "This account is blocked. Please contact the committee.",
};

export default function StudentLoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">Student login</h1>
      <Suspense>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginForm({ searchParams }: { searchParams: SearchParams }) {
  const { error, msg } = await searchParams;
  const box = "w-full rounded border p-2";

  return (
    <>
      {msg && <p className="mb-3 rounded bg-green-100 p-2 text-sm text-green-800">{msg}</p>}
      {error && (
        <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">
          {MESSAGES[error] ?? MESSAGES["1"]}
        </p>
      )}
      <form action={loginStudent} className="space-y-2">
        <input name="registration_no" placeholder="Registration number" required maxLength={30} autoComplete="username" className={box} />
        <input name="password" type="password" placeholder="Password" required autoComplete="current-password" className={box} />
        <button className="w-full rounded bg-black p-2 text-white">Log in</button>
      </form>
      <p className="mt-4 text-sm">
        New here? <Link href="/register" className="underline">Request access</Link>
      </p>
      <p className="mt-2 text-sm">
        <Link href="/" className="underline">Back to the library</Link>
      </p>
    </>
  );
}