import LegalPage, { H2 } from "@/app/components/LegalPage";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";
import Link from "next/link";

export const metadata = { title: "Contact", robots: "index, follow" };

export default function Contact() {
  return (
    <LegalPage title="Contact">
      <p>
        For all enquiries relating to {SITE_NAME} — including privacy and data
        requests, takedown notices, abuse reports, and advertising — email:
      </p>
      <p className="text-base">
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
          {CONTACT_EMAIL}
        </a>
      </p>

      <H2>Reporting a harmful link or advertisement</H2>
      <p>
        If a short link or an advertisement on this site leads somewhere
        malicious, deceptive, or unlawful, please tell us. Include the full short
        link, and where possible a screenshot and the destination address you
        reached. We disable reported links while we investigate and report bad
        creatives to the advertising network.
      </p>

      <H2>Copyright</H2>
      <p>
        Copyright complaints follow the process on our{" "}
        <Link href="/dmca" className="underline">
          DMCA page
        </Link>
        .
      </p>

      <H2>Response times</H2>
      <p>
        We aim to respond to abuse and takedown reports within a few business
        days. This is a small independent service and we cannot guarantee a
        response time.
      </p>
    </LegalPage>
  );
}
