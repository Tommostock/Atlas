// A temporary placeholder for the sign-in page.
//
// Real accounts arrive in Phase 2 (Supabase Auth). Until then, this page
// exists so the landing page buttons lead somewhere sensible instead of
// an error — and it offers a way through to the demo trip.

import Link from "next/link";

export default function AuthPlaceholderPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Accounts are coming
      </h1>
      <p className="mt-3 max-w-[300px] text-[13px] leading-relaxed text-ink-soft">
        Sign in and account creation arrive in Phase 2. For now, take a
        look around the sample trip.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 flex h-12 w-full max-w-[280px] items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-bg active:scale-[0.98]"
      >
        View the demo
      </Link>
    </div>
  );
}
