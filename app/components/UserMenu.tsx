"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";

export default function UserMenu() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email || "");
    }

    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleSignOut() {
    const confirmed = window.confirm(
      "Are you sure you want to sign out?"
    );

    if (!confirmed) return;

    await supabase.auth.signOut();

    window.location.href = "/auth/login";
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: "relative",
      }}
    >
      <button
        type="button"
        aria-label="User menu"
        onClick={() => setIsOpen((current) => !current)}
        style={{
          width: "45px",
          height: "45px",
          borderRadius: "50%",
          border: "1px solid #bdbdbd",
          background: "#e5e5e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <svg
          width="22.5"
          height="22.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "55px",
            right: 0,
            width: "300px",
            maxWidth: "calc(100vw - 32px)",
            padding: "17.5px",
            border: "1px solid #bdbdbd",
            background: "white",
            zIndex: 1000,
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <p
            style={{
              margin: "0 0 5px 0",
              fontSize: "0.9375rem",
              color: "#777",
            }}
          >
            Signed in as
          </p>

          <p
            style={{
              margin: "0 0 17.5px 0",
              fontSize: "1.015625rem",
              overflowWrap: "anywhere",
            }}
          >
            {email || "Loading..."}
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            style={{
              width: "100%",
              padding: "11.25px 15px",
              border: "1px solid #bdbdbd",
              background: "#e5e5e5",
              color: "black",
              cursor: "pointer",
              fontSize: "1.015625rem",
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}