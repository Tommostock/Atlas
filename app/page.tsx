// The landing page — the first thing a logged-out visitor sees.
// Dark, quiet, and to the point: the name, the pitch, and two buttons.

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-6 text-center">
      {/* The app name, big and serif. */}
      <h1 className="font-display text-6xl font-semibold text-ink">Atlas</h1>

      {/* The one-line pitch. */}
      <p className="mt-4 font-display text-lg text-ink">
        Every holiday, planned properly.
      </p>

      {/* A slightly longer explanation underneath. */}
      <p className="mt-3 max-w-[300px] text-[13px] leading-relaxed text-ink-soft">
        Store your trips, build your itinerary, know what to book and what
        it costs.
      </p>

      {/* The two entry buttons. Both go to /auth, which is built properly
          in Phase 2 — for now it shows a friendly placeholder. */}
      <div className="mt-10 flex w-full max-w-[280px] flex-col gap-3">
        <Link
          href="/auth"
          className="flex h-12 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-bg active:scale-[0.98]"
        >
          Create account
        </Link>
        <Link
          href="/auth"
          className="flex h-12 items-center justify-center rounded-full border border-border text-[15px] font-semibold text-ink active:scale-[0.98]"
        >
          Sign in
        </Link>
      </div>

      {/* The small print. */}
      <p className="mt-8 text-xs text-ink-faint">Free forever. No ads.</p>
    </div>
  );
}
