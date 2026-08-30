import Link from "next/link";

export default function CodeNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Link not found</h1>
      <p className="text-sm leading-relaxed text-neutral-500">
        This short link doesn’t exist or has been disabled.
      </p>
      <Link href="/" className="rounded bg-white px-5 py-2 text-sm font-medium text-black hover:bg-neutral-200">
        Go to homepage
      </Link>
      <Link href="/contact" className="text-xs text-neutral-500 underline hover:text-neutral-300">
        Report a problem
      </Link>
    </main>
  );
}
