"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";

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

const categoryOptions = [
  "All",
  "Calligraphy",
  "Origami",
  "Metalwork",
  "Ceramics",
  "Lacquerware",
];

export default function ClientsPage() {
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [clientSearchText, setClientSearchText] = useState("");
  const [artworkSearchText, setArtworkSearchText] = useState("");
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

    if (clientSearchText.trim() !== "") {
      const search = clientSearchText.trim().toLowerCase();

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
  }, [clients, clientSearchText, artworkSearchText, activeCategory]);

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
                href={`/customers/${client.id}`}
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

      <aside
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          position: "sticky",
          top: "48px",
        }}
      >
        <div
          style={{
            border: "1px solid #bdbdbd",
            padding: "14px",
            marginBottom: "8px",
            background: "#fafafa",
          }}
        >
          <p
            style={{
              margin: "0 0 10px 0",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            View Mode
          </p>

          <Link
            href="/artworks"
            style={{
              display: "block",
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #9c1515",
              background: "#9c1515",
              color: "white",
              textDecoration: "none",
              textAlign: "center",
              fontSize: "13px",
              boxSizing: "border-box",
              marginBottom: "8px",
            }}
          >
            Switch to Artworks
          </Link>

          <Link
            href="/artists"
            style={{
              display: "block",
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #bdbdbd",
              background: "white",
              color: "black",
              textDecoration: "none",
              textAlign: "center",
              fontSize: "13px",
              boxSizing: "border-box",
            }}
          >
            Switch to Artists
          </Link>
        </div>

        <input
          type="text"
          placeholder="Search client name"
          value={clientSearchText}
          onChange={(e) => setClientSearchText(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #bdbdbd",
            fontSize: "13px",
            outline: "none",
          }}
        />

        <input
          type="text"
          placeholder="Search artwork name"
          value={artworkSearchText}
          onChange={(e) => setArtworkSearchText(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #bdbdbd",
            fontSize: "13px",
            outline: "none",
          }}
        />

        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #bdbdbd",
            background: "white",
            fontSize: "13px",
          }}
        >
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </aside>
    </div>
  );
}