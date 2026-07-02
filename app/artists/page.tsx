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
  title_jp: string | null;
  title_en: string | null;
  category: string | null;
  is_sold: boolean;
  customers: Customer;
};

type Artist = {
  id: number;
  name: string | null;
  name_en: string | null;
  name_jp: string | null;
  artist_photo_url: string | null;
  nationality: string | null;
  birth_year: string | null;
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

export default function ArtistsPage() {
  const supabase = createClient();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [filtered, setFiltered] = useState<Artist[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [artistSearchText, setArtistSearchText] = useState("");
  const [artworkSearchText, setArtworkSearchText] = useState("");
  const [buyerSearchText, setBuyerSearchText] = useState("");
  const [message, setMessage] = useState("");

  async function loadArtists() {
    const { data, error } = await supabase
      .from("artists")
      .select(`
        id,
        name,
        name_en,
        name_jp,
        artist_photo_url,
        nationality,
        birth_year,
        artworks (
          id,
          title_jp,
          title_en,
          category,
          is_sold,
          customers (
            id,
            name
          )
        )
      `)
      .order("name_en", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setArtists(data);
      setFiltered(data);
    }
  }

  useEffect(() => {
    loadArtists();
  }, []);

  useEffect(() => {
    let result = artists;

    if (artistSearchText.trim() !== "") {
      const search = artistSearchText.trim().toLowerCase();

      result = result.filter((artist) => {
        const nameEn = artist.name_en?.toLowerCase() || "";
        const name = artist.name?.toLowerCase() || "";
        const nameJp = artist.name_jp?.toLowerCase() || "";

        return (
          nameEn.includes(search) ||
          name.includes(search) ||
          nameJp.includes(search)
        );
      });
    }

    if (artworkSearchText.trim() !== "") {
      const search = artworkSearchText.trim().toLowerCase();

      result = result.filter((artist) =>
        artist.artworks?.some((artwork) => {
          const titleEn = artwork.title_en?.toLowerCase() || "";
          const titleJp = artwork.title_jp?.toLowerCase() || "";

          return titleEn.includes(search) || titleJp.includes(search);
        })
      );
    }

    if (buyerSearchText.trim() !== "") {
      const search = buyerSearchText.trim().toLowerCase();

      result = result.filter((artist) =>
        artist.artworks?.some((artwork) => {
          const customer = Array.isArray(artwork.customers)
            ? artwork.customers[0]
            : artwork.customers;

          const buyerName = customer?.name?.toLowerCase() || "";

          return buyerName.includes(search);
        })
      );
    }

    if (activeCategory !== "All") {
      result = result.filter((artist) =>
        artist.artworks?.some((artwork) => artwork.category === activeCategory)
      );
    }

    setFiltered(result);
  }, [
    artists,
    activeCategory,
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
          <p>No artists found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
              gap: "56px 48px",
              alignItems: "start",
            }}
          >
            {filtered.map((artist) => {
              const displayName =
                artist.name_en ||
                artist.name ||
                artist.name_jp ||
                "Untitled Artist";

              return (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  {artist.artist_photo_url && (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        position: "relative",
                        marginBottom: "16px",
                        overflow: "hidden",
                        background: "#f3f3f3",
                      }}
                    >
                      <Image
                        src={artist.artist_photo_url}
                        alt={displayName}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}

                  <h2
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "20px",
                      fontWeight: 700,
                      lineHeight: 1.3,
                    }}
                  >
                    {displayName}
                  </h2>

                  {artist.name_jp && artist.name_jp !== displayName && (
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "14px",
                        lineHeight: 1.4,
                        color: "#555",
                      }}
                    >
                      {artist.name_jp}
                    </p>
                  )}

                  {(artist.nationality || artist.birth_year) && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        lineHeight: 1.4,
                        color: "#555",
                      }}
                    >
                      {[artist.nationality, artist.birth_year]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </Link>
              );
            })}
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
            }}
          >
            Switch to Artworks
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
      </aside>
    </div>
  );
}