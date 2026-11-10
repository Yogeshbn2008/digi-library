import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center animate-fade-in-up max-w-md">
        <p className="text-6xl mb-6">🔍</p>
        <h1 className="text-2xl font-bold tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-muted mb-6">
          We couldn&apos;t find what you were looking for.
        </p>
        <Link href="/" className="btn-primary">
          ← Back to the library
        </Link>
      </div>
    </main>
  );
}