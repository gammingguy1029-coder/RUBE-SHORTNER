import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-neutral-500">The page you’re looking for doesn’t exist.</p>
      <Link href="/" className="rounded bg-white px-5 py-2 text-sm font-medium text-black hover:bg-neutral-200">
        Go home
      </Link>
    </main>
  );
}
