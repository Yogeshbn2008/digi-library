import { Suspense } from "react";
import Link from "next/link";
import { registerStudent } from "../student-actions";

type SearchParams = Promise<{ error?: string }>;

export default function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Branding */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">✋</span>
          <h1 className="text-2xl font-bold tracking-tight">Request access</h1>
          <p className="text-muted text-sm mt-2 max-w-xs mx-auto">
            Send your details to the library committee. You can log in after they approve you.
          </p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <Suspense>
            <RegisterForm searchParams={searchParams} />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Already approved?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

async function RegisterForm({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  const needsCode = Boolean(process.env.JOIN_CODE);

  return (
    <>
      {error && <div className="alert alert-danger mb-4">{error}</div>}
      <form action={registerStudent} className="space-y-4">
        {needsCode && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Hostel Code</label>
            <input
              name="join_code"
              placeholder="Ask the committee for the code"
              required
              maxLength={64}
              autoComplete="off"
              className="input"
            />
          </div>
        )}
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
          <label className="block text-sm font-medium mb-1.5">Full Name</label>
          <input
            name="name"
            placeholder="Your full name"
            required
            maxLength={100}
            autoComplete="name"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
          <input
            name="password"
            type="password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Repeat Password</label>
          <input
            name="confirm"
            type="password"
            placeholder="Type your password again"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className="input"
          />
        </div>
        <button className="btn-primary w-full">Send request →</button>
      </form>
    </>
  );
}