// This file sets up Sentry error monitoring on the server (the computer at
// Vercel that builds and serves the pages). Same rule as the browser config:
// if no DSN key is provided, Sentry stays completely switched off and the
// app runs normally.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    debug: false,
  });
}
