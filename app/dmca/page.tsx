import LegalPage, { H2, UL } from "@/app/components/LegalPage";
import { SITE_NAME, CONTACT_EMAIL } from "@/lib/site";

export const metadata = { title: "DMCA / Takedown", robots: "index, follow" };

export default function Dmca() {
  return (
    <LegalPage title="DMCA / Takedown Policy">
      <p>
        {SITE_NAME} does not host any files or content. We operate a link
        redirection service, and destination URLs are submitted by third parties.
        We respect intellectual property rights and will disable links that point
        to infringing material.
      </p>

      <H2>Filing a notice</H2>
      <p>
        Send a written notice to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
          {CONTACT_EMAIL}
        </a>{" "}
        including all of the following:
      </p>
      <UL>
        <li>
          identification of the copyrighted work you claim has been infringed;
        </li>
        <li>
          the full short link on this site (for example
          https://example.com/AbCdEf12) that you are reporting;
        </li>
        <li>your name, address, telephone number and email address;</li>
        <li>
          a statement that you have a good-faith belief the use is not authorised
          by the copyright owner, its agent, or the law;
        </li>
        <li>
          a statement, under penalty of perjury, that the information is accurate
          and that you are the owner or authorised to act on the owner&rsquo;s
          behalf;
        </li>
        <li>your physical or electronic signature.</li>
      </UL>

      <H2>What we do</H2>
      <p>
        Valid notices are normally actioned within a few business days by
        disabling the reported short link. Because we do not host the underlying
        content, disabling a link does not remove the material itself — you will
        also need to contact the host of the destination site.
      </p>

      <H2>Counter-notice and repeat infringers</H2>
      <p>
        If your link was disabled and you believe that was a mistake, you may send
        a counter-notice to the same address with your contact details, the link
        in question, and a statement under penalty of perjury that it was disabled
        as a result of mistake or misidentification. We terminate the accounts of
        repeat infringers.
      </p>

      <H2>Bad-faith notices</H2>
      <p>
        Knowingly submitting a materially false notice may expose you to liability
        for damages under applicable law.
      </p>
    </LegalPage>
  );
}
