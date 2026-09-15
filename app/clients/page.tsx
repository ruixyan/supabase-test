"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { ClientHighlightBadges } from "@/app/components/ClientHighlights";
import Link from "next/link";
import ArtworkFilterPanel from "@/app/components/ArtworkFilterPanel";

type Artwork = {
  id: number;
  title_jp: string | null;
  title_en: string | null;
  category: string | null;
  is_sold: boolean;
  market_price: number | null;
};

type Client = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_vip: boolean;
  is_interior_designer: boolean;
  artworks: Artwork[] | null;
};

const CLIENTS_PER_PAGE = 12;

export default function ClientsPage() {
  const supabase = createClient();

  const [clients, setClients] = useState<Client[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [artistSearchText, setArtistSearchText] = useState("");
  const [artworkSearchText, setArtworkSearchText] = useState("");
  const [buyerSearchText, setBuyerSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [message, setMessage] = useState("");

  async function loadClients() {
    setLoading(true);
    setMessage("");
    const loaded: Client[] = [];
    // Fetch every batch so searches and page counts include the entire list.
    while (true) {
    const { data, error, count } = await supabase
      .from("customers")
      .select(`
        id,
        name,
        email,
        phone,
        address,
        notes,
        is_vip,
        is_interior_designer,
        artworks (
          id,
          title_jp,
          title_en,
          category,
          is_sold,
          market_price
        )
      `, { count: "exact" })
      .order("name", { ascending: true })
      .order("id", { ascending: true })
      .range(loaded.length, loaded.length + 499);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    loaded.push(...(data || []));
    if (!data?.length || loaded.length >= (count ?? loaded.length)) break;
    }
    setClients(loaded);
    setLoading(false);
  }

  useEffect(() => {
    loadClients();
  }, []);

  const filtered = useMemo(() => {
    let result = clients;

    if (buyerSearchText.trim() !== "") {
      const search = buyerSearchText.trim().toLowerCase();

      result = result.filter((client) => {
        const name = client.name?.toLowerCase() || "";
        const email = client.email?.toLowerCase() || "";
        const phone = client.phone?.toLowerCase() || "";

        return (
          name.includes(search) ||
          email.includes(search) ||
          phone.includes(search)
        );
      });
    }

    if (artworkSearchText.trim() !== "") {
      const search = artworkSearchText.trim().toLowerCase();

      result = result.filter((client) =>
        client.artworks?.some((artwork) => {
          const titleEn = artwork.title_en?.toLowerCase() || "";
          const titleJp = artwork.title_jp?.toLowerCase() || "";

          return titleEn.includes(search) || titleJp.includes(search);
        })
      );
    }

    if (activeCategory !== "All") {
      result = result.filter((client) =>
        client.artworks?.some((artwork) => artwork.category === activeCategory)
      );
    }

    return result;
  }, [clients, buyerSearchText, artworkSearchText, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / CLIENTS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageStart = (page - 1) * CLIENTS_PER_PAGE;
  const visibleClients = filtered.slice(pageStart, pageStart + CLIENTS_PER_PAGE);
  const firstPageButton = Math.max(1, Math.min(page - 4, totalPages - 9));
  const pageButtons = Array.from(
    { length: Math.min(10, totalPages) },
    (_, index) => firstPageButton + index
  );

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

    //for mobile

    <div className="artworks-layout">

      <main>
        {message && (
          <p style={{ marginBottom: "20px", color: "#9c1515" }}>{message}</p>
        )}

        {loading ? <p>Loading clients...</p> : filtered.length === 0 ? (
          <p>No clients found.</p>
        ) : (
          // <div
          //   style={{
          //     display: "grid",
          //     gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
          //     gap: "32px",
          //     alignItems: "start",
          //   }}
          // >

          //for mobile

          <div className="artworks-grid">

            {visibleClients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  border: "1px solid #ddd",
                  padding: "20px",
                  background: client.is_vip ? "#fffbeb" : client.is_interior_designer ? "#eff6ff" : "#fafafa",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  {client.name}
                </h2>

                <ClientHighlightBadges vip={client.is_vip} designer={client.is_interior_designer} />
{client.email && (
                  <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
                    {client.email}
                  </p>
                )}

                {client.phone && (
                  <p style={{ margin: "0 0 4px 0", fontSize: "14px" }}>
                    {client.phone}
                  </p>
                )}

                <p
                  style={{
                    margin: "14px 0 0 0",
                    fontSize: "13px",
                    color: "#555",
                  }}
                >
                  Purchased Works: {client.artworks?.length || 0}
                </p>
              </Link>
            ))}
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <>
            {totalPages > 1 && (
              <nav aria-label="Client pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <button type="button" disabled={page === 1}
                  onClick={() => setCurrentPage(page - 1)}
                  className="border border-gray-400 bg-white px-3 py-2 text-sm disabled:opacity-40">
                  ← Previous
                </button>
                {pageButtons.map((number) => (
                  <button key={number} type="button" aria-label={`Page ${number}`}
                    aria-current={page === number ? "page" : undefined}
                    onClick={() => setCurrentPage(number)}
                    className={`min-w-9 border border-gray-400 px-3 py-2 text-sm ${page === number ? "bg-[#9c1515] text-white" : "bg-white text-black"}`}>
                    {number}
                  </button>
                ))}
                <button type="button" disabled={page === totalPages}
                  onClick={() => setCurrentPage(page + 1)}
                  className="border border-gray-400 bg-white px-3 py-2 text-sm disabled:opacity-40">
                  Next →
                </button>
              </nav>
            )}
            <p aria-live="polite" className="mt-4 text-center text-xs text-gray-500">
              {filtered.length} clients · Page {page} of {totalPages}
            </p>
          </>
        )}
      </main>

      <ArtworkFilterPanel
        currentMode="clients"
        addNewLabel="Add Client"
        addNewHref="/clients/new"
        artistSearchText={artistSearchText}
        setArtistSearchText={setArtistSearchText}
        artworkSearchText={artworkSearchText}
        setArtworkSearchText={(value) => { setArtworkSearchText(value); setCurrentPage(1); }}
        buyerSearchText={buyerSearchText}
        setBuyerSearchText={(value) => { setBuyerSearchText(value); setCurrentPage(1); }}
        activeCategory={activeCategory}
        setActiveCategory={(value) => { setActiveCategory(value); setCurrentPage(1); }}
        showArtistSearch={false}
        showCategory={false}
        showStatus={false}
        showPrice={false}
      />
    </div>
  );
}
