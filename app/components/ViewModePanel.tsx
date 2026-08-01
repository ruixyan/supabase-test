"use client";

import Link from "next/link";

type Props = {
  current: "artworks" | "artists" | "clients";
};

export default function ViewModePanel({ current }: Props) {
  const pages = [
    {
      key: "artworks",
      label: "Artworks",
      href: "/artworks",
    },
    {
      key: "artists",
      label: "Artists",
      href: "/artists",
    },
    {
      key: "clients",
      label: "Clients",
      href: "/clients",
    },
  ];

  return (
    <div
      style={{
        border: "1px solid #bdbdbd",
        padding: "14px",
        background: "#fafafa",
      }}
    >
      <p
        style={{
          margin: "0 0 10px",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        View Mode
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {pages.map((page) => {
          const active = page.key === current;

          return (
            <Link
              key={page.key}
              href={page.href}
              style={{
                padding: "10px 12px",
                border: "1px solid #bdbdbd",
                background: active ? "#9c1515" : "white",
                color: active ? "white" : "black",
                textDecoration: "none",
                textAlign: "center",
                fontSize: "13px",
                transition: "0.15s",
              }}
            >
              {page.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}