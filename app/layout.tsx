import type { Metadata } from "next";
import { body, display, hand } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiny Trauma — daily friction, mostly",
  description:
    "A personal blog about the small daily friction between who you are and everything around you. Honest, slightly literary, sometimes funny, occasionally devastating, never a wellness tip.",
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
