"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ArtworkFilterPanel from "@/app/components/ArtworkFilterPanel";
import ReactMarkdown from "react-markdown";

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
  "Ceramic",
  "Lacquerware",
];

export default function ArtworksPage() {
  const supabase = createClient();

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filtered, setFiltered] = useState<Artwork[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
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

   if (minPrice !== "" || maxPrice !== "") {
  result = result.filter((artwork) => {
    if (artwork.market_price === null) {
      return false;
    }

    if (
      minPrice !== "" &&
      artwork.market_price < Number(minPrice)
    ) {
      return false;
    }

    if (
      maxPrice !== "" &&
      artwork.market_price > Number(maxPrice)
    ) {
      return false;
    }

    return true;
  });
}

    setFiltered(result);
  }, [
    artworks,
    activeCategory,
    activeStatus,
    minPrice,
    maxPrice,
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
          <p style={{ fontSize: "15px" }}>No artworks found.</p>
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
  <ReactMarkdown
    components={{
      p: ({ children }) => <>{children}</>,
    }}
  >
    {artwork.title_en || artwork.title_jp}
  </ReactMarkdown>
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
  <ReactMarkdown
    components={{
      p: ({ children }) => <>{children}</>,
    }}
  >
    {artwork.title_jp}
  </ReactMarkdown>
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
      <ArtworkFilterPanel
  currentMode="artworks"
  addNewLabel="Add Artwork"
  addNewHref="/artworks/new"
  artistSearchText={artistSearchText}
  setArtistSearchText={setArtistSearchText}
  artworkSearchText={artworkSearchText}
  setArtworkSearchText={setArtworkSearchText}
  buyerSearchText={buyerSearchText}
  setBuyerSearchText={setBuyerSearchText}
  activeCategory={activeCategory}
  setActiveCategory={setActiveCategory}
  activeStatus={activeStatus}
  setActiveStatus={setActiveStatus}
  minPrice={minPrice}
  setMinPrice={setMinPrice}
  maxPrice={maxPrice}
  setMaxPrice={setMaxPrice}
/>
    </div>
  );
}