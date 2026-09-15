"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function BackToArtworks() {
  const [href, setHref] = useState("/artworks");
  useEffect(() => {
    const saved = sessionStorage.getItem("artworkReturnTo");
    if (saved && /^\/(artworks|artists|clients)(\/|\?|$)/.test(saved)) setHref(saved);
  }, []);
  return <Link href={href} style={{ color: "black", textDecoration: "none" }}>← Back to artworks</Link>;
}
