import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdmins } from "@/lib/admins";
import { addAdmin, changeOwnPassword, setAdminActive } from "../admin-actions";

type SearchParams = Promise<{ msg?: string; error?: string }>;

export default function AdminsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
        ⚙️ Admin accounts
      </h1>
      <Suspense fallback={<div className="card p-12 text-center animate-pulse-subtle"><div className="h-6 w-32 bg-muted-bg rounded mx-auto" /></div>}>
        <AdminsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AdminsContent({ searchParams }: { searchParams: SearchParams }) {
  const me = await requireAdmin();
  const { msg, error } = await searchParams;
  const admins = await getAdmins();

  return (
    <div className="animate-fade-in">
      {msg && <div className="alert alert-success mb-4 animate-slide-in">{msg}</div>}
      {error && <div className="alert alert-danger mb-4 animate-slide-in">{error}</div>}

      {/* Admin list */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">All admins</h2>
        <div className="table-wrapper">
          <table className="min-w-[480px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.name}</td>
                  <td className="font-mono text-sm text-muted">{a.username}</td>
                  <td>
                    {a.is_active ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-muted">Deactivated</span>
                    )}
                  </td>
                  <td>
                    {a.id === me.id ? (
                      <span className="badge badge-primary">You</span>
                    ) : (
                      <form action={setAdminActive}>
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="active" value={a.is_active ? 0 : 1} />
                        <button className={a.is_active ? "btn-danger text-xs py-1 px-3" : "btn-primary text-xs py-1 px-3"}>
                          {a.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Change password */}
      <section className="card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🔒 Change my password</h2>
        <form action={changeOwnPassword} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium mb-1.5">Current password</label>
            <input name="current" type="password" placeholder="Enter current password" required autoComplete="current-password" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">New password</label>
            <input name="next" type="password" placeholder="At least 10 characters" required minLength={10} maxLength={72} autoComplete="new-password" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Repeat new password</label>
            <input name="confirm" type="password" placeholder="Type it again" required minLength={10} maxLength={72} autoComplete="new-password" className="input" />
          </div>
          <button className="btn-primary">Change password</button>
        </form>
      </section>

      {/* Add admin */}
      <section className="card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">➕ Add an admin</h2>
        <p className="text-sm text-muted mb-4">
          Only one admin can be logged in at a time, so a new admin logging in
          will log out whoever is signed in.
        </p>
        <form action={addAdmin} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full name</label>
            <input name="name" placeholder="Admin's full name" required maxLength={100} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Username</label>
            <input name="username" placeholder="Letters, numbers, . _ -" required minLength={3} maxLength={50} autoComplete="off" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Starting password</label>
            <input name="password" type="password" placeholder="At least 10 characters" required minLength={10} maxLength={72} autoComplete="new-password" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Repeat password</label>
            <input name="confirm" type="password" placeholder="Type it again" required minLength={10} maxLength={72} autoComplete="new-password" className="input" />
          </div>
          <button className="btn-primary">Add admin</button>
        </form>
      </section>

      <Link href="/admin" className="text-sm text-muted hover:text-primary transition-colors">
        ← Back to dashboard
      </Link>
    </div>
  );
}