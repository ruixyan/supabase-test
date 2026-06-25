import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Artist = {
  id: number;
  name: string | null;
  name_en: string | null;
  name_jp: string | null;
};

type Artwork = {
  id: number;
  artist_id: number | null;
  artist_name: string | null;
  title_jp: string;
  title_en: string | null;
  artwork_photo_url: string | null;
  artist_photo_url: string | null;
  year: string | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;
  is_sold: boolean;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_notes: string | null;
  created_at: string;
  artists: Artist[] | Artist | null;
};

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: artwork, error } = await supabase
    .from("artworks")
    .select(`
      id,
      artist_id,
      artist_name,
      title_jp,
      title_en,
      artwork_photo_url,
      artist_photo_url,
      year,
      material,
      dimensions,
      category,
      is_sold,
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_notes,
      created_at,
      artists (
        id,
        name,
        name_en,
        name_jp
      )
    `)
    .eq("id", id)
    .single();

  if (error || !artwork) {
    notFound();
  }

  const artist = Array.isArray(artwork.artists)
    ? artwork.artists[0]
    : artwork.artists;

  const artistDisplayName =
    artist?.name_en ||
    artist?.name ||
    artist?.name_jp ||
    artwork.artist_name ||
    "Unknown Artist";

  const artistHref = artwork.artist_id ? `/artists/${artwork.artist_id}` : "#";
  const artistClickable = Boolean(artwork.artist_id);

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "48px 72px",
      }}
    >
      <Link
        href="/artworks"
        style={{
          display: "inline-block",
          marginBottom: "32px",
          color: "black",
          textDecoration: "none",
          fontSize: "14px",
        }}
      >
        ← Back to artworks
      </Link>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "56px",
          alignItems: "start",
          marginBottom: "64px",
        }}
      >
        <div>
          {artwork.artwork_photo_url && (
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
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
        </div>

        <div>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "34px" }}>
            {artwork.title_en || artwork.title_jp}
          </h1>

          {artwork.title_en && (
            <p style={{ margin: "0 0 24px 0", fontSize: "20px", color: "#555" }}>
              {artwork.title_jp}
            </p>
          )}

          <p style={{ margin: "0 0 10px 0", fontSize: "18px" }}>
            <strong>Artist:</strong>{" "}
            {artistClickable ? (
              <Link
                href={artistHref}
                style={{ color: "inherit", textDecoration: "underline" }}
              >
                {artistDisplayName}
              </Link>
            ) : (
              artistDisplayName
            )}
          </p>

          {artwork.category && (
            <p style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              <strong>Category:</strong> {artwork.category}
            </p>
          )}

          {artwork.year && (
            <p style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              <strong>Year:</strong> {artwork.year}
            </p>
          )}

          {artwork.material && (
            <p style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              <strong>Material:</strong> {artwork.material}
            </p>
          )}

          {artwork.dimensions && (
            <p style={{ margin: "0 0 10px 0", fontSize: "16px" }}>
              <strong>Dimensions:</strong> {artwork.dimensions}
            </p>
          )}

          <span
            style={{
              display: "inline-block",
              marginTop: "16px",
              padding: "6px 12px",
              border: "1px solid #bdbdbd",
              color: artwork.is_sold ? "#9c1515" : "#444",
              fontSize: "14px",
            }}
          >
            {artwork.is_sold ? "Sold" : "Available"}
          </span>

          {artwork.is_sold && (
            <div
              style={{
                marginTop: "28px",
                padding: "20px",
                border: "1px solid #ddd",
                background: "#fafafa",
              }}
            >
              <h3 style={{ margin: "0 0 14px 0", fontSize: "20px" }}>
                Buyer Information
              </h3>

              {artwork.buyer_name && (
                <p style={{ margin: "0 0 8px 0", fontSize: "15px" }}>
                  <strong>Name:</strong> {artwork.buyer_name}
                </p>
              )}

              {artwork.buyer_email && (
                <p style={{ margin: "0 0 8px 0", fontSize: "15px" }}>
                  <strong>Email:</strong> {artwork.buyer_email}
                </p>
              )}

              {artwork.buyer_phone && (
                <p style={{ margin: "0 0 8px 0", fontSize: "15px" }}>
                  <strong>Phone:</strong> {artwork.buyer_phone}
                </p>
              )}

              {artwork.buyer_notes && (
                <p style={{ margin: "0", fontSize: "15px", lineHeight: 1.6 }}>
                  <strong>Notes:</strong> {artwork.buyer_notes}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          borderTop: "1px solid #ddd",
          paddingTop: "40px",
        }}
      >
        <h2 style={{ margin: "0 0 20px 0", fontSize: "24px" }}>Artist</h2>

        <Link
          href={artistHref}
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            pointerEvents: artistClickable ? "auto" : "none",
            cursor: artistClickable ? "pointer" : "default",
          }}
        >
          {artwork.artist_photo_url && (
            <div
              style={{
                position: "relative",
                width: "180px",
                height: "180px",
                background: "#f3f3f3",
                flexShrink: 0,
              }}
            >
              <Image
                src={artwork.artist_photo_url}
                alt={artistDisplayName}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          )}

          <div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "22px" }}>
              {artistDisplayName}
            </h3>

            {artist?.name_jp &&
              artist.name_jp !== artistDisplayName && (
                <p style={{ margin: 0, fontSize: "16px", color: "#555" }}>
                  {artist.name_jp}
                </p>
              )}
          </div>
        </Link>
      </section>
    </main>
  );
}