import LegalPage, { H2, UL } from "@/app/components/LegalPage";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";
import Link from "next/link";

export const metadata = { title: "Disclaimer", robots: "index, follow" };

export default function Disclaimer() {
  return (
    <LegalPage title="Disclaimer">
      <p className="rounded border border-neutral-700 bg-neutral-900 p-4 font-medium text-neutral-100">
        {SITE_NAME} is an advertising-supported link redirection service. We do
        not host, control, review, or endorse any destination or advertisement.
        You follow every link and interact with every advertisement entirely at
        your own risk. The owner and operators accept no responsibility or
        liability whatsoever for anything that happens as a result.
      </p>

      <H2>No responsibility for third-party content</H2>
      <p>
        Destination links are submitted by third parties and advertisements are
        served by third-party advertising networks. We are a pass-through. We
        cannot and do not vet destinations or creatives, and their appearance here
        is never an endorsement, affiliation, or recommendation.
      </p>

      <H2>Specifically, we are not responsible for</H2>
      <UL>
        <li>
          malware, viruses, ransomware, phishing pages, scams, fraud, or
          deceptive offers at any destination or advertiser;
        </li>
        <li>
          content that is unlawful, offensive, inaccurate, misleading, or
          age-inappropriate;
        </li>
        <li>
          money you spend, subscriptions you enter, or software you install as a
          result of a link or advertisement;
        </li>
        <li>
          data collected about you by any advertiser, network, or destination
          site;
        </li>
        <li>
          links that are broken, expired, redirected elsewhere, or changed after
          submission;
        </li>
        <li>
          downtime, failed redirects, or lost time — including where an ad
          blocker, extension, or network filter prevents the unlock step from
          completing;
        </li>
        <li>
          any direct, indirect, incidental, or consequential loss or damage of any
          kind arising from use of this site.
        </li>
      </UL>

      <H2>Advertising safety measures</H2>
      <p>
        Banner, native, social-bar and popunder advertisements are rendered
        directly on the page via scripts served from our main domain. Sponsor
        clicks open in a new tab with <code>noopener</code> so the advertiser
        cannot navigate the page you are on. These are precautions taken in good
        faith. They are not a guarantee, and they do not transfer responsibility
        for third-party conduct to us.
      </p>

      <H2>Do your own due diligence</H2>
      <p>
        Keep your device and browser updated, run reputable security software, and
        never enter passwords, payment details, or personal information on a page
        you reached through an advertisement unless you are certain it is
        legitimate.
      </p>

      <H2>Not professional advice</H2>
      <p>
        Nothing on this site constitutes legal, financial, medical, or
        professional advice.
      </p>

      <H2>Full terms</H2>
      <p>
        This disclaimer forms part of our{" "}
        <Link href="/terms" className="underline">
          Terms of Service
        </Link>
        , which include a full limitation of liability, and should be read
        alongside our{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        . Questions:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
          {CONTACT_EMAIL}
        </a>
      </p>
    </LegalPage>
  );
}
