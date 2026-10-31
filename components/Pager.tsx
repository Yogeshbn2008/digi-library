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
    <nav className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="underline">Previous</Link>
      ) : (
        <span className="text-gray-400">Previous</span>
      )}
      <span>Page {page} of {pages}</span>
      {page < pages ? (
        <Link href={href(page + 1)} className="underline">Next</Link>
      ) : (
        <span className="text-gray-400">Next</span>
      )}
    </nav>
  );
}