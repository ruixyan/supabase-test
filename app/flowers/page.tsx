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

const colorOptions = ["Red", "Pink", "Yellow", "White", "Purple", "Blue", "Orange"];
const seasonOptions = ["Spring", "Summer", "Autumn", "Winter"];
const originOptions = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania"];

export default function Flowers() {
  const supabase = createClient();

  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [filtered, setFiltered] = useState<Flower[]>([]);
  const [activeColor, setActiveColor] = useState("All");
  const [activeSeason, setActiveSeason] = useState("All");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "",
    season: "",
    origin: "",
  });

  async function loadFlowers() {
    const { data, error } = await supabase.from("flowers").select("*");

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setFlowers(data);
      setFiltered(data);
    }
  }

  useEffect(() => {
    loadFlowers();
  }, []);

  useEffect(() => {
    let result = flowers;

    if (activeColor !== "All") {
      result = result.filter((f) => f.color === activeColor);
    }

    if (activeSeason !== "All") {
      result = result.filter((f) => f.season === activeSeason);
    }

    setFiltered(result);
  }, [activeColor, activeSeason, flowers]);

  async function addFlower(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Uploading...");

    let imageUrl = "";

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `flower-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("flowers")
        .upload(filePath, imageFile);

      if (uploadError) {
        setMessage(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("flowers")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("flowers").insert([
      {
        name: form.name,
        description: form.description,
        image_url: imageUrl,
        color: form.color,
        season: form.season,
        origin: form.origin,
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Flower added!");

    setForm({
      name: "",
      description: "",
      color: "",
      season: "",
      origin: "",
    });

    setImageFile(null);

    const fileInput = document.getElementById("flower-image") as HTMLInputElement;
    if (fileInput) fileInput.value = "";

    loadFlowers();
  }

  const colors = ["All", ...Array.from(new Set(flowers.map((f) => f.color).filter(Boolean)))];
  const seasons = ["All", ...Array.from(new Set(flowers.map((f) => f.season).filter(Boolean)))];

  const btnStyle = (active: boolean) => ({
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1px solid #ccc",
    cursor: "pointer",
    background: active ? "#1bdb92" : "transparent",
    color: active ? "white" : "inherit",
  });

  const inputStyle = {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "16px" }}>Flowers</h1>

      <form
        onSubmit={addFlower}
        style={{
          display: "grid",
          gap: "10px",
          maxWidth: "420px",
          marginBottom: "32px",
        }}
      >
        <input
          style={inputStyle}
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          style={inputStyle}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <input
          id="flower-image"
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setImageFile(e.target.files[0]);
            }
          }}
        />

        <select
          style={inputStyle}
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          required
        >
          <option value="">Select Color</option>
          {colorOptions.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>

        <select
          style={inputStyle}
          value={form.season}
          onChange={(e) => setForm({ ...form, season: e.target.value })}
          required
        >
          <option value="">Select Season</option>
          {seasonOptions.map((season) => (
            <option key={season} value={season}>
              {season}
            </option>
          ))}
        </select>

        <select
          style={inputStyle}
          value={form.origin}
          onChange={(e) => setForm({ ...form, origin: e.target.value })}
          required
        >
          <option value="">Select Origin</option>
          {originOptions.map((origin) => (
            <option key={origin} value={origin}>
              {origin}
            </option>
          ))}
        </select>

        <button type="submit" style={{ padding: "10px" }}>
          Add Flower
        </button>

        <p>{message}</p>
      </form>

      <div style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <strong>Color:</strong>
        {colors.map((c) => (
          <button key={c} style={btnStyle(activeColor === c)} onClick={() => setActiveColor(c)}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "24px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <strong>Season:</strong>
        {seasons.map((s) => (
          <button key={s} style={btnStyle(activeSeason === s)} onClick={() => setActiveSeason(s)}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        {filtered.map((flower) => (
          <div key={flower.id} style={{ width: "200px", textAlign: "center" }}>
            {flower.image_url && (
              <Image
                src={flower.image_url}
                alt={flower.name}
                width={200}
                height={200}
                style={{ objectFit: "cover", borderRadius: "8px" }}
              />
            )}

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