// This file sets up Sentry for Vercel's "edge" runtime — a lightweight
// environment that some Next.js features run in. We include it so every
// possible place an error could happen is covered. As always, if the DSN
// key is empty, Sentry stays switched off.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    debug: false,
  });
}
