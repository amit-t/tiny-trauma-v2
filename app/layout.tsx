import type { Metadata } from "next";
import { body, display, hand } from "@/lib/fonts";
import "./globals.css";

const DESCRIPTION =
  "A personal blog about the small daily friction between who you are and everything around you. Honest, slightly literary, sometimes funny, occasionally devastating, never a wellness tip.";

export const metadata: Metadata = {
  metadataBase: new URL("https://tinytrauma.in"),
  title: {
    default: "Tiny Trauma — daily friction, mostly",
    template: "%s — Tiny Trauma",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Tiny Trauma — daily friction, mostly",
    description: DESCRIPTION,
    siteName: "Tiny Trauma",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiny Trauma",
    description: DESCRIPTION,
  },
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${display.variable} ${body.variable} ${hand.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
