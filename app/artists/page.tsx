"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
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

const ITEMS_PER_PAGE = 12;

export default function ArtistsPage() {
  const supabase = createClient();

  const [artists, setArtists] = useState<Artist[]>([]);

  const [activeCategory, setActiveCategory] = useState("All");

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

  function cleanSearch(text: string) {
    return text
      .trim()
      .replace(/[(),]/g, " ");
  }

  function intersectIds(
    first: number[] | null,
    second: number[]
  ) {
    if (first === null) {
      return Array.from(new Set(second));
    }

    const secondSet = new Set(second);

    return first.filter((id) =>
      secondSet.has(id)
    );
  }

  async function getArtistIdsFromArtworkSearch() {
    const search = cleanSearch(
      artworkSearchText
    );

    if (!search) {
      return null;
    }

    const { data, error } = await supabase
      .from("artworks")
      .select("artist_id")
      .or(
        `title_en.ilike.%${search}%,title_jp.ilike.%${search}%`
      )
      .not("artist_id", "is", null);

    if (error) {
      throw error;
    }

    return Array.from(
      new Set(
        (data || [])
          .map((item) => item.artist_id)
          .filter(
            (id): id is number =>
              typeof id === "number"
          )
      )
    );
  }

  async function getArtistIdsFromBuyerSearch() {
    const search = buyerSearchText.trim();

    if (!search) {
      return null;
    }

    const { data, error } = await supabase
      .from("artworks")
      .select(`
        artist_id,
        customers!inner (
          id,
          name
        )
      `)
      .ilike(
        "customers.name",
        `%${search}%`
      )
      .not("artist_id", "is", null);

    if (error) {
      throw error;
    }

    return Array.from(
      new Set(
        (data || [])
          .map((item) => item.artist_id)
          .filter(
            (id): id is number =>
              typeof id === "number"
          )
      )
    );
  }

  async function loadArtists() {
    setLoading(true);
    setMessage("");

    try {
      /*
        First determine whether artwork/client
        filters restrict which artists are allowed.
      */

      let allowedArtistIds: number[] | null =
        null;

      if (artworkSearchText.trim() !== "") {
        const artworkArtistIds =
          await getArtistIdsFromArtworkSearch();

        allowedArtistIds = intersectIds(
          allowedArtistIds,
          artworkArtistIds || []
        );
      }

      if (buyerSearchText.trim() !== "") {
        const buyerArtistIds =
          await getArtistIdsFromBuyerSearch();

        allowedArtistIds = intersectIds(
          allowedArtistIds,
          buyerArtistIds || []
        );
      }

      /*
        If artwork/client search was active,
        but no artist matches, stop immediately.
      */

      if (
        allowedArtistIds !== null &&
        allowedArtistIds.length === 0
      ) {
        setArtists([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const from =
        (currentPage - 1) * ITEMS_PER_PAGE;

      const to =
        from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("artists")
        .select(
          `
            id,
            name,
            name_en,
            name_jp,
            artist_photo_url,
            nationality,
            birth_year
          `,
          {
            count: "exact",
          }
        );

      /*
        Artist name search
      */

      if (artistSearchText.trim() !== "") {
        const search = cleanSearch(
          artistSearchText
        );

        query = query.or(
          `name_en.ilike.%${search}%,name.ilike.%${search}%,name_jp.ilike.%${search}%`
        );
      }

      /*
        Restrict artists based on matching artworks
        or clients if those searches are active.
      */

      if (allowedArtistIds !== null) {
        query = query.in(
          "id",
          allowedArtistIds
        );
      }

      const {
        data,
        error,
        count,
      } = await query
        .order("name_en", {
          ascending: true,
          nullsFirst: false,
        })
        .range(from, to);

      if (error) {
        setMessage(error.message);
        setArtists([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const newTotalCount = count ?? 0;

      const newTotalPages = Math.max(
        1,
        Math.ceil(
          newTotalCount / ITEMS_PER_PAGE
        )
      );

      /*
        Prevent currentPage from being higher
        than the number of pages after filtering.
      */

      if (
        currentPage > newTotalPages &&
        newTotalCount > 0
      ) {
        setCurrentPage(newTotalPages);
        setLoading(false);
        return;
      }

      setArtists(
        (data || []) as Artist[]
      );

      setTotalCount(newTotalCount);
      setLoading(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load artists.";

      setMessage(errorMessage);
      setArtists([]);
      setTotalCount(0);
      setLoading(false);
    }
  }

  /*
    Reload current page when page/filter changes.
  */

  useEffect(() => {
    loadArtists();
  }, [
    currentPage,
    artistSearchText,
    artworkSearchText,
    buyerSearchText,
  ]);

  /*
    Any search change returns to page 1.
  */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    artistSearchText,
    artworkSearchText,
    buyerSearchText,
  ]);

  /*
    Only show up to 5 page-number buttons.
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
