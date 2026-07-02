// next-pwa is an older package that doesn't come with TypeScript type
// information. This small file fills that gap: it describes the shape of
// the module so TypeScript stops complaining when we import it in
// next.config.ts. It has zero effect on how the app actually runs.

declare module "next-pwa" {
  import type { NextConfig } from "next";

  // The options next-pwa accepts (only the ones we use, plus a catch-all
  // so any other documented option is also allowed).
  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    [key: string]: unknown;
  }

  // Calling next-pwa with options returns a function that wraps our
  // Next.js config.
  export default function withPWAInit(
    config: PWAConfig
  ): (nextConfig: NextConfig) => NextConfig;
}
