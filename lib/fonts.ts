import { Fraunces, IBM_Plex_Mono, Caveat } from "next/font/google";

export const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "variable",
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
  display: "swap",
});

export const body = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const hand = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  weight: ["400", "500"],
  display: "swap",
});
