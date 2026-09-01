import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-800 px-6 py-6 text-center text-xs text-neutral-500">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/privacy" className="hover:text-neutral-300 underline transition-colors">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-neutral-300 underline transition-colors">
          Terms of Service
        </Link>
        <Link href="/disclaimer" className="hover:text-neutral-300 underline transition-colors">
          Disclaimer
        </Link>
        <Link href="/dmca" className="hover:text-neutral-300 underline transition-colors">
          DMCA
        </Link>
        <Link href="/contact" className="hover:text-neutral-300 underline transition-colors">
          Contact
        </Link>
      </nav>
      <p className="mx-auto mt-4 max-w-2xl leading-relaxed">
        This site hosts advertising and links to third-party destinations. We do
        not control, host, endorse, or verify any linked content or advertisement
        and accept no responsibility or liability for it. All links are followed
        entirely at your own risk. See our{" "}
        <Link href="/disclaimer" className="underline hover:text-neutral-300 transition-colors">
          Disclaimer
        </Link>{" "}
        for the full terms.
      </p>
    </footer>
  );
}
