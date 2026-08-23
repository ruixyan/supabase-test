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
  title_jp: string | null;
  title_en: string | null;
  year: string | null;
  market_price: number | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;
  is_unique: boolean;
  is_sold: boolean;
  created_at: string;
  customers: Customer;
};

const ITEMS_PER_PAGE = 12;

export default function ArtworksPage() {
  const supabase = createClient();

  const [artworks, setArtworks] = useState<Artwork[]>([]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [artistSearchText, setArtistSearchText] = useState("");
  const [artworkSearchText, setArtworkSearchText] = useState("");
  const [buyerSearchText, setBuyerSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / ITEMS_PER_PAGE)
  );

  async function loadArtworks() {
    setLoading(true);
    setMessage("");

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const hasBuyerSearch =
      buyerSearchText.trim() !== "";

    /*
      Important:

      When searching Client, use !inner so only artworks
      whose related customer matches are returned.

      Otherwise use the normal relation so Available
      artworks with no buyer are still returned.
    */

    const customerSelect = hasBuyerSearch
      ? `
        customers!inner (
          id,
          name
        )
      `
      : `
        customers (
          id,
          name
        )
      `;

    let query = supabase
      .from("artworks")
      .select(
        `
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
          is_unique,
          is_sold,
          created_at,
          ${customerSelect}
        `,
        {
          count: "exact",
        }
      );

    // Artist search
    if (artistSearchText.trim() !== "") {
      query = query.ilike(
        "artist_name",
        `%${artistSearchText.trim()}%`
      );
    }

    // Artwork title search
    if (artworkSearchText.trim() !== "") {
      const search = artworkSearchText
        .trim()
        .replaceAll(",", " ");

      query = query.or(
        `title_en.ilike.%${search}%,title_jp.ilike.%${search}%`
      );
    }

    // Client search
    if (hasBuyerSearch) {
      query = query.ilike(
        "customers.name",
        `%${buyerSearchText.trim()}%`
      );
    }

    // Category
    if (activeCategory !== "All") {
      query = query.eq(
        "category",
        activeCategory
      );
    }

    // Status
    if (activeStatus === "Available") {
      query = query.eq(
        "is_sold",
        false
      );
    }

    if (activeStatus === "Sold") {
      query = query.eq(
        "is_sold",
        true
      );
    }

    // Minimum market price
    if (minPrice.trim() !== "") {
      query = query.gte(
        "market_price",
        Number(minPrice)
      );
    }

    // Maximum market price
    if (maxPrice.trim() !== "") {
      query = query.lte(
        "market_price",
        Number(maxPrice)
      );
    }

    const {
      data,
      error,
      count,
    } = await query
      .order("created_at", {
        ascending: false,
      })
      .range(from, to);

    if (error) {
      console.error(error);

      setMessage(error.message);
      setArtworks([]);
      setTotalCount(0);
      setLoading(false);

      return;
    }

    const newTotalCount = count ?? 0;

    /*
      Example:

      User is on page 5.
      They apply a filter.
      Filter result only has 2 pages.

      Prevent page 5 from showing empty.
    */

    const newTotalPages = Math.max(
      1,
      Math.ceil(
        newTotalCount / ITEMS_PER_PAGE
      )
    );

    if (
      currentPage > newTotalPages &&
      newTotalCount > 0
    ) {
      setCurrentPage(newTotalPages);
      setLoading(false);
      return;
    }

    setArtworks(
      (data || []) as unknown as Artwork[]
    );

    setTotalCount(newTotalCount);
    setLoading(false);
  }

  /*
    Query Supabase whenever page or filters change.
  */

  useEffect(() => {
    loadArtworks();
  }, [
    currentPage,
    activeCategory,
    activeStatus,
    minPrice,
    maxPrice,
    artistSearchText,
    artworkSearchText,
    buyerSearchText,
  ]);

  /*
    When any filter changes,
    return to page 1.
  */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeCategory,
    activeStatus,
    minPrice,
    maxPrice,
    artistSearchText,
    artworkSearchText,
    buyerSearchText,
  ]);

  /*
    Only show a limited group of page buttons.

    Example:
    1 2 3 4 5

    or when further in:
    4 5 6 7 8
  */

  function getVisiblePages() {
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    let start = Math.max(
      1,
      currentPage - 2
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
            <div className="artworks-grid">
              {artworks.map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.id}`}
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
                      margin: "0 0 4px 0",
                      fontSize: "18px",
                      fontWeight: 700,
                      lineHeight: 1.3,
                    }}
                  >
                    {artwork.artist_name}
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
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
                  </p>

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
                        : "Available"}
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
        setArtistSearchText={
          setArtistSearchText
        }
        artworkSearchText={
          artworkSearchText
        }
        setArtworkSearchText={
          setArtworkSearchText
        }
        buyerSearchText={
          buyerSearchText
        }
        setBuyerSearchText={
          setBuyerSearchText
        }
        activeCategory={
          activeCategory
        }
        setActiveCategory={
          setActiveCategory
        }
        activeStatus={
          activeStatus
        }
        setActiveStatus={
          setActiveStatus
        }
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
      />
    </div>
  );
}