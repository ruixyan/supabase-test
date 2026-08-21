"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/artworks");
    router.refresh();
  }

  return (
    <main
      style={{
        maxWidth: "420px",
        margin: "100px auto",
        padding: "32px",
        border: "1px solid #ddd",
        background: "white",
      }}
    >
      <h1
        style={{
          margin: "0 0 24px 0",
          fontSize: "24px",
          fontWeight: 600,
        }}
      >
        Sign In
      </h1>

      <form
        onSubmit={handleLogin}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #bdbdbd",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #bdbdbd",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "11px 14px",
            border: "1px solid #9c1515",
            background: "#9c1515",
            color: "white",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
            fontSize: "14px",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {message && (
          <p
            style={{
              margin: 0,
              color: "#9c1515",
              fontSize: "14px",
            }}
          >
            {message}
          </p>
        )}
      </form>
    </main>
  );
}