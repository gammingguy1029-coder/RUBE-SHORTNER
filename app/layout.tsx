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
      <body className="flex min-h-screen flex-col antialiased selection:bg-amber-500/20 selection:text-amber-200">
        <div className="flex flex-1 flex-col relative">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
