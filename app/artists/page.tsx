"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import ArtworkFilterPanel from "@/app/components/ArtworkFilterPanel";
import ViewModePanel from "@/app/components/ViewModePanel";

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
    // <div
    //   style={{
    //     display: "grid",
    //     gridTemplateColumns: "1fr 260px",
    //     gap: "48px",
    //     padding: "48px 72px",
    //     maxWidth: "1600px",
    //     margin: "0 auto",
    //     alignItems: "start",
    //   }}
    // >

    // for mobile

    <div className="artworks-layout">
      
      <main>
        {message && (
          <p style={{ marginBottom: "20px", color: "#9c1515" }}>{message}</p>
        )}

        {filtered.length === 0 ? (
          <p>No artists found.</p>
        ) : (
          // <div
          //   style={{
          //     display: "grid",
          //     gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
          //     gap: "56px 48px",
          //     alignItems: "start",
          //   }}
          // >

          // for mobile
          <div className="artworks-grid">

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
                        .join(", b. ")}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
<ArtworkFilterPanel
  currentMode="artists"
  addNewLabel="Add Artist"
  addNewHref="/artists/new"
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