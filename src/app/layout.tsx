import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "../components/site-header";

export const metadata: Metadata = {
  title: {
    default: "AI and longer lives",
    template: "%s | AI and longer lives",
  },
  description:
    "An educational demo exploring how AI may help humanity diagnose, treat, and cure disease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
