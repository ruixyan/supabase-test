"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Artist = {
  id: number;
  name: string | null;
  name_en: string | null;
  name_jp: string | null;
};

type Customer = {
  id: number;
  name: string;
};

type Artwork = {
  id: number;
  artist_id: number | null;
  artist_name: string | null;

  title_jp: string;
  title_en: string | null;

  artwork_photo_url: string | null;
  artist_photo_url: string | null;

  extra_photo_link: string | null;
  fact_sheet_link: string | null;

  year: string | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;

  is_sold: boolean;
  buyer_id: number | null;

  market_price: number | null;
  cost: number | null;

  artists: Artist[] | Artist | null;
  customers: Customer[] | Customer | null;
};

export default function ArtworkDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const supabase = createClient();

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [message, setMessage] = useState("Loading...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadArtwork() {
      const { data, error } = await supabase
        .from("artworks")
        .select(`
          id,
          artist_id,
          artist_name,
          title_jp,
          title_en,
          artwork_photo_url,
          artist_photo_url,
          extra_photo_link,
          fact_sheet_link,
          year,
          material,
          dimensions,
          category,
          is_sold,
          buyer_id,
          market_price,
          cost,
          artists (
            id,
            name,
            name_en,
            name_jp
          ),
          customers (
            id,
            name
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data) {
        setMessage("Artwork not found");
        return;
      }

      setArtwork(data);
      setMessage("");
    }

    loadArtwork();
  }, [id]);

  if (message) {
    return <main style={{ padding: "48px 72px" }}>{message}</main>;
  }

  if (!artwork) return null;

  const artist = Array.isArray(artwork.artists)
    ? artwork.artists[0]
    : artwork.artists;

  const customer = Array.isArray(artwork.customers)
    ? artwork.customers[0]
    : artwork.customers;

  const artistDisplayName =
    artist?.name_en ||
    artist?.name ||
    artist?.name_jp ||
    artwork.artist_name ||
    "Unknown Artist";

  const artistHref = artwork.artist_id ? `/artists/${artwork.artist_id}` : "#";

  const marketPriceText =
    artwork.market_price !== null
      ? `$${artwork.market_price.toLocaleString()}`
      : "";

  const costText =
    artwork.cost !== null ? `￥${artwork.cost.toLocaleString()}` : "";

  const copyText = `${artistDisplayName}

${artwork.title_en || artwork.title_jp}${artwork.year ? `, ${artwork.year}` : ""}

${artwork.material || ""}

${artwork.dimensions || ""}

${marketPriceText}



Gallery Price: ${marketPriceText}

Cost: ${costText}`;

  async function copyArtworkInfo() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 72px" }}>
      <Link href="/artworks" style={{ color: "black", textDecoration: "none" }}>
        ← Back to artworks
      </Link>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "56px",
          marginTop: "32px",
          marginBottom: "48px",
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
          <h1>{artwork.title_en || artwork.title_jp}</h1>

          {artwork.title_en && <p>{artwork.title_jp}</p>}

          <p>
            <strong>Artist:</strong>{" "}
            {artwork.artist_id ? (
              <Link href={artistHref}>{artistDisplayName}</Link>
            ) : (
              artistDisplayName
            )}
          </p>

          {artwork.category && (
            <p>
              <strong>Category:</strong> {artwork.category}
            </p>
          )}

          {artwork.year && (
            <p>
              <strong>Year:</strong> {artwork.year}
            </p>
          )}

          {artwork.material && (
            <p>
              <strong>Material:</strong> {artwork.material}
            </p>
          )}

          {artwork.dimensions && (
            <p>
              <strong>Dimensions:</strong> {artwork.dimensions}
            </p>
          )}

          {artwork.market_price !== null && (
            <p style={{ margin: "20px 0 0 0", fontSize: "16px" }}>
              <strong>Market Price:</strong> {marketPriceText}
            </p>
          )}

          {artwork.cost !== null && (
            <p style={{ margin: 0, fontSize: "16px" }}>
              <strong>Cost:</strong> {costText}
            </p>
          )}

          <span
            style={{
              display: "inline-block",
              marginTop: "16px",
              padding: "6px 12px",
              border: "1px solid #bdbdbd",
              color: artwork.is_sold ? "#9c1515" : "#444",
            }}
          >
            {artwork.is_sold ? "Sold" : "Available"}
          </span>

          <div style={{ marginTop: "24px" }}>
            {artwork.extra_photo_link && (
              <p style={{ margin: "0 0 10px 0", fontSize: "15px" }}>
                <strong>Additional Photos:</strong>{" "}
                <a
                  href={artwork.extra_photo_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#9c1515",
                    textDecoration: "underline",
                  }}
                >
                  View Folder
                </a>
              </p>
            )}

            {artwork.fact_sheet_link && (
              <p style={{ margin: 0, fontSize: "15px" }}>
                <strong>Fact Sheet:</strong>{" "}
                <a
                  href={artwork.fact_sheet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#9c1515",
                    textDecoration: "underline",
                  }}
                >
                  View File
                </a>
              </p>
            )}
          </div>

          {artwork.is_sold && (
            <div
              style={{
                marginTop: "28px",
                padding: "20px",
                border: "1px solid #ddd",
                background: "#fafafa",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Buyer</h3>

              {customer ? (
                <Link href={`/customers/${customer.id}`}>{customer.name}</Link>
              ) : (
                <p>Unknown buyer</p>
              )}
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          padding: "24px",
          marginBottom: "48px",
          background: "#fafafa",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Copy Artwork Information</h2>

        <div
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
            marginBottom: "20px",
          }}
        >
          <strong>{artistDisplayName}</strong>
          {"\n\n"}
          <em>
            {artwork.title_en || artwork.title_jp}
            {artwork.year ? `, ${artwork.year}` : ""}
          </em>
          {"\n\n"}
          {artwork.material}
          {"\n\n"}
          {artwork.dimensions}
          {"\n\n"}
          {marketPriceText}
          {"\n\n\n"}
          Gallery Price: {marketPriceText}
          {"\n\n"}
          Cost: {costText}
        </div>

        <button
          type="button"
          onClick={copyArtworkInfo}
          style={{
            padding: "10px 14px",
            border: "1px solid #9c1515",
            background: "#9c1515",
            color: "white",
            cursor: "pointer",
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </section>

      <section style={{ borderTop: "1px solid #ddd", paddingTop: "40px" }}>
        <h2>Artist</h2>

        <Link
          href={artistHref}
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
            pointerEvents: artwork.artist_id ? "auto" : "none",
          }}
        >
          {artwork.artist_photo_url && (
            <div style={{ position: "relative", width: "180px", height: "180px" }}>
              <Image
                src={artwork.artist_photo_url}
                alt={artistDisplayName}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          )}

          <h3>{artistDisplayName}</h3>
        </Link>
      </section>
    </main>
  );
}