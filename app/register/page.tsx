import { Suspense } from "react";
import Link from "next/link";
import { registerStudent } from "../student-actions";

type SearchParams = Promise<{ error?: string }>;

export default function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-2 text-2xl font-bold">Request access</h1>
      <p className="mb-4 text-sm text-gray-600">
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
  const box = "w-full rounded border p-2";
    const needsCode = Boolean(process.env.JOIN_CODE);

  return (
    <>
      {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
      <form action={registerStudent} className="space-y-2">
        {needsCode && (
          <input name="join_code" placeholder="Hostel code (ask the committee)" required maxLength={64} autoComplete="off" className={box} />
        )}
        <input name="registration_no" placeholder="Registration number" required maxLength={30} autoComplete="username" className={box} />
        <input name="name" placeholder="Full name" required maxLength={100} autoComplete="name" className={box} />
        <input name="password" type="password" placeholder="Password (8 or more characters)" required minLength={8} maxLength={72} autoComplete="new-password" className={box} />
        <input name="confirm" type="password" placeholder="Repeat password" required minLength={8} maxLength={72} autoComplete="new-password" className={box} />
        <button className="w-full rounded bg-black p-2 text-white">Send request</button>
      </form>
      <p className="mt-4 text-sm">
        Already approved? <Link href="/login" className="underline">Log in</Link>
      </p>
    </>
  );
}