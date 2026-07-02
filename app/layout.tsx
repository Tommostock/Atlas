// This is the "root layout" — the outer shell that wraps every single page
// of Atlas. It loads our two fonts, sets the page title, and applies the
// dark background to the whole app.

import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Load the two Google Fonts the design system uses. next/font downloads
// them at build time and serves them from our own site, which is faster
// and works offline — no request to Google when someone uses the app.
//
// Fraunces is the elegant serif used for trip names, day headings and big
// cost totals. The "variable" option creates a CSS variable that our
// globals.css connects to the "font-display" Tailwind class.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  // "opsz" (optical size) makes Fraunces automatically adjust its letter
  // shapes to look right at both small and large sizes.
  axes: ["opsz"],
});

// Inter is the clean sans-serif used for all body text and UI labels.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Information about the app that browsers and search engines read.
export const metadata: Metadata = {
  title: "Atlas",
  description: "Every holiday, planned properly.",
  // Points to the PWA manifest, which is what lets iPhones and Androids
  // "Add to Home Screen" with the right name, icon and colours.
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    // The icon iOS uses on the home screen.
    apple: "/icon-192.png",
  },
  appleWebApp: {
    // Opens full-screen from the iPhone home screen, no Safari bars.
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Atlas",
  },
};

// Settings for how the page behaves on a phone screen.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The colour the phone tints its status bar to match the app.
  themeColor: "#C87941",
  // "cover" lets our bottom tab bar extend behind the iPhone home
  // indicator, so we can pad it correctly with safe-area insets.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The two font variables are attached to <html> so every element in
    // the app can use them. "font-sans" on <body> makes Inter the default.
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
