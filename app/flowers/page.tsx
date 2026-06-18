"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Image from "next/image";

type Flower = {
  id: number;
  name: string;
  description: string;
  image_url: string;
  color: string;
  season: string;
  origin: string;
};

export default function Flowers() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [filtered, setFiltered] = useState<Flower[]>([]);
  const [activeColor, setActiveColor] = useState("All");
  const [activeSeason, setActiveSeason] = useState("All");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("flowers").select().then(({ data }) => {
      if (data) {
        setFlowers(data);
        setFiltered(data);
      }
    });
  }, []);

  useEffect(() => {
    let result = flowers;
    if (activeColor !== "All") result = result.filter(f => f.color === activeColor);
    if (activeSeason !== "All") result = result.filter(f => f.season === activeSeason);
    setFiltered(result);
  }, [activeColor, activeSeason, flowers]);

  const colors = ["All", ...Array.from(new Set(flowers.map(f => f.color)))];
  const seasons = ["All", ...Array.from(new Set(flowers.map(f => f.season)))];

  const btnStyle = (active: boolean) => ({
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1px solid #ccc",
    cursor: "pointer",
    background: active ? "#1bdb92" : "transparent",
    color: active ? "white" : "inherit",
  });

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "16px" }}>Flowers</h1>

      <div style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <strong>Color:</strong>
        {colors.map(c => (
          <button key={c} style={btnStyle(activeColor === c)} onClick={() => setActiveColor(c)}>{c}</button>
        ))}
      </div>

      <div style={{ marginBottom: "24px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <strong>Season:</strong>
        {seasons.map(s => (
          <button key={s} style={btnStyle(activeSeason === s)} onClick={() => setActiveSeason(s)}>{s}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        {filtered.map(flower => (
          <div key={flower.id} style={{ width: "200px", textAlign: "center" }}>
            <Image
              src={flower.image_url}
              alt={flower.name}
              width={200}
              height={200}
              style={{ objectFit: "cover", borderRadius: "8px" }}
            />
            <h2>{flower.name}</h2>
            <p style={{ fontSize: "14px" }}>{flower.description}</p>
            <p style={{ fontSize: "12px", color: "gray" }}>🎨 {flower.color}</p>
            <p style={{ fontSize: "12px", color: "gray" }}>🌤 {flower.season}</p>
            <p style={{ fontSize: "12px", color: "gray" }}>🌍 {flower.origin}</p>
          </div>
        ))}
      </div>
    </div>
  );
}