import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { searchStudents, STUDENT_FILTERS, StudentFilter } from "@/lib/students";
import { setStudentStatus, resetStudentPassword } from "../students-actions";
import Pager from "@/components/Pager";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  page?: string;
  msg?: string;
  error?: string;
}>;

const when = (d: Date | null) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export default function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Student requests</h1>
      <Suspense fallback={<p className="text-gray-500">Loading...</p>}>
        <StudentsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function StatusButton({ id, status, label }: { id: number; status: string; label: string }) {
  return (
    <form action={setStudentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className="text-blue-600 underline">{label}</button>
    </form>
  );
}

async function StudentsContent({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { q, status, page, msg, error } = await searchParams;

  const safeStatus: StudentFilter = (STUDENT_FILTERS as readonly string[]).includes(status ?? "")
    ? (status as StudentFilter)
    : "pending";

  const result = await searchStudents({ q, status: safeStatus, page: Number(page) || 1 });

  return (
    <>
      <p className="mb-4 text-sm text-gray-600">
        Before approving, check that the name matches the registration number in the
        hostel records (or confirm in person). Approved students can see their own
        borrowed books.
      </p>

      {msg && <p className="mb-3 rounded bg-green-100 p-2 text-sm text-green-800">{msg}</p>}
      {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}

      <form className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search registration number or name"
          className="flex-1 rounded border p-2"
        />
        <select name="status" defaultValue={safeStatus} className="rounded border p-2">
          <option value="pending">Waiting for approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="blocked">Blocked</option>
          <option value="all">All</option>
        </select>
        <button className="rounded bg-black px-4 text-white">Search</button>
      </form>

      <p className="mb-3 text-sm text-gray-600">
        {result.total} student{result.total === 1 ? "" : "s"} found
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Registration no.</th>
              <th className="p-2">Name</th>
              <th className="p-2">Status</th>
              <th className="p-2">Requested</th>
              <th className="p-2">Last login</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.students.map((s) => (
              <tr key={s.id} className="border-b align-top">
                <td className="p-2">{s.registration_no}</td>
                <td className="p-2">{s.name}</td>
                <td className="p-2">
                  {s.status}
                  {s.decided_by && (
                    <div className="text-xs text-gray-500">by {s.decided_by}</div>
                  )}
                </td>
                <td className="p-2">{when(s.created_at)}</td>
                <td className="p-2">{when(s.last_login_at)}</td>
                <td className="p-2">
                  <div className="flex flex-wrap items-center gap-3">
                    {s.status === "pending" && (
                      <>
                        <StatusButton id={s.id} status="approved" label="Approve" />
                        <StatusButton id={s.id} status="rejected" label="Reject" />
                      </>
                    )}
                    {s.status === "approved" && (
                      <StatusButton id={s.id} status="blocked" label="Block" />
                    )}
                    {s.status === "rejected" && (
                      <StatusButton id={s.id} status="approved" label="Approve" />
                    )}
                    {s.status === "blocked" && (
                      <StatusButton id={s.id} status="approved" label="Unblock" />
                    )}
                  </div>
                  {s.status === "approved" && (
                    <form action={resetStudentPassword} className="mt-2 flex gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <input
                        name="password"
                        type="text"
                        placeholder="New password"
                        minLength={8}
                        maxLength={72}
                        required
                        autoComplete="off"
                        className="w-36 rounded border p-1 text-xs"
                      />
                      <button className="text-xs text-blue-600 underline">Reset</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pager
        basePath="/admin/students"
        params={{ q, status: safeStatus === "pending" ? undefined : safeStatus }}
        page={result.page}
        pages={result.pages}
      />

      <Link href="/admin" className="mt-6 inline-block underline">Back to dashboard</Link>
    </>
  );
}