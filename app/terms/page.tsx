import LegalPage, { H2, UL } from "@/app/components/LegalPage";
import { SITE_NAME, CONTACT_EMAIL, GOVERNING_LAW } from "@/lib/site";
import Link from "next/link";

export const metadata = { title: "Terms of Service", robots: "index, follow" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These Terms govern your use of {SITE_NAME}. By visiting any page,
        clicking any button, or following any link on this site, you agree to be
        bound by them. If you do not agree, stop using the site immediately.
      </p>

      <H2>1. What this service is</H2>
      <p>
        We operate an advertising-supported link redirection service. Visitors
        pass through an intermediate page containing advertisements and a bot
        check before being forwarded to a destination URL submitted by a third
        party. We are a conduit. We do not create, host, review, control, or
        endorse destination content.
      </p>

      <H2>2. No responsibility for destinations or advertisements</H2>
      <p>
        <strong>
          You use every link and advertisement on this site entirely at your own
          risk.
        </strong>{" "}
        Destination URLs and advertisements are supplied by third parties. To the
        fullest extent permitted by law, the site owner is not responsible or
        liable for:
      </p>
      <UL>
        <li>
          the content, accuracy, legality, safety, or availability of any
          destination or advertisement;
        </li>
        <li>
          any malware, virus, phishing attempt, scam, fraud, or unwanted software
          encountered at any destination or advertiser;
        </li>
        <li>
          any transaction, purchase, subscription, download, or agreement you
          enter into with a third party;
        </li>
        <li>
          any data any third party collects about you, or any use they make of
          it;
        </li>
        <li>
          any loss, damage, cost, or harm — direct or indirect — arising from
          following a link or interacting with an advertisement.
        </li>
      </UL>
      <p>
        Advertisements are loaded inside restricted frames configured so they
        cannot navigate or alter the page you are on. This is a precaution, not a
        guarantee of safety, and it does not make us responsible for advertiser
        conduct.
      </p>

      <H2>3. Acceptable use</H2>
      <p>You agree not to:</p>
      <UL>
        <li>
          bypass, script, automate, or circumvent the unlock flow, countdown, bot
          check, or advertisements, or use any tool designed to do so;
        </li>
        <li>
          generate artificial, incentivised, or fraudulent traffic, impressions,
          or clicks;
        </li>
        <li>
          embed, frame, mirror, or scrape this site, or resell access to it;
        </li>
        <li>
          submit or distribute links to unlawful content, malware, or material
          that infringes anyone&rsquo;s rights;
        </li>
        <li>
          attack, overload, probe, or attempt to gain unauthorised access to the
          service.
        </li>
      </UL>
      <p>
        We may block, rate-limit, or permanently deny access to anyone for any
        reason, without notice.
      </p>

      <H2>4. Advertising and consent</H2>
      <p>
        This service is funded by advertising. You acknowledge that using it
        involves viewing advertisements, that a pop-under or new-tab
        advertisement may open when you press a clearly labelled advertisement
        button, and that third-party advertising partners will process data about
        your device as described in our{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        . Using an ad blocker or interfering with advertisements may prevent the
        service from working.
      </p>

      <H2>5. No warranty</H2>
      <p>
        The service is provided <strong>&ldquo;as is&rdquo;</strong> and{" "}
        <strong>&ldquo;as available&rdquo;</strong>, without warranties of any
        kind, express or implied, including merchantability, fitness for a
        particular purpose, non-infringement, uninterrupted availability, or
        accuracy. We do not warrant that any link will work, that any redirect
        will complete, or that the site will be free of errors or harmful
        components.
      </p>

      <H2>6. Limitation of liability</H2>
      <p>
        To the maximum extent permitted by applicable law, the site owner and its
        operators shall not be liable for any indirect, incidental, special,
        consequential, punitive, or exemplary damages, or for any loss of
        profits, revenue, data, goodwill, or business, arising out of or relating
        to your use of the service — even if advised of the possibility. Where
        liability cannot lawfully be excluded, our total aggregate liability to
        you for all claims is limited to the greater of the amount you paid us
        (which is normally zero) or USD 10.
      </p>
      <p>
        Nothing in these Terms excludes liability that cannot be excluded by law,
        such as liability for death or personal injury caused by negligence, or
        for fraud. Some jurisdictions do not allow certain exclusions, so parts of
        this section may not apply to you.
      </p>

      <H2>7. Indemnity</H2>
      <p>
        You agree to indemnify and hold harmless the site owner and its operators
        from any claim, demand, loss, liability, or expense (including reasonable
        legal fees) arising from your use of the service, your breach of these
        Terms, or your violation of any law or third-party right.
      </p>

      <H2>8. Third-party links are not endorsements</H2>
      <p>
        The presence of any link or advertisement is not an endorsement,
        sponsorship, affiliation, or recommendation. We have no control over
        third-party sites and assume no responsibility for their terms, privacy
        practices, or content.
      </p>

      <H2>9. Intellectual property and takedowns</H2>
      <p>
        We do not host destination content. If a link points to material that
        infringes your rights, see our{" "}
        <Link href="/dmca" className="underline">
          DMCA / takedown page
        </Link>
        .
      </p>

      <H2>10. Changes and termination</H2>
      <p>
        We may modify these Terms, or suspend or discontinue the service in whole
        or in part, at any time and without notice. Continued use after changes
        constitutes acceptance. Links may be disabled or deleted at any time.
      </p>

      <H2>11. Governing law</H2>
      <p>
        These Terms are governed by the laws of {GOVERNING_LAW}, without regard
        to conflict-of-laws rules. If any provision is held unenforceable, the
        remainder stays in force.
      </p>

      <H2>12. Contact</H2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
          {CONTACT_EMAIL}
        </a>
      </p>

      <p className="mt-2 rounded border border-neutral-800 bg-neutral-900/60 p-3 text-xs text-neutral-400">
        These Terms are a general template, not legal advice. Have a qualified
        lawyer in your jurisdiction review them before relying on them.
      </p>
    </LegalPage>
  );
}
