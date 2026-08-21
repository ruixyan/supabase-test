"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const supabase = createClient();

  async function handleSignOut() {
    const confirmed = window.confirm(
      "Are you sure you want to sign out?"
    );

    if (!confirmed) return;

    await supabase.auth.signOut();

    window.location.href = "/auth/login";
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      style={{
        padding: "8px 12px",
        border: "1px solid #bdbdbd",
        background: "#e5e5e5",
        color: "black",
        cursor: "pointer",
        fontSize: "13px",
      }}
    >
      Sign Out
    </button>
  );
}