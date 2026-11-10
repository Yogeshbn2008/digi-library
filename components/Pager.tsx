import Link from "next/link";

export default function Pager({
  basePath,
  params,
  page,
  pages,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  pages: number;
}) {
  if (pages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <nav className="mt-8 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn-secondary text-sm py-2 px-4">
          ← Previous
        </Link>
      ) : (
        <span className="btn-secondary text-sm py-2 px-4 opacity-40 cursor-not-allowed">
          ← Previous
        </span>
      )}
      <span className="px-4 py-2 text-sm font-medium text-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn-secondary text-sm py-2 px-4">
          Next →
        </Link>
      ) : (
        <span className="btn-secondary text-sm py-2 px-4 opacity-40 cursor-not-allowed">
          Next →
        </span>
      )}
    </nav>
  );
}