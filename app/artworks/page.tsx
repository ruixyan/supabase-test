"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Customer =
  | {
      id: number;
      name: string | null;
    }
  | {
      id: number;
      name: string | null;
    }[]
  | null;

type Artwork = {
  id: number;
  artist_name: string;
  artist_photo_url: string | null;
  artwork_photo_url: string | null;
  title_jp: string;
  title_en: string | null;
  year: string | null;
  market_price: number | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;
  is_sold: boolean;
  created_at: string;
  customers: Customer;
};

const categoryOptions = [
  "All",
  "Calligraphy",
  "Origami",
  "Metalwork",
  "Ceramics",
  "Lacquerware",
];

export default function ArtworksPage() {
  const supabase = createClient();

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filtered, setFiltered] = useState<Artwork[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");
  const [maxPrice, setMaxPrice] = useState(999999);
  const [artistSearchText, setArtistSearchText] = useState("");
  const [artworkSearchText, setArtworkSearchText] = useState("");
  const [buyerSearchText, setBuyerSearchText] = useState("");
  const [message, setMessage] = useState("");

  async function loadArtworks() {
    const { data, error } = await supabase
      .from("artworks")
      .select(`
        id,
        artist_name,
        artist_photo_url,
        artwork_photo_url,
        title_jp,
        title_en,
        year,
        market_price,
        material,
        dimensions,
        category,
        is_sold,
        created_at,
        customers (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setArtworks(data);
      setFiltered(data);
    }
  }

  useEffect(() => {
    loadArtworks();
  }, []);

  useEffect(() => {
    let result = artworks;

    if (artistSearchText.trim() !== "") {
      result = result.filter((artwork) =>
        artwork.artist_name
          .toLowerCase()
          .includes(artistSearchText.trim().toLowerCase())
      );
    }

    if (artworkSearchText.trim() !== "") {
      result = result.filter((artwork) => {
        const search = artworkSearchText.trim().toLowerCase();
        const titleEn = artwork.title_en?.toLowerCase() || "";
        const titleJp = artwork.title_jp?.toLowerCase() || "";

        return titleEn.includes(search) || titleJp.includes(search);
      });
    }

    if (buyerSearchText.trim() !== "") {
      const search = buyerSearchText.trim().toLowerCase();

      result = result.filter((artwork) => {
        const customer = Array.isArray(artwork.customers)
          ? artwork.customers[0]
          : artwork.customers;

        const buyerName = customer?.name?.toLowerCase() || "";

        return buyerName.includes(search);
      });
    }

    if (activeCategory !== "All") {
      result = result.filter((artwork) => artwork.category === activeCategory);
    }

    if (activeStatus === "Available") {
      result = result.filter((artwork) => artwork.is_sold === false);
    }

    if (activeStatus === "Sold") {
      result = result.filter((artwork) => artwork.is_sold === true);
    }

    result = result.filter((artwork) => {
      if (artwork.market_price === null) return false;
      return artwork.market_price >= 0 && artwork.market_price <= maxPrice;
    });

    setFiltered(result);
  }, [
    artworks,
    activeCategory,
    activeStatus,
    maxPrice,
    artistSearchText,
    artworkSearchText,
    buyerSearchText,
  ]);

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
          <p style={{ fontSize: "15px" }}>No artworks found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
              gap: "56px 48px",
              alignItems: "start",
            }}
          >
            {filtered.map((artwork) => (
              <Link
                key={artwork.id}
                href={`/artworks/${artwork.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {artwork.artwork_photo_url && (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      position: "relative",
                      marginBottom: "18px",
                      overflow: "hidden",
                      background: "#f3f3f3",
                    }}
                  >
                    <Image
                      src={artwork.artwork_photo_url}
                      alt={artwork.title_en || artwork.title_jp}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}

                <h2
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "18px",
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  {artwork.artist_name}
                </h2>

                <p style={{ margin: "0", fontSize: "15px", lineHeight: 1.4 }}>
                  {artwork.title_en || artwork.title_jp}
                </p>

                {artwork.title_en && artwork.title_jp && (
                  <p
                    style={{
                      margin: "0",
                      fontSize: "14px",
                      lineHeight: 1.4,
                      color: "#555",
                    }}
                  >
                    {artwork.title_jp}
                  </p>
                )}

                {artwork.year && (
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "14px",
                      lineHeight: 1.4,
                    }}
                  >
                    {artwork.year}
                  </p>
                )}

                {artwork.market_price !== null && (
                  <p
                    style={{
                      margin: "8px 0 10px 0",
                      fontSize: "15px",
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    ${artwork.market_price.toLocaleString()}
                  </p>
                )}

                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    border: "1px solid #bdbdbd",
                    fontSize: "13px",
                    color: artwork.is_sold ? "#9c1515" : "#444",
                  }}
                >
                  {artwork.is_sold ? "Sold" : "Available"}
                </span>
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
          <p style={{ margin: "0 0 10px 0", fontSize: "13px", fontWeight: 700 }}>
            View Mode
          </p>

          <Link
            href="/artists"
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
            }}
          >
            Switch to Artists
          </Link>
        </div>

        <input
          type="text"
          placeholder="Search artist name"
          value={artistSearchText}
          onChange={(e) => setArtistSearchText(e.target.value)}
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

        <input
          type="text"
          placeholder="Search buyer name"
          value={buyerSearchText}
          onChange={(e) => setBuyerSearchText(e.target.value)}
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

        <div
          style={{
            border: "1px solid #bdbdbd",
            padding: "12px",
            background: "white",
          }}
        >
          <p
            style={{
              margin: "0 0 8px 0",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Market Price
          </p>

          <p
            style={{
              margin: "0 0 8px 0",
              fontSize: "13px",
            }}
          >
            $0 - ${maxPrice.toLocaleString()}
          </p>

          <input
            type="range"
            min="0"
            max="999999"
            step="1000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            style={{
              width: "100%",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          {["Available", "Sold"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() =>
                setActiveStatus(activeStatus === status ? "All" : status)
              }
              style={{
                padding: "10px 12px",
                border: "1px solid #bdbdbd",
                background: activeStatus === status ? "#9c1515" : "white",
                color: activeStatus === status ? "white" : "black",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}