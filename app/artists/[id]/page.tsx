"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

type Artist = {
  id: number;
  name: string | null;
  name_en: string | null;
  name_jp: string | null;
  artist_photo_url: string | null;
  bio: string | null;
  nationality: string | null;
  birth_year: string | null;
  selected_exhibitions: string | null;
  selected_public_collections: string | null;
  contact_info: string | null;
};

type Artwork = {
  id: number;
  title_jp: string;
  title_en: string | null;
  artwork_photo_url: string | null;
  year: string | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;
  is_sold: boolean;
};

export default function ArtistDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const supabase = createClient();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    async function loadArtistAndWorks() {
      const { data: artistData, error: artistError } = await supabase
        .from("artists")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (artistError) {
        setMessage(artistError.message);
        return;
      }

      if (!artistData) {
        setMessage("No artist returned");
        return;
      }

      const { data: artworkData, error: artworkError } = await supabase
        .from("artworks")
        .select(`
          id,
          title_jp,
          title_en,
          artwork_photo_url,
          year,
          material,
          dimensions,
          category,
          is_sold
        `)
        .eq("artist_id", id)
        .order("created_at", { ascending: false });

      if (artworkError) {
        setMessage(artworkError.message);
        return;
      }

      setArtist(artistData);
      setArtworks(artworkData || []);
      setMessage("");
    }

    loadArtistAndWorks();
  }, [id]);

  if (message) {
    return (
      <main style={{ padding: "48px 72px" }}>
        <p>{message}</p>
      </main>
    );
  }

  if (!artist) {
    return null;
  }

  const displayName =
    artist.name_en || artist.name || artist.name_jp || "Untitled Artist";

  return (
    <main style={{ padding: "48px 72px", maxWidth: "1400px", margin: "0 auto" }}>
      <Link href="/artists" style={{ color: "black", textDecoration: "none" }}>
        ← Back to artists
      </Link>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "48px",
          marginTop: "32px",
          marginBottom: "64px",
        }}
      >
        {artist.artist_photo_url && (
          <div
            style={{
              position: "relative",
              width: "320px",
              height: "320px",
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

        <div>
          <h1>{displayName}</h1>

          {artist.name_jp && <p>{artist.name_jp}</p>}

          {(artist.nationality || artist.birth_year) && (
            <p>
              {[artist.nationality, artist.birth_year].filter(Boolean).join(", ")}
            </p>
          )}

          {artist.bio && <p style={{ whiteSpace: "pre-wrap" }}>{artist.bio}</p>}
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: "32px" }}>Works</h2>

        {artworks.length === 0 ? (
          <p>No artworks found for this artist.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
              gap: "56px 48px",
              alignItems: "start",
            }}
          >
            {artworks.map((artwork) => (
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

                <p style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: 600 }}>
                  {artwork.title_en || artwork.title_jp}
                </p>

                {artwork.title_jp && artwork.title_en && (
                  <p style={{ margin: "0 0 2px 0", fontSize: "14px", color: "#555" }}>
                    {artwork.title_jp}
                  </p>
                )}

                {artwork.year && (
                  <p style={{ margin: "0 0 2px 0", fontSize: "14px" }}>
                    {artwork.year}
                  </p>
                )}

                {artwork.material && (
                  <p style={{ margin: "0 0 2px 0", fontSize: "14px" }}>
                    {artwork.material}
                  </p>
                )}

                {artwork.dimensions && (
                  <p style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
                    {artwork.dimensions}
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
      </section>
    </main>
  );
}