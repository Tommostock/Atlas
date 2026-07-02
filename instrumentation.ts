// Next.js looks for this special file at startup. Its job is simple:
// depending on which environment the code is running in (a normal Node.js
// server or Vercel's lightweight "edge" runtime), load the matching Sentry
// configuration file.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  // "nodejs" means the normal server environment.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  // "edge" means Vercel's lightweight runtime.
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// This lets Sentry automatically capture errors that happen while the
// server is handling a request. Safe to export even when Sentry is off.
export const onRequestError = Sentry.captureRequestError;
