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
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
        👥 Student requests
      </h1>
      <Suspense fallback={<div className="card p-12 text-center animate-pulse-subtle"><div className="h-6 w-32 bg-muted-bg rounded mx-auto" /></div>}>
        <StudentsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function StatusButton({ id, status, label }: { id: number; status: string; label: string }) {
  const styles: Record<string, string> = {
    Approve: "btn-primary text-xs py-1 px-3",
    Reject: "btn-danger text-xs py-1 px-3",
    Block: "btn-danger text-xs py-1 px-3",
    Unblock: "btn-secondary text-xs py-1 px-3",
  };
  return (
    <form action={setStudentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={styles[label] ?? "btn-secondary text-xs py-1 px-3"}>{label}</button>
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

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "badge-warning",
      approved: "badge-success",
      rejected: "badge-danger",
      blocked: "badge-danger",
    };
    return map[s] ?? "badge-muted";
  };

  return (
    <div className="animate-fade-in">
      <div className="alert alert-warning mb-6 text-sm">
        💡 Before approving, check that the name matches the registration number in the
        hostel records (or confirm in person). Approved students can see their own borrowed books.
      </div>

      {msg && <div className="alert alert-success mb-4 animate-slide-in">{msg}</div>}
      {error && <div className="alert alert-danger mb-4 animate-slide-in">{error}</div>}

      <form className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search registration number or name"
            className="input pl-10"
          />
        </div>
        <select name="status" defaultValue={safeStatus} className="input sm:w-52">
          <option value="pending">Waiting for approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="blocked">Blocked</option>
          <option value="all">All</option>
        </select>
        <button className="btn-primary">Search</button>
      </form>

      <p className="mb-4 text-sm text-muted">
        {result.total} student{result.total === 1 ? "" : "s"} found
      </p>

      <div className="table-wrapper">
        <table className="min-w-[760px]">
          <thead>
            <tr>
              <th>Reg. No.</th>
              <th>Name</th>
              <th className="p-2">Room</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.students.map((s) => (
              <tr key={s.id} className="align-top">
                <td className="font-mono text-sm">{s.registration_no}</td>
                <td className="font-medium">{s.name}</td>
                <td className="p-2">{s.room_no ?? "—"}</td>
                <td>
                  <span className={`badge ${statusBadge(s.status)}`}>
                    {s.status}
                  </span>
                  {s.decided_by && (
                    <div className="text-xs text-muted mt-1">by {s.decided_by}</div>
                  )}
                </td>
                <td className="text-muted text-sm">{when(s.created_at)}</td>
                <td className="text-muted text-sm">{when(s.last_login_at)}</td>
                <td>
                  <div className="flex flex-wrap items-center gap-2">
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
                    <form action={resetStudentPassword} className="mt-2 flex gap-2 items-center">
                      <input type="hidden" name="id" value={s.id} />
                      <input
                        name="password"
                        type="text"
                        placeholder="New password"
                        minLength={8}
                        maxLength={72}
                        required
                        autoComplete="off"
                        className="input w-36 text-xs py-1"
                      />
                      <button className="btn-secondary text-xs py-1 px-2">Reset</button>
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

      <Link href="/admin" className="mt-6 inline-flex text-sm text-muted hover:text-primary transition-colors">
        ← Back to dashboard
      </Link>
    </div>
  );
}