import { Suspense } from "react";
import { login } from "../actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">Admin Login</h1>
      <Suspense>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
        {error && (
        <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">
          {error === "locked"
            ? "Too many failed attempts. Please wait 15 minutes and try again."
            : "Invalid username or password."}
        </p>
      )}
      <form action={login} className="space-y-3">
        <input
          name="username"
          placeholder="Username"
          required
          className="w-full rounded border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full rounded border p-2"
        />
        <button className="w-full rounded bg-black p-2 text-white">
          Log in
        </button>
      </form>
    </>
  );
}