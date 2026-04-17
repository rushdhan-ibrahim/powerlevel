import type { Metadata } from "next";
import {
  EB_Garamond,
  Cormorant_Garamond,
  Cormorant_SC,
  JetBrains_Mono,
  UnifrakturMaguntia,
  Cinzel_Decorative,
} from "next/font/google";
import { Folio } from "@/components/manuscript/Folio";
import { Masthead } from "@/components/manuscript/Masthead";
import { GutterFurniture } from "@/components/manuscript/GutterFurniture";
import "./globals.css";

const serif = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const italic = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const display = Cormorant_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant-sc",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-jetbrains",
  display: "swap",
});

// UnifrakturMaguntia — Gothic blackletter, the illuminated-initial staple
const blackletter = UnifrakturMaguntia({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-blackletter",
  display: "swap",
});

// Cinzel Decorative — Roman caps with flourishes, the alternative illumination
const cinzel = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Powerlevel — a folio for the training body",
  description:
    "An illuminated codex for handwritten training journals. The page reads itself, structures itself, illuminates the patterns hiding in the work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${italic.variable} ${display.variable} ${mono.variable} ${blackletter.variable} ${cinzel.variable}`}
      suppressHydrationWarning
    >
      <body
        style={{
          fontFamily: "var(--font-eb-garamond), var(--serif)",
        }}
      >
        <GutterFurniture />
        <Folio>
          <Masthead />
          {children}
        </Folio>
      </body>
    </html>
  );
}
