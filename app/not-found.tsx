import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
      <p className="mb-4 text-gray-600">We couldn't find what you were looking for.</p>
      <Link href="/" className="underline">Back to the library</Link>
    </main>
  );
}