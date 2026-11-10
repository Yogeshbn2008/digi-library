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
    <main className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Branding */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">📚</span>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Sign in to your student account</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <Suspense>
            <LoginForm searchParams={searchParams} />
          </Suspense>
        </div>

        {/* Footer links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted">
            New here?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Request access
            </Link>
          </p>
          <p className="text-sm">
            <Link href="/" className="text-muted hover:text-foreground transition-colors">
              ← Back to the library
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

async function LoginForm({ searchParams }: { searchParams: SearchParams }) {
  const { error, msg } = await searchParams;

  return (
    <>
      {msg && <div className="alert alert-success mb-4">{msg}</div>}
      {error && (
        <div className="alert alert-danger mb-4">
          {MESSAGES[error] ?? MESSAGES["1"]}
        </div>
      )}
      <form action={loginStudent} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Registration Number</label>
          <input
            name="registration_no"
            placeholder="e.g. 2024CSE001"
            required
            maxLength={30}
            autoComplete="username"
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
            autoComplete="current-password"
            className="input"
          />
        </div>
        <button className="btn-primary w-full">Log in →</button>
      </form>
    </>
  );
}