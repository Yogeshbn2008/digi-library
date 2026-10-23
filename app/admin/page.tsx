import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { logout } from "./actions";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Admin Dashboard</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <AdminContent />
      </Suspense>
            <Link
        href="/admin/login"
        className="mt-8 inline-block text-sm text-gray-500 underline"
      >
        Admin login
      </Link>
    </main>
  );
}

async function AdminContent() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <>
      <p className="mb-4">Logged in as {admin.name}</p>
      <form action={logout}>
        <button className="rounded bg-black px-4 py-2 text-white">
          Log out
        </button>
      </form>
    </>
  );
}
import Link from "next/link";