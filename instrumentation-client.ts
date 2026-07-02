// This file sets up Sentry error monitoring in the browser (the "client").
// Sentry catches any crashes or errors that happen while someone is using
// the app, and reports them to a dashboard so we can fix them.
//
// IMPORTANT: the app must work perfectly even when no Sentry key (called a
// "DSN") has been provided yet. That is why everything is wrapped in an
// "if" check — if the DSN is empty, Sentry simply stays switched off.

import * as Sentry from "@sentry/nextjs";

// Read the DSN from the environment file (.env.local). In Phase 1 this is
// empty, so Sentry does nothing at all.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Capture 100% of performance traces. This is fine on the free tier
    // for a personal app with very little traffic.
    tracesSampleRate: 1.0,

    // Turn off Sentry's own debug logging so the browser console stays clean.
    debug: false,
  });
}

// This export lets Sentry measure how long page-to-page navigation takes.
// It is safe to export even when Sentry is switched off.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
