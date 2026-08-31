import "./globals.css";
import Footer from "./components/Footer";

export const metadata = {
  title: "Link Shortener",
  description:
    "An advertising-supported link redirection service. Links and advertisements are provided by third parties and followed at your own risk.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to ad and captcha hosts so the TLS handshake overlaps with the
            page render instead of blocking it. With only these 4 hints the browser
            can pipeline 6 domains on the unlock page. */}
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link rel="preconnect" href="https://www.highrevenueformat.com" />
        <link rel="preconnect" href="https://www.highperformanceformat.com" />
        <link rel="preconnect" href="https://pl30646646.effectivecpmnetwork.com" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="flex min-h-screen flex-col antialiased selection:bg-amber-500/20 selection:text-amber-200">
        <div className="flex flex-1 flex-col relative">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
