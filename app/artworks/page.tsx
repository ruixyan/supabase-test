"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import ArtworkFilterPanel from "@/app/components/ArtworkFilterPanel";
import { loadAllRows, matchesSearch } from "@/lib/search";
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
  title_jp: string | null;
  title_en: string | null;
  year: string | null;
  market_price: number | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;
  is_unique: boolean;
  is_sold: boolean;
  is_unavailable: boolean;
  created_at: string;
  customers: Customer;
};

const ITEMS_PER_PAGE = 12;

export default function ArtworksPage() {

  const [restored, setRestored] = useState(false);
  const restoreScroll = useRef(true);
  const [allArtworks, setAllArtworks] = useState<Artwork[]>([]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [artistSearchText, setArtistSearchText] = useState("");
  const [artworkSearchText, setArtworkSearchText] = useState("");
  const [buyerSearchText, setBuyerSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);


  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const filteredArtworks = useMemo(() => allArtworks.filter((artwork) => {
    const buyers = Array.isArray(artwork.customers) ? artwork.customers : artwork.customers ? [artwork.customers] : [];
    return matchesSearch(artwork.artist_name, artistSearchText)
      && [artwork.title_en, artwork.title_jp].some((title) => matchesSearch(title, artworkSearchText))
      && (!buyerSearchText.trim() || buyers.some((buyer) => matchesSearch(buyer.name, buyerSearchText)))
      && (activeCategory === "All" || artwork.category === activeCategory)
      && (activeStatus === "All" || (activeStatus === "Sold" ? artwork.is_sold : activeStatus === "Not Available" ? artwork.is_unavailable && !artwork.is_sold : !artwork.is_sold && !artwork.is_unavailable))
      && (!minPrice.trim() || (artwork.market_price !== null && artwork.market_price >= Number(minPrice)))
      && (!maxPrice.trim() || (artwork.market_price !== null && artwork.market_price <= Number(maxPrice)));
  }), [allArtworks, artistSearchText, artworkSearchText, buyerSearchText, activeCategory, activeStatus, minPrice, maxPrice]);
  const totalCount = filteredArtworks.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const artworks = filteredArtworks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("artworkListState") || "null");
      if (saved) {
        if (typeof saved.activeCategory === "string") setActiveCategory(saved.activeCategory);
        if (typeof saved.activeStatus === "string") setActiveStatus(saved.activeStatus);
        if (typeof saved.minPrice === "string") setMinPrice(saved.minPrice);
        if (typeof saved.maxPrice === "string") setMaxPrice(saved.maxPrice);
        if (typeof saved.artistSearchText === "string") setArtistSearchText(saved.artistSearchText);
        if (typeof saved.artworkSearchText === "string") setArtworkSearchText(saved.artworkSearchText);
        if (typeof saved.buyerSearchText === "string") setBuyerSearchText(saved.buyerSearchText);
        if (Number.isInteger(saved.currentPage) && saved.currentPage > 0) setCurrentPage(saved.currentPage);
      }
    } catch { /* Ignore obsolete saved filters. */ }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored) sessionStorage.setItem("artworkListState", JSON.stringify({ activeCategory, activeStatus, minPrice, maxPrice, artistSearchText, artworkSearchText, buyerSearchText, currentPage }));
  }, [restored, activeCategory, activeStatus, minPrice, maxPrice, artistSearchText, artworkSearchText, buyerSearchText, currentPage]);

  useEffect(() => {
    let active = true;
    const client = createClient();
    loadAllRows<Artwork>((from, to) => client.from("artworks")
      .select("id, artist_name, artist_photo_url, artwork_photo_url, title_jp, title_en, year, market_price, material, dimensions, category, is_unique, is_sold, is_unavailable, created_at, customers(id, name)", { count: "exact" })
      .order("created_at", { ascending: false }).order("id", { ascending: false }).range(from, to))
      .then((data) => { if (active) setAllArtworks(data); })
      .catch((error: Error) => { if (active) setMessage(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loading && restored && currentPage > totalPages) setCurrentPage(totalPages);
  }, [loading, restored, currentPage, totalPages]);

  useEffect(() => {
    if (!loading && restored && restoreScroll.current) {
      restoreScroll.current = false;
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, Number(sessionStorage.getItem("artworkScroll")) || 0)));
    }
  }, [loading, restored]);

  function getVisiblePages() {
    const maxVisible = 10;

    if (totalPages <= maxVisible) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    let start = Math.max(
      1,
      currentPage - 4
    );

    let end = start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start = totalPages - maxVisible + 1;
    }

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  }

  return (
    <div className="artworks-layout">
      <main>
        {message && (
          <p
            style={{
              marginBottom: "20px",
              color: "#9c1515",
            }}
          >
            {message}
          </p>
        )}

        {loading ? (
          <p
            style={{
              fontSize: "15px",
            }}
          >
            Loading artworks...
          </p>
        ) : artworks.length === 0 ? (
          <p
            style={{
              fontSize: "15px",
            }}
          >
            No artworks found.
          </p>
        ) : (
          <>
            <div className="artworks-grid artwork-catalog-grid">
              {artworks.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.id}`}
                  onClick={() => { sessionStorage.setItem("artworkReturnTo", window.location.pathname + window.location.search); sessionStorage.setItem("artworkScroll", String(window.scrollY)); }}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
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
                        src={
                          artwork.artwork_photo_url
                        }
                        alt={
                          artwork.title_en ||
                          artwork.title_jp ||
                          "Artwork"
                        }
                        fill
                        style={{
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}

                  <h2
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      fontWeight: 700,
                      lineHeight: 1.4,
                    }}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <>{children}</>
                        ),
                      }}
                    >
                      {artwork.title_en ||
                        artwork.title_jp ||
                        "Untitled"}
                    </ReactMarkdown>
                  </h2>

                  {artwork.title_en &&
                    artwork.title_jp && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          lineHeight: 1.4,
                          color: "#555",
                        }}
                      >
                        <ReactMarkdown
                          components={{
                            p: ({
                              children,
                            }) => (
                              <>
                                {children}
                              </>
                            ),
                          }}
                        >
                          {artwork.title_jp}
                        </ReactMarkdown>
                      </p>
                    )}

                  <p style={{ margin: "4px 0 0", fontSize: "14px", lineHeight: 1.4 }}>
                    {artwork.artist_name}
                  </p>

                  {artwork.year && (
                    <p
                      style={{
                        margin:
                          "4px 0 0 0",
                        fontSize: "14px",
                        lineHeight: 1.4,
                      }}
                    >
                      {artwork.year}
                    </p>
                  )}

                  {artwork.market_price !==
                    null && (
                    <p
                      style={{
                        margin:
                          "8px 0 10px 0",
                        fontSize: "15px",
                        fontWeight: 600,
                        lineHeight: 1.4,
                      }}
                    >
                      $
                      {artwork.market_price.toLocaleString()}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {artwork.is_unique && (
                      <span
                        style={{
                          display:
                            "inline-block",
                          padding:
                            "4px 10px",
                          border:
                            "1px solid #bdbdbd",
                          fontSize: "13px",
                          color: "#444",
                        }}
                      >
                        Unique
                      </span>
                    )}

                    <span
                      style={{
                        display:
                          "inline-block",
                        padding:
                          "4px 10px",
                        border:
                          "1px solid #bdbdbd",
                        fontSize: "13px",
                        color:
                          artwork.is_sold
                            ? "#9c1515"
                            : "#444",
                      }}
                    >
                      {artwork.is_sold
                        ? "Sold"
                        : artwork.is_unavailable ? "Not Available" : "Available"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}

            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "center",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "56px",
                }}
              >
                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  style={{
                    padding:
                      "8px 12px",
                    border:
                      "1px solid #bdbdbd",
                    background: "white",
                    color: "black",
                    cursor:
                      currentPage === 1
                        ? "default"
                        : "pointer",
                    opacity:
                      currentPage === 1
                        ? 0.4
                        : 1,
                    fontSize: "13px",
                  }}
                >
                  ← Previous
                </button>

                {getVisiblePages().map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                      style={{
                        minWidth: "36px",
                        padding:
                          "8px 10px",
                        border:
                          "1px solid #bdbdbd",
                        background:
                          currentPage ===
                          page
                            ? "#9c1515"
                            : "white",
                        color:
                          currentPage ===
                          page
                            ? "white"
                            : "black",
                        cursor:
                          "pointer",
                        fontSize:
                          "13px",
                      }}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  style={{
                    padding:
                      "8px 12px",
                    border:
                      "1px solid #bdbdbd",
                    background: "white",
                    color: "black",
                    cursor:
                      currentPage ===
                      totalPages
                        ? "default"
                        : "pointer",
                    opacity:
                      currentPage ===
                      totalPages
                        ? 0.4
                        : 1,
                    fontSize: "13px",
                  }}
                >
                  Next →
                </button>
              </div>
            )}

            <p
              style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "12px",
                color: "#777",
              }}
            >
              {totalCount} artworks · Page{" "}
              {currentPage} of {totalPages}
            </p>
          </>
        )}
      </main>

      <ArtworkFilterPanel
        currentMode="artworks"
        addNewLabel="Add Artwork"
        addNewHref="/artworks/new"
        artistSearchText={
          artistSearchText
        }
        setArtistSearchText={(value) => { setArtistSearchText(value); setCurrentPage(1); }}
        artworkSearchText={
          artworkSearchText
        }
        setArtworkSearchText={(value) => { setArtworkSearchText(value); setCurrentPage(1); }}
        buyerSearchText={
          buyerSearchText
        }
        setBuyerSearchText={(value) => { setBuyerSearchText(value); setCurrentPage(1); }}
        activeCategory={
          activeCategory
        }
        setActiveCategory={(value) => { setActiveCategory(value); setCurrentPage(1); }}
        activeStatus={
          activeStatus
        }
        setActiveStatus={(value) => { setActiveStatus(value); setCurrentPage(1); }}
        minPrice={minPrice}
        setMinPrice={(value) => { setMinPrice(value); setCurrentPage(1); }}
        maxPrice={maxPrice}
        setMaxPrice={(value) => { setMaxPrice(value); setCurrentPage(1); }}
      />
    </div>
  );
}
