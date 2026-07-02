// Next.js configuration.
//
// The one thing we add here is "next-pwa", which generates a service
// worker at build time. A service worker is a small script the phone
// keeps installed in the background — it caches the app's files so Atlas
// opens instantly from the home screen and keeps working with a patchy
// connection.
//
// It is switched OFF during development ("npm run dev") because a cache
// that keeps serving yesterday's code makes changes impossible to see.

import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  // Put the generated service worker files in /public.
  dest: "public",
  // Only enable the service worker in real production builds.
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* no other custom options needed yet */
};

export default withPWA(nextConfig);
