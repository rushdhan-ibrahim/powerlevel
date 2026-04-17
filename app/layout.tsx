import type { Metadata, Viewport } from "next";
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
import { MobileShell } from "@/components/MobileShell";
import { ThemeBootScript } from "@/components/ThemeToggle";
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
  manifest: "/manifest.webmanifest",
  // iOS PWA niceties — the standalone look, status bar styling, and
  // the home-screen title + icon. These are separate from the
  // W3C manifest because iOS still lags on standards support.
  appleWebApp: {
    capable: true,
    title: "Powerlevel",
    // black-translucent makes the iOS status bar transparent and lets
    // OUR page background paint the area around the Dynamic Island.
    // Without this the status bar is opaque white, which reads as a
    // disconnected strip above the manuscript.
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  // A single theme-color baseline (daylight). The ThemeBootScript +
  // ThemeToggle keep this meta tag in sync with the user's chosen
  // theme at runtime — iOS won't pick the dark variant just because
  // the OS is in dark mode, since our theme is user-opt-in.
  themeColor: "#ece6dc",
  // viewport-fit=cover lets content extend into the notch / home
  // indicator areas; env(safe-area-inset-*) keeps the important bits
  // (tab bar, title bar) clear of the hardware features.
  //
  // We intentionally omit maximumScale / userScalable — the ChartLightbox
  // needs native pinch-zoom to work, and iOS disables that whenever
  // maximum-scale is pinned. Elsewhere in the app, touch-action at the
  // element level prevents accidental zooming on interactive surfaces.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${italic.variable} ${display.variable} ${mono.variable} ${blackletter.variable} ${cinzel.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Flip to data-theme="candlelight" BEFORE first paint if the
            user has opted in, so the page never flashes light → dark. */}
        <ThemeBootScript />
        {/* iOS PWA startup images. Apple doesn't honour W3C manifest
            splash — each device size needs its own <link> with a
            media query matching its point dimensions + DPR. */}
        <link rel="apple-touch-startup-image" href="/splash/iphone-17-pro-max-1320x2868.png" media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-16-15-pro-max-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-15-pro-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-13-14-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-13-mini-1080x2340.png" media="(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/iphone-se-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
      </head>
      <body
        style={{
          fontFamily: "var(--font-eb-garamond), var(--serif)",
        }}
      >
        <GutterFurniture />
        <Folio>
          <Masthead />
          <MobileShell />
          {children}
        </Folio>
      </body>
    </html>
  );
}
