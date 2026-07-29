"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const linkStyle = (href: string) => ({
    textDecoration: "none",
    color: pathname.startsWith(href) ? "#9c1515" : "black",
    fontWeight: pathname.startsWith(href) ? 600 : 400,
    fontSize: "14px",
  });

  return (
    <nav className="navbar">
      <Link href="/" style={{ height: "10%", width: "10%" }}>
      <img src="/Onishi_Gallery_Logo.png" alt="logo" className="logo" />
      </Link>

      <div className="navbar-links">
        <Link href="/artworks" style={linkStyle("/artworks")}>
          Artworks
        </Link>
        <Link href="/artists" style={linkStyle("/artists")}>
          Artists
        </Link>
        <Link href="/clients" style={linkStyle("/clients")}>
          Clients
        </Link>
      </div>
    </nav>
  );
}