import Link from "next/link";
import { getCurrentStudent } from "@/lib/student-auth";
import { getCurrentAdmin } from "@/lib/auth";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

export default async function AccountNav() {
  const [student, admin] = await Promise.all([getCurrentStudent(), getCurrentAdmin()]);

  if (student) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/my-books" className="underline">My books</Link>
        <Link
          href="/profile"
          aria-label="Open my profile"
          className="flex items-center gap-2 rounded-full border border-gray-300 py-1 pl-1 pr-3 dark:border-gray-700"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {initials(student.name)}
          </span>
          <span className="hidden max-w-[8rem] truncate sm:inline">{student.name}</span>
        </Link>
      </div>
    );
  }

  if (admin) {
    return (
      <Link href="/admin" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500">
        Admin dashboard
      </Link>
    );
  }

  return (
    <Link href="/login" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
      Log in
    </Link>
  );
}