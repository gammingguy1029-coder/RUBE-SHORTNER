import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center animate-slideUp">
      <h1 className="text-6xl font-semibold tracking-tight text-neutral-700 animate-fadeIn">404</h1>
      <h2 className="text-lg font-semibold -mt-2">Page not found</h2>
      <p className="text-sm text-neutral-500">The page you&rsquo;re looking for doesn&rsquo;t exist.</p>
      <Link
        href="/"
        className="rounded bg-white px-5 py-2 text-sm font-medium text-black transition-all duration-200 hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] shimmer-btn"
      >
        Go home
      </Link>
    </main>
  );
}

