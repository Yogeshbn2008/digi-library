"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      <h1 className="mb-2 text-2xl font-bold">Library data is temporarily unavailable</h1>
      <p className="mb-4 text-gray-600">
        Something went wrong while loading the books. This usually fixes itself
        within a few minutes. Please try again shortly.
      </p>
      <button
        onClick={() => reset()}
        className="rounded bg-black px-4 py-2 text-white"
      >
        Try again
      </button>
    </main>
  );
}