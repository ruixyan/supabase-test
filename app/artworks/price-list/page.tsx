"use client";

import { normalizeSearch } from "@/lib/search";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PriceListPrint from "@/app/components/PriceListPrint";

type Artwork = {
  id: number;
  artist_name: string | null;
  title_en: string | null;
  title_jp: string | null;
  year: string | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;
  artwork_photo_url: string | null;
  market_price: number | null;
};

const ITEMS_PER_PAGE = 12;

export default function PriceListPage() {
  const supabase = createClient();

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<number[]>([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [priceListHeading, setPriceListHeading] = useState("Onishi Gallery");

  const [priceListTitle, setPriceListTitle] =
    useState("Price List");

  const [showPreview, setShowPreview] =
    useState(false);

  async function loadArtworks() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("artworks")
      .select(`
        id,
        artist_name,
        title_en,
        title_jp,
        year,
        material,
        dimensions,
        category,
        artwork_photo_url,
        market_price
      `)
      .order("artist_name", {
        ascending: true,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setArtworks(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadArtworks();
  }, []);

  function toggleArtwork(id: number) {
    setSelectedArtworkIds((current) => {
      if (current.includes(id)) {
        return current.filter(
          (artworkId) => artworkId !== id
        );
      }

      return [...current, id];
    });
  }

  const filteredArtworks = artworks.filter(
    (artwork) => {
      const search =
        normalizeSearch(searchText);

      if (!search) return true;

      const artistName =
        normalizeSearch(artwork.artist_name);

      const titleEn =
        normalizeSearch(artwork.title_en);

      const titleJp =
        normalizeSearch(artwork.title_jp);

      const year =
        normalizeSearch(artwork.year);

      const category =
        normalizeSearch(artwork.category);

      return (
        artistName.includes(search) ||
        titleEn.includes(search) ||
        titleJp.includes(search) ||
        year.includes(search) ||
        category.includes(search)
      );
    }
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredArtworks.length /
        ITEMS_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE;

  const paginatedArtworks =
    filteredArtworks.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

  const selectedArtworks =
    artworks.filter((artwork) =>
      selectedArtworkIds.includes(
        artwork.id
      )
    );

  const groupedArtworks =
    selectedArtworks.reduce<
      Record<string, Artwork[]>
    >((groups, artwork) => {
      const category =
        artwork.category?.trim() ||
        "Other";

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(artwork);

      return groups;
    }, {});

  const categoryOrder = [
    "Metalwork",
    "Ceramics",
    "Lacquer",
    "Glass",
    "Wall",
    "Other",
  ];

  const sortedCategories =
    Object.keys(
      groupedArtworks
    ).sort((a, b) => {
      const aIndex =
        categoryOrder.indexOf(a);

      const bIndex =
        categoryOrder.indexOf(b);

      if (
        aIndex === -1 &&
        bIndex === -1
      ) {
        return a.localeCompare(b);
      }

      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

    let end =
      start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start =
        totalPages -
        maxVisible +
        1;
    }

    return Array.from(
      {
        length:
          end - start + 1,
      },
      (_, index) =>
        start + index
    );
  }

  if (showPreview) {
    return (
      <main className="price-list-preview-main">
        <div
          className="price-list-controls"
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setShowPreview(false)
            }
            style={{
              padding: 0,
              border: "none",
              background:
                "transparent",
              color: "black",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ← Back to selection
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: "#666",
              }}
            >
              {selectedArtworks.length} artworks
            </span>

            <button
              type="button"
              onClick={() =>
                window.print()
              }
              style={{
                padding:
                  "10px 16px",
                border:
                  "1px solid #9c1515",
                background:
                  "#9c1515",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        <PriceListPrint
          artworks={sortedCategories.flatMap((category) => groupedArtworks[category])}
          heading={priceListHeading}
          subtitle={priceListTitle}
        />
      </main>
    );
  }

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
          color: "black",
          textDecoration: "none",
          fontSize: "14px",
        }}
      >
        ← Back to artworks
      </Link>

      <div
        style={{
          marginTop: "32px",
          marginBottom: "28px",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "28px",
            fontWeight: 600,
          }}
        >
          Create Price List
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: "#666",
          }}
        >
          Select artworks to include in the price list.
        </p>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="price-list-heading" style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>
          Heading 1
        </label>
        <input id="price-list-heading" type="text" value={priceListHeading}
          onChange={(event) => setPriceListHeading(event.target.value)}
          placeholder="Onishi Gallery"
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #bdbdbd", fontSize: "14px" }} />
      </div>

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Heading 2
        </label>

        <input
          type="text"
          aria-label="Heading line 2"
          value={priceListTitle}
          onChange={(event) =>
            setPriceListTitle(
              event.target.value
            )
          }
          placeholder="Price List"
          style={{
            width: "100%",
            padding: "10px 12px",
            border:
              "1px solid #bdbdbd",
            fontSize: "14px",
            outline: "none",
            boxSizing:
              "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "12px",
        }}
      >
        <input
          type="text"
          placeholder="Search artwork, artist, year, or category"
          value={searchText}
          onChange={(event) =>
            setSearchText(
              event.target.value
            )
          }
          style={{
            flex: 1,
            padding: "11px 12px",
            border:
              "1px solid #bdbdbd",
            fontSize: "14px",
            outline: "none",
          }}
        />

        <span
          style={{
            fontSize: "13px",
            color: "#555",
            whiteSpace: "nowrap",
          }}
        >
          {selectedArtworkIds.length} selected
        </span>
      </div>

      {message && (
        <p
          style={{
            color: "#9c1515",
            marginBottom: "20px",
          }}
        >
          {message}
        </p>
      )}

      {loading ? (
        <p>Loading artworks...</p>
      ) : filteredArtworks.length === 0 ? (
        <p>No artworks found.</p>
      ) : (
        <>
          <div
            style={{
              border:
                "1px solid #bdbdbd",
              background: "white",
            }}
          >
            {paginatedArtworks.map(
              (artwork) => {
                const selected =
                  selectedArtworkIds.includes(
                    artwork.id
                  );

                const title =
                  artwork.title_en ||
                  artwork.title_jp ||
                  `Artwork ${artwork.id}`;

                return (
                  <label
                    key={artwork.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "24px 80px 1fr auto",
                      gap: "14px",
                      alignItems:
                        "center",
                      padding:
                        "12px 14px",
                      borderBottom:
                        "1px solid #e5e5e5",
                      background:
                        selected
                          ? "#faf1f1"
                          : "white",
                      cursor:
                        "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selected
                      }
                      onChange={() =>
                        toggleArtwork(
                          artwork.id
                        )
                      }
                    />

                    <div
                      style={{
                        position:
                          "relative",
                        width: "80px",
                        height: "80px",
                        background:
                          "#f3f3f3",
                        overflow:
                          "hidden",
                      }}
                    >
                      {artwork.artwork_photo_url && (
                        <Image
                          src={
                            artwork.artwork_photo_url
                          }
                          alt={title}
                          fill
                          style={{
                            objectFit:
                              "cover",
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <p
                        style={{
                          margin:
                            "0 0 4px 0",
                          fontSize:
                            "14px",
                          fontWeight:
                            600,
                        }}
                      >
                        {title}
                      </p>

                      <p
                        style={{
                          margin:
                            "0 0 3px 0",
                          fontSize:
                            "13px",
                          color:
                            "#555",
                        }}
                      >
                        {artwork.artist_name ||
                          "Unknown Artist"}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize:
                            "12px",
                          color:
                            "#777",
                        }}
                      >
                        {[
                          artwork.year,
                          artwork.category,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " · "
                          )}
                      </p>
                    </div>

                    <div
                      style={{
                        textAlign:
                          "right",
                        fontSize:
                          "14px",
                        fontWeight:
                          600,
                      }}
                    >
                      {artwork.market_price !==
                      null
                        ? `$${artwork.market_price.toLocaleString()}`
                        : "—"}
                    </div>
                  </label>
                );
              }
            )}
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent:
                  "center",
                alignItems:
                  "center",
                flexWrap: "wrap",
                gap: "8px",
                marginTop:
                  "24px",
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
                  background:
                    "white",
                  cursor:
                    currentPage ===
                    1
                      ? "default"
                      : "pointer",
                  opacity:
                    currentPage ===
                    1
                      ? 0.4
                      : 1,
                  fontSize:
                    "13px",
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
                      minWidth:
                        "36px",
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
                  background:
                    "white",
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
                  fontSize:
                    "13px",
                }}
              >
                Next →
              </button>
            </div>
          )}

          <p
            style={{
              margin:
                "12px 0 0 0",
              textAlign:
                "center",
              fontSize: "12px",
              color: "#777",
            }}
          >
            {filteredArtworks.length} artworks · Page{" "}
            {currentPage} of{" "}
            {totalPages}
          </p>
        </>
      )}

      <div
        style={{
          display: "flex",
          justifyContent:
            "flex-end",
          marginTop: "24px",
        }}
      >
        <button
          type="button"
          disabled={
            selectedArtworkIds.length ===
            0
          }
          onClick={() =>
            setShowPreview(true)
          }
          style={{
            padding: "11px 18px",
            border:
              "1px solid #9c1515",
            background:
              selectedArtworkIds.length ===
              0
                ? "#ddd"
                : "#9c1515",
            color:
              selectedArtworkIds.length ===
              0
                ? "#777"
                : "white",
            cursor:
              selectedArtworkIds.length ===
              0
                ? "default"
                : "pointer",
            fontSize: "14px",
          }}
        >
          Preview Price List
        </button>
      </div>
    </main>
  );
}