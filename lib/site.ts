/**
 * Site-wide identity used by the legal pages and footer.
 *
 * TODO (required before you go live):
 *   - Set NEXT_PUBLIC_SITE_NAME and NEXT_PUBLIC_CONTACT_EMAIL in .env.local
 *     and in your Vercel project settings.
 *   - A working contact address is a hard requirement for most ad networks'
 *     publisher review, and for GDPR/CCPA data requests. The fallback below is
 *     a placeholder, not a valid address.
 */
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "This site";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "you@example.com";

/** Jurisdiction whose law governs the Terms. TODO: set to your country/state. */
export const GOVERNING_LAW =
  process.env.NEXT_PUBLIC_GOVERNING_LAW || "your jurisdiction of residence";

export const LAST_UPDATED = "2 August 2026";
