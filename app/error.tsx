"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center animate-fade-in-up max-w-md">
        <p className="text-6xl mb-6">📡</p>
        <h1 className="text-2xl font-bold tracking-tight mb-3">
          Temporarily unavailable
        </h1>
        <p className="text-muted mb-6 leading-relaxed">
          Something went wrong while loading the books. This usually fixes itself
          within a few minutes. Please try again shortly.
        </p>
        <button onClick={() => reset()} className="btn-primary">
          Try again →
        </button>
      </div>
    </main>
  );
}