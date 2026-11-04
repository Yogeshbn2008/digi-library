import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAdmins } from "@/lib/admins";
import { addAdmin, changeOwnPassword, setAdminActive } from "../admin-actions";

type SearchParams = Promise<{ msg?: string; error?: string }>;

export default function AdminsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Admin accounts</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <AdminsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AdminsContent({ searchParams }: { searchParams: SearchParams }) {
  const me = await requireAdmin();
  const { msg, error } = await searchParams;
  const admins = await getAdmins();

  const box = "w-full rounded border p-2";

  return (
    <>
      {msg && <p className="mb-3 rounded bg-green-100 p-2 text-sm text-green-800">{msg}</p>}
      {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}

      <h2 className="mb-2 text-lg font-semibold">All admins</h2>
      <div className="mb-8 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Username</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">{a.name}</td>
                <td className="p-2">{a.username}</td>
                <td className="p-2">{a.is_active ? "Active" : "Deactivated"}</td>
                <td className="p-2">
                  {a.id === me.id ? (
                    <span className="text-gray-500">You</span>
                  ) : (
                    <form action={setAdminActive}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="active" value={a.is_active ? 0 : 1} />
                      <button className="text-blue-600 underline">
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

      <h2 className="mb-2 text-lg font-semibold">Change my password</h2>
      <form action={changeOwnPassword} className="mb-8 space-y-2">
        <input name="current" type="password" placeholder="Current password" required autoComplete="current-password" className={box} />
        <input name="next" type="password" placeholder="New password (at least 10 characters)" required minLength={10} maxLength={72} autoComplete="new-password" className={box} />
        <input name="confirm" type="password" placeholder="Repeat new password" required minLength={10} maxLength={72} autoComplete="new-password" className={box} />
        <button className="rounded bg-black px-4 py-2 text-white">Change password</button>
      </form>

      <h2 className="mb-2 text-lg font-semibold">Add an admin</h2>
      <p className="mb-2 text-sm text-gray-600">
        Only one admin can be logged in at a time, so a new admin logging in
        will log out whoever is signed in.
      </p>
      <form action={addAdmin} className="mb-8 space-y-2">
        <input name="name" placeholder="Full name" required maxLength={100} className={box} />
        <input name="username" placeholder="Username (letters, numbers, . _ -)" required minLength={3} maxLength={50} autoComplete="off" className={box} />
        <input name="password" type="password" placeholder="Starting password (at least 10 characters)" required minLength={10} maxLength={72} autoComplete="new-password" className={box} />
        <input name="confirm" type="password" placeholder="Repeat starting password" required minLength={10} maxLength={72} autoComplete="new-password" className={box} />
        <button className="rounded bg-black px-4 py-2 text-white">Add admin</button>
      </form>

      <Link href="/admin" className="underline">Back to dashboard</Link>
    </>
  );
}