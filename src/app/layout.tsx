import type { Metadata } from "next";
import { getSiteTitle } from "../lib/site";

export const metadata: Metadata = {
  title: {
    default: `${getSiteTitle()} — A hopeful look at AI and human health`,
    template: `%s | ${getSiteTitle()}`,
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
      <body>{children}</body>
    </html>
  );
}
