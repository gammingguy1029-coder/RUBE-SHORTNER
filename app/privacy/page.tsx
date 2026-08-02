import LegalPage, { H2, UL } from "@/app/components/LegalPage";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

export const metadata = { title: "Privacy Policy", robots: "index, follow" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what {SITE_NAME} collects when you use our links,
        why we collect it, and what choices you have. By using this site you
        agree to this policy.
      </p>

      <H2>Information we collect ourselves</H2>
      <UL>
        <li>
          <strong>Request data:</strong> your IP address, user-agent string,
          referring page and the time of your request. Used to prevent abuse and
          apply rate limits.
        </li>
        <li>
          <strong>Link data:</strong> the short code you visited and an
          aggregate view counter. We do not link this to your identity.
        </li>
        <li>
          <strong>A short-lived unlock token:</strong> a signed token valid for
          minutes, used only to confirm you completed the unlock step.
        </li>
        <li>
          <strong>A consent record:</strong> stored locally in your own browser
          so we do not ask you to accept our terms on every visit.
        </li>
      </UL>
      <p>
        We do not ask for or knowingly collect your name, email address, phone
        number, or payment details as a visitor.
      </p>

      <H2>Third parties: advertising and anti-bot</H2>
      <p>
        This is the most important section of this policy. Most data collected
        during your visit is collected by third parties, not by us.
      </p>
      <UL>
        <li>
          <strong>Advertising partners</strong> serve the banners, native units
          and pop-under advertisements on this site. They may set cookies, read
          device identifiers, and collect your IP address, approximate location,
          device and browser characteristics, and interaction data in order to
          select and measure ads. This may constitute a{" "}
          <em>&ldquo;sale&rdquo;</em> or <em>&ldquo;sharing&rdquo;</em> of
          personal information under some laws.
        </li>
        <li>
          <strong>Cloudflare Turnstile</strong> is used to verify you are not an
          automated bot, and processes data as described by Cloudflare.
        </li>
        <li>
          <strong>Our hosting and database providers</strong> process requests
          in order to serve the site.
        </li>
      </UL>
      <p>
        We do not control these third parties and are not responsible for their
        practices. Their handling of your data is governed by their own privacy
        policies, and you should read them. Advertisements are loaded in
        restricted frames, but we cannot audit or guarantee what any advertiser
        collects.
      </p>

      <H2>Cookies and local storage</H2>
      <p>
        We use local storage to remember that you accepted our terms, and a
        cookie for administrator login only. Advertising partners and Turnstile
        may set their own cookies or similar identifiers, which we neither
        control nor have access to. You can block or clear cookies in your
        browser settings; doing so may cause the unlock step to ask for consent
        again.
      </p>

      <H2>Your rights</H2>
      <p>
        Depending on where you live, you may have the right to access, correct,
        delete or port your personal data, to object to processing, or to opt out
        of targeted advertising and the sale or sharing of personal information.
        To exercise any of these, contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
          {CONTACT_EMAIL}
        </a>
        . Because much of the relevant data is held by advertising partners
        rather than us, you may also need to direct requests to them, and we
        will help identify them where we can.
      </p>

      <H2>Children</H2>
      <p>
        This site is not directed to children under 13 (or the minimum age in
        your jurisdiction), and we do not knowingly collect their data. If you
        believe a child has provided data, contact us and we will delete it.
      </p>

      <H2>Retention and security</H2>
      <p>
        Request and rate-limit data is short-lived. Link records persist until
        deleted by an administrator. We use industry-standard measures including
        signed tokens and HTTPS, but no method of transmission or storage is
        completely secure and we cannot guarantee absolute security.
      </p>

      <H2>Changes</H2>
      <p>
        We may update this policy at any time. Continued use of the site after a
        change means you accept the revised policy.
      </p>

      <H2>Contact</H2>
      <p>
        Questions about this policy:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
          {CONTACT_EMAIL}
        </a>
      </p>
    </LegalPage>
  );
}
