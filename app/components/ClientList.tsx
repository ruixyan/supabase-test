"use client";

import { normalizeSearch } from "@/lib/search";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

const CLIENTS_PER_PAGE = 32;

function ProfileContent({ href, children }: { href: string | null; children: ReactNode }) {
  if (!href) return <div>{children}</div>;
  return <Link href={href} className="block text-inherit no-underline"
    onClick={() => { try { sessionStorage.setItem("clientScroll", String(window.scrollY)); } catch { /* Navigation still works. */ } }}>
    {children}
  </Link>;
}

export default function ClientList({ exportMode = false }: { exportMode?: boolean }) {
  const stateKey = exportMode ? "clientExportState" : "clientListState";
  const scrollKey = exportMode ? "clientExportScroll" : "clientScroll";

  const [clients, setClients] = useState<Client[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [restored, setRestored] = useState(false);
  const restoreScroll = useRef(true);
  const [vipOnly, setVipOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(stateKey) || "null");
      if (saved) {
        if (Number.isInteger(saved.currentPage) && saved.currentPage > 0) setCurrentPage(saved.currentPage);
        if (typeof saved.buyerSearchText === "string") setBuyerSearchText(saved.buyerSearchText);
        if (typeof saved.artworkSearchText === "string") setArtworkSearchText(saved.artworkSearchText);
        if (typeof saved.activeCategory === "string") setActiveCategory(saved.activeCategory);
        if (exportMode && typeof saved.vipOnly === "boolean") setVipOnly(saved.vipOnly);
      }
    } catch { /* Ignore unavailable storage or obsolete saved filters. */ }
    setRestored(true);
  }, [stateKey, exportMode]);

  const [artistSearchText, setArtistSearchText] = useState("");
  const [artworkSearchText, setArtworkSearchText] = useState("");
  const [buyerSearchText, setBuyerSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(stateKey, JSON.stringify({ currentPage, buyerSearchText, artworkSearchText, activeCategory, vipOnly }));
    } catch { /* Browsing still works when storage is unavailable. */ }
  }, [restored, currentPage, buyerSearchText, artworkSearchText, activeCategory, vipOnly, stateKey]);

  useEffect(() => {
    if (loading || !restored || !restoreScroll.current) return;
    restoreScroll.current = false;
    let scroll = 0;
    try { scroll = Number(sessionStorage.getItem(scrollKey)) || 0; } catch { /* Use the top of the list. */ }
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => window.scrollTo(0, scroll));
    });
    return () => cancelAnimationFrame(frame);
  }, [loading, restored, scrollKey]);

  async function exportProfiles(profiles: Client[]) {
    if (!profiles.length) return;
    setExporting(true);
    setMessage("");
    try {
      const { createClientWorkbook } = await import("@/lib/client-export");
      const workbook = createClientWorkbook(profiles);
      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `client-profiles-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMessage("Could not export client profiles. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
  const supabase = createClient();
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

    loadClients();
  }, []);

  const filtered = useMemo(() => {
    let result = exportMode && vipOnly ? clients.filter((client) => client.is_vip) : clients;

    if (buyerSearchText.trim() !== "") {
      const search = normalizeSearch(buyerSearchText);

      result = result.filter((client) => {
        const name = normalizeSearch(client.name);
        const email = normalizeSearch(client.email);
        const phone = normalizeSearch(client.phone);

        return (
          name.includes(search) ||
          email.includes(search) ||
          phone.includes(search)
        );
      });
    }

    if (artworkSearchText.trim() !== "") {
      const search = normalizeSearch(artworkSearchText);

      result = result.filter((client) =>
        client.artworks?.some((artwork) => {
          const titleEn = normalizeSearch(artwork.title_en);
          const titleJp = normalizeSearch(artwork.title_jp);

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
  }, [clients, buyerSearchText, artworkSearchText, activeCategory, vipOnly, exportMode]);

  // Export selections are limited to the current filters, across all pages.
  const selectedProfiles = filtered.filter((client) => selectedIds.includes(client.id));

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

    <div className="artworks-layout">

      <main className="min-w-0">
        {exportMode && <Link href="/clients" className="mb-6 inline-block text-sm">← Back to clients</Link>}
        {exportMode && <h1 className="mb-5 text-2xl font-bold">Export Client Profiles</h1>}
        {exportMode && <section aria-label="Export client profiles" className="mb-6 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={vipOnly} onChange={(event) => { setVipOnly(event.target.checked); setCurrentPage(1); }} />
            VIP only
          </label>
          <button type="button" disabled={loading || !filtered.length} className="border px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => setSelectedIds(filtered.map((client) => client.id))}>
            Select all matching ({filtered.length})
          </button>
          <button type="button" disabled={!selectedIds.length} className="border px-3 py-2 text-sm disabled:opacity-40" onClick={() => setSelectedIds([])}>
            Clear selection
          </button>
          <button type="button" disabled={loading || exporting || !selectedProfiles.length}
            className="border border-[#9c1515] bg-[#9c1515] px-3 py-2 text-sm text-white disabled:opacity-40"
            onClick={() => exportProfiles(selectedProfiles)}>
            {exporting ? "Exporting..." : `Export selected to Excel (${selectedProfiles.length})`}
          </button>
          
        </section>}
        {message && (
          <p style={{ marginBottom: "20px", color: "#9c1515" }}>{message}</p>
        )}

        {loading ? <p>Loading clients...</p> : filtered.length === 0 ? (
          <p>No clients found.</p>
        ) : (

          <div
            className="artworks-grid artwork-catalog-grid"
            style={{ gridAutoRows: "1fr", alignItems: "stretch" }}
          >

            {visibleClients.map((client) => (
              <div
                key={client.id}
                role={exportMode ? "checkbox" : undefined}
                aria-checked={exportMode ? selectedIds.includes(client.id) : undefined}
                aria-label={exportMode ? `Select ${client.name}` : undefined}
                tabIndex={exportMode ? 0 : undefined}
                onClick={exportMode ? () => setSelectedIds((ids) => ids.includes(client.id) ? ids.filter((id) => id !== client.id) : [...ids, client.id]) : undefined}
                onKeyDown={exportMode ? (event) => {
                  if (event.key === " " || event.key === "Enter") {
                    event.preventDefault();
                    setSelectedIds((ids) => ids.includes(client.id) ? ids.filter((id) => id !== client.id) : [...ids, client.id]);
                  }
                } : undefined}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c1515]"
                style={{
                  cursor: exportMode ? "pointer" : undefined,
                  boxShadow: exportMode && selectedIds.includes(client.id) ? "inset 0 0 0 2px #9c1515" : undefined,
                  minWidth: 0,
                  overflowWrap: "anywhere",
                  textDecoration: "none",
                  color: client.is_vip ? "#000000" : "inherit",
                  padding: "20px",
                  background: client.is_vip ? "#f0e9d7" : client.is_interior_designer ? "#cad3b9" : "#ececec",
                }}
              >
                {exportMode && <div aria-hidden="true" className="mb-3 flex items-center gap-2 text-sm">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center border ${selectedIds.includes(client.id) ? "border-[#9c1515] bg-[#9c1515] text-white" : "border-gray-400 bg-white"}`}>
                    {selectedIds.includes(client.id) ? "✓" : ""}
                  </span>
                  {selectedIds.includes(client.id) ? "Selected" : "Select profile"}
                </div>}
                <ProfileContent href={exportMode ? null : `/clients/${client.id}`}>
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
                    color: client.is_vip ? "#000000" : "#555",
                  }}
                >
                  Purchased Works: {client.artworks?.length || 0}
                </p>
                </ProfileContent>
              </div>
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
        showClientExport={!exportMode}
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
