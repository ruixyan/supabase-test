"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ArtworkFilterPanel from "@/app/components/ArtworkFilterPanel";

type Artwork = {
  id: number;
  title_jp: string | null;
  title_en: string | null;
  category: string | null;
  is_sold: boolean;
  market_price: number | null;
};

type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  artworks: Artwork[] | null;
};

export default function ClientsPage() {
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);

  const [artistSearchText, setArtistSearchText] = useState("");
  const [artworkSearchText, setArtworkSearchText] = useState("");
  const [buyerSearchText, setBuyerSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [message, setMessage] = useState("");

  async function loadClients() {
    const { data, error } = await supabase
      .from("customers")
      .select(`
        id,
        name,
        email,
        phone,
        address,
        notes,
        artworks (
          id,
          title_jp,
          title_en,
          category,
          is_sold,
          market_price
        )
      `)
      .order("name", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setClients(data);
      setFiltered(data);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    let result = clients;

    if (buyerSearchText.trim() !== "") {
      const search = buyerSearchText.trim().toLowerCase();

      result = result.filter((client) => {
        const name = client.name?.toLowerCase() || "";
        const email = client.email?.toLowerCase() || "";
        const phone = client.phone?.toLowerCase() || "";

        return (
          name.includes(search) ||
          email.includes(search) ||
          phone.includes(search)
        );
      });
    }

    if (artworkSearchText.trim() !== "") {
      const search = artworkSearchText.trim().toLowerCase();

      result = result.filter((client) =>
        client.artworks?.some((artwork) => {
          const titleEn = artwork.title_en?.toLowerCase() || "";
          const titleJp = artwork.title_jp?.toLowerCase() || "";

          return titleEn.includes(search) || titleJp.includes(search);
        })
      );
    }

    if (activeCategory !== "All") {
      result = result.filter((client) =>
        client.artworks?.some((artwork) => artwork.category === activeCategory)
      );
    }

    setFiltered(result);
  }, [clients, buyerSearchText, artworkSearchText, activeCategory]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 260px",
        gap: "48px",
        padding: "48px 72px",
        maxWidth: "1600px",
        margin: "0 auto",
        alignItems: "start",
      }}
    >
      <main>
        {message && (
          <p style={{ marginBottom: "20px", color: "#9c1515" }}>{message}</p>
        )}

        {filtered.length === 0 ? (
          <p>No clients found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
              gap: "32px",
              alignItems: "start",
            }}
          >
            {filtered.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #ddd",
                  padding: "20px",
                  background: "#fafafa",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  {client.name}
                </h2>

                {client.email && (
                  <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
                    {client.email}
                  </p>
                )}

                {client.phone && (
                  <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
                    {client.phone}
                  </p>
                )}

                <p
                  style={{
                    margin: "14px 0 0 0",
                    fontSize: "13px",
                    color: "#555",
                  }}
                >
                  Purchased Works: {client.artworks?.length || 0}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>

      <ArtworkFilterPanel
        currentMode="clients"
        artistSearchText={artistSearchText}
        setArtistSearchText={setArtistSearchText}
        artworkSearchText={artworkSearchText}
        setArtworkSearchText={setArtworkSearchText}
        buyerSearchText={buyerSearchText}
        setBuyerSearchText={setBuyerSearchText}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        showCategory={false}
        showStatus={false}
        showPrice={false}
      />
    </div>
  );
}