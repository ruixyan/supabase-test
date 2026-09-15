"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { loadAllRows, matchesSearch } from "@/lib/search";
import Image from "next/image";
import Link from "next/link";

import ArtworkFilterPanel from "@/app/components/ArtworkFilterPanel";

type Artist = {
  id: number;
  name: string | null;
  name_en: string | null;
  name_jp: string | null;
  artist_photo_url: string | null;
  nationality: string | null;
  birth_year: string | null;
};

type SearchArtwork = { id: number; artist_id: number | null; title_en: string | null; title_jp: string | null; customers: { name: string | null }[] | { name: string | null } | null };

const ITEMS_PER_PAGE = 12;

export default function ArtistsPage() {


  const [allArtists, setAllArtists] = useState<Artist[]>([]);

  const [activeCategory, setActiveCategory] = useState("All");

  const [artistSearchText, setArtistSearchText] = useState("");
  const [artworkSearchText, setArtworkSearchText] = useState("");
  const [buyerSearchText, setBuyerSearchText] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [searchArtworks, setSearchArtworks] = useState<SearchArtwork[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const client = createClient();
    Promise.all([
      loadAllRows<Artist>((from, to) => client.from("artists")
        .select("id, name, name_en, name_jp, artist_photo_url, nationality, birth_year", { count: "exact" })
        .order("name_en", { ascending: true, nullsFirst: false }).order("id").range(from, to)),
      loadAllRows<SearchArtwork>((from, to) => client.from("artworks")
        .select("id, artist_id, title_en, title_jp, customers(name)", { count: "exact" })
        .order("id").range(from, to))
    ]).then(([artists, works]) => { if (active) { setAllArtists(artists); setSearchArtworks(works); } })
      .catch((error: Error) => { if (active) setMessage(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredArtists = useMemo(() => {
    const artworkIds = new Set(searchArtworks.filter((work) =>
      [work.title_en, work.title_jp].some((title) => matchesSearch(title, artworkSearchText))).map((work) => work.artist_id));
    const buyerIds = new Set(searchArtworks.filter((work) => {
      const buyers = Array.isArray(work.customers) ? work.customers : work.customers ? [work.customers] : [];
      return buyers.some((buyer) => matchesSearch(buyer.name, buyerSearchText));
    }).map((work) => work.artist_id));
    return allArtists.filter((artist) =>
      [artist.name, artist.name_en, artist.name_jp].some((name) => matchesSearch(name, artistSearchText))
      && (!artworkSearchText.trim() || artworkIds.has(artist.id))
      && (!buyerSearchText.trim() || buyerIds.has(artist.id)));
  }, [allArtists, searchArtworks, artistSearchText, artworkSearchText, buyerSearchText]);
  const totalCount = filteredArtists.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const artists = filteredArtists.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  useEffect(() => { setCurrentPage(1); }, [artistSearchText, artworkSearchText, buyerSearchText]);

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

    let end =
      start + maxVisible - 1;

    if (end > totalPages) {
      end = totalPages;
      start =
        totalPages - maxVisible + 1;
    }

    return Array.from(
      {
        length: end - start + 1,
      },
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
          <p>Loading artists...</p>
        ) : artists.length === 0 ? (
          <p>No artists found.</p>
        ) : (
          <>
            <div className="artworks-grid artwork-catalog-grid">
              {artists.map((artist) => {
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
                          src={
                            artist.artist_photo_url
                          }
                          alt={displayName}
                          fill
                          style={{
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    )}

                    <h2
                      style={{
                        margin:
                          "0 0 4px 0",
                        fontSize: "20px",
                        fontWeight: 700,
                        lineHeight: 1.3,
                      }}
                    >
                      {displayName}
                    </h2>

                    {artist.name_jp &&
                      artist.name_jp !==
                        displayName && (
                        <p
                          style={{
                            margin:
                              "0 0 4px 0",
                            fontSize: "14px",
                            lineHeight: 1.4,
                            color: "#555",
                          }}
                        >
                          {artist.name_jp}
                        </p>
                      )}

                    {(artist.nationality ||
                      artist.birth_year) && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          lineHeight: 1.4,
                          color: "#555",
                        }}
                      >
                        {[
                          artist.nationality,
                          artist.birth_year,
                        ]
                          .filter(Boolean)
                          .join(", b. ")}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>

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
              {totalCount} artists · Page{" "}
              {currentPage} of{" "}
              {totalPages}
            </p>
          </>
        )}
      </main>

      <ArtworkFilterPanel
        currentMode="artists"
        addNewLabel="Add Artist"
        addNewHref="/artists/new"
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
        showCategory={false}
        showStatus={false}
        showPrice={false}
      />
    </div>
  );
}
