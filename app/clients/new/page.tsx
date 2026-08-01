"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ArtworkOption = {
  id: number;
  artist_name: string | null;
  title_en: string | null;
  title_jp: string | null;
  year: string | null;
  is_sold: boolean;
  buyer_id: number | null;
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #bdbdbd",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box" as const,
};

export default function NewClientPage() {
  const supabase = createClient();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [artworks, setArtworks] = useState<ArtworkOption[]>([]);
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<number[]>([]);
  const [artworkSearch, setArtworkSearch] = useState("");

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingArtworks, setLoadingArtworks] = useState(true);

  useEffect(() => {
    async function loadArtworks() {
      const { data, error } = await supabase
        .from("artworks")
        .select(`
          id,
          artist_name,
          title_en,
          title_jp,
          year,
          is_sold,
          buyer_id
        `)
        .order("artist_name", { ascending: true });

      if (error) {
        setMessage(error.message);
        setLoadingArtworks(false);
        return;
      }

      setArtworks(data || []);
      setLoadingArtworks(false);
    }

    loadArtworks();
  }, []);

  function toggleArtwork(artworkId: number) {
    setSelectedArtworkIds((current) => {
      if (current.includes(artworkId)) {
        return current.filter((id) => id !== artworkId);
      }

      return [...current, artworkId];
    });
  }

  async function addClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage("Client name is required.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const { data: newClient, error: clientError } = await supabase
      .from("customers")
      .insert([
        {
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          notes: form.notes.trim() || null,
        },
      ])
      .select("id")
      .single();

    if (clientError || !newClient) {
      setMessage(clientError?.message || "Could not create client.");
      setSubmitting(false);
      return;
    }

    if (selectedArtworkIds.length > 0) {
      const { error: artworkError } = await supabase
        .from("artworks")
        .update({
          buyer_id: newClient.id,
          is_sold: true,
        })
        .in("id", selectedArtworkIds);

      if (artworkError) {
        setMessage(
          `Client was created, but purchased works could not be linked: ${artworkError.message}`
        );
        setSubmitting(false);
        return;
      }
    }

    router.push(`/customers/${newClient.id}`);
    router.refresh();
  }

  const filteredArtworks = artworks.filter((artwork) => {
    const search = artworkSearch.trim().toLowerCase();

    if (!search) return true;

    const artistName = artwork.artist_name?.toLowerCase() || "";
    const titleEn = artwork.title_en?.toLowerCase() || "";
    const titleJp = artwork.title_jp?.toLowerCase() || "";
    const year = artwork.year?.toLowerCase() || "";

    return (
      artistName.includes(search) ||
      titleEn.includes(search) ||
      titleJp.includes(search) ||
      year.includes(search)
    );
  });

  return (
    <main
      style={{
        width: "100%",
        maxWidth: "760px",
        margin: "0 auto",
        padding: "48px 72px",
      }}
    >
      <Link
        href="/clients"
        style={{
          display: "inline-block",
          color: "black",
          textDecoration: "none",
          fontSize: "14px",
          marginBottom: "32px",
        }}
      >
        ← Back to clients
      </Link>

      <h1
        style={{
          margin: "0 0 28px 0",
          fontSize: "32px",
        }}
      >
        Add Client
      </h1>

      <form
        onSubmit={addClient}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <FormField label="Client Name">
          <input
            type="text"
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
            style={inputStyle}
            required
          />
        </FormField>

        <FormField label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            style={inputStyle}
          />
        </FormField>

        <FormField label="Phone">
          <input
            type="text"
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
            style={inputStyle}
          />
        </FormField>

        <FormField label="Address">
          <textarea
            value={form.address}
            onChange={(event) =>
              setForm({ ...form, address: event.target.value })
            }
            style={{
              ...inputStyle,
              minHeight: "90px",
              resize: "vertical",
            }}
          />
        </FormField>

        <FormField label="Notes">
          <textarea
            value={form.notes}
            onChange={(event) =>
              setForm({ ...form, notes: event.target.value })
            }
            style={{
              ...inputStyle,
              minHeight: "120px",
              resize: "vertical",
            }}
          />
        </FormField>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <label
              style={{
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Purchased Works
            </label>

            <span
              style={{
                fontSize: "12px",
                color: "#555",
              }}
            >
              {selectedArtworkIds.length} selected
            </span>
          </div>

          <input
            type="text"
            placeholder="Search artwork, artist, or year"
            value={artworkSearch}
            onChange={(event) => setArtworkSearch(event.target.value)}
            style={{
              ...inputStyle,
              marginBottom: "8px",
            }}
          />

          <div
            style={{
              maxHeight: "320px",
              overflowY: "auto",
              border: "1px solid #bdbdbd",
              background: "white",
            }}
          >
            {loadingArtworks ? (
              <p style={{ margin: 0, padding: "14px", fontSize: "14px" }}>
                Loading artworks...
              </p>
            ) : filteredArtworks.length === 0 ? (
              <p style={{ margin: 0, padding: "14px", fontSize: "14px" }}>
                No artworks found.
              </p>
            ) : (
              filteredArtworks.map((artwork) => {
                const selected = selectedArtworkIds.includes(artwork.id);
                const title =
                  artwork.title_en ||
                  artwork.title_jp ||
                  `Artwork ${artwork.id}`;

                return (
                  <label
                    key={artwork.id}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      padding: "12px 14px",
                      borderBottom: "1px solid #e5e5e5",
                      background: selected ? "#faf1f1" : "white",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleArtwork(artwork.id)}
                      style={{ marginTop: "3px" }}
                    />

                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: "0 0 3px 0",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {title}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#555",
                        }}
                      >
                        {[artwork.artist_name, artwork.year]
                          .filter(Boolean)
                          .join(", ")}
                      </p>

                      {artwork.is_sold && (
                        <p
                          style={{
                            margin: "5px 0 0 0",
                            fontSize: "12px",
                            color: "#9c1515",
                          }}
                        >
                          Currently marked as sold
                        </p>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "12px",
              color: "#666",
            }}
          >
            Selected works will be marked as Sold and linked to this client.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: "6px",
            padding: "11px 14px",
            border: "1px solid #9c1515",
            background: "#9c1515",
            color: "white",
            cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.6 : 1,
            fontSize: "14px",
          }}
        >
          {submitting ? "Saving..." : "Add Client"}
        </button>

        {message && (
          <p
            style={{
              margin: 0,
              color: "#9c1515",
              fontSize: "14px",
            }}
          >
            {message}
          </p>
        )}
      </form>
    </main>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "6px",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}