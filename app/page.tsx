// The front door of the app.
//
// Sign-in was removed for now (it may return in a later phase), so there
// is nothing to show here — anyone opening the site goes straight to
// their trips.

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
