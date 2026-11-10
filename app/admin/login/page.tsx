import { Suspense } from "react";
import { login } from "../actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Branding */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🛡️</span>
          <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
          <p className="text-muted text-sm mt-1">Library management portal</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <Suspense>
            <LoginForm searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
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
        <div className="alert alert-danger mb-4">
          {error === "locked"
            ? "Too many failed attempts. Please wait 15 minutes and try again."
            : "Invalid username or password."}
        </div>
      )}
      <form action={login} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Username</label>
          <input
            name="username"
            placeholder="Admin username"
            required
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            className="input"
          />
        </div>
        <button className="btn-primary w-full">Log in →</button>
      </form>
    </>
  );
}