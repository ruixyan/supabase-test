"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

type Artwork = {
  id: number;
  artist_name: string | null;
  title_jp: string | null;
  title_en: string | null;
  artwork_photo_url: string | null;
  year: string | null;
  material: string | null;
  dimensions: string | null;
  buyer_id: number | null;
  is_sold: boolean;
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #bdbdbd",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box" as const,
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = Number(params.id);
  const supabase = createClient();

  const [client, setClient] = useState<Customer | null>(null);
  const [ownedArtworks, setOwnedArtworks] = useState<Artwork[]>([]);
  const [availableArtworks, setAvailableArtworks] = useState<Artwork[]>([]);

  const [selectedArtworkIds, setSelectedArtworkIds] = useState<number[]>([]);
  const [originalArtworkIds, setOriginalArtworkIds] = useState<number[]>([]);

  const [artworkSearch, setArtworkSearch] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  async function loadClient() {
    if (Number.isNaN(clientId)) {
      setMessage("Invalid client ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: clientData, error: clientError } = await supabase
      .from("customers")
      .select("id, name, email, phone, address, notes")
      .eq("id", clientId)
      .maybeSingle();

    if (clientError) {
      setMessage(clientError.message);
      setLoading(false);
      return;
    }

    if (!clientData) {
      setMessage("Client not found.");
      setLoading(false);
      return;
    }

    const { data: ownedData, error: ownedError } = await supabase
      .from("artworks")
      .select(`
        id,
        artist_name,
        title_jp,
        title_en,
        artwork_photo_url,
        year,
        material,
        dimensions,
        buyer_id,
        is_sold
      `)
      .eq("buyer_id", clientId)
      .order("created_at", { ascending: false });

    if (ownedError) {
      setMessage(ownedError.message);
      setLoading(false);
      return;
    }

    /*
      只载入：
      1. 当前 Client 已经拥有的作品
      2. 目前没有 buyer 的作品

      这样不会误把其他 Client 的作品转移过来。
    */
    const { data: selectableData, error: selectableError } = await supabase
      .from("artworks")
      .select(`
        id,
        artist_name,
        title_jp,
        title_en,
        artwork_photo_url,
        year,
        material,
        dimensions,
        buyer_id,
        is_sold
      `)
      .or(`buyer_id.is.null,buyer_id.eq.${clientId}`)
      .order("artist_name", { ascending: true });

    if (selectableError) {
      setMessage(selectableError.message);
      setLoading(false);
      return;
    }

    const ownedIds = (ownedData || []).map((artwork) => artwork.id);

    setClient(clientData);
    setOwnedArtworks(ownedData || []);
    setAvailableArtworks(selectableData || []);
    setSelectedArtworkIds(ownedIds);
    setOriginalArtworkIds(ownedIds);

    setForm({
      name: clientData.name || "",
      email: clientData.email || "",
      phone: clientData.phone || "",
      address: clientData.address || "",
      notes: clientData.notes || "",
    });

    setLoading(false);
  }

  useEffect(() => {
    loadClient();
  }, [clientId]);

  function toggleArtwork(artworkId: number) {
    setSelectedArtworkIds((current) => {
      if (current.includes(artworkId)) {
        return current.filter((id) => id !== artworkId);
      }

      return [...current, artworkId];
    });
  }

  function cancelEditing() {
    if (!client) return;

    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });

    setSelectedArtworkIds(originalArtworkIds);
    setArtworkSearch("");
    setMessage("");
    setIsEditing(false);
  }

  async function saveClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setMessage("Client name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error: clientError } = await supabase
      .from("customers")
      .update({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      })
      .eq("id", clientId);

    if (clientError) {
      setMessage(clientError.message);
      setSaving(false);
      return;
    }

    const removedArtworkIds = originalArtworkIds.filter(
      (id) => !selectedArtworkIds.includes(id)
    );

    const addedArtworkIds = selectedArtworkIds.filter(
      (id) => !originalArtworkIds.includes(id)
    );

    /*
      先把取消选择的作品恢复为 Available。
      buyer_id 必须和 is_sold 同时更新，避免触发 constraint。
    */
    if (removedArtworkIds.length > 0) {
      const { error: removedError } = await supabase
        .from("artworks")
        .update({
          buyer_id: null,
          is_sold: false,
        })
        .in("id", removedArtworkIds);

      if (removedError) {
        setMessage(
          `Client information was updated, but some works could not be removed: ${removedError.message}`
        );
        setSaving(false);
        return;
      }
    }

    /*
      再把新选择的作品关联到当前 Client，并设为 Sold。
    */
    if (addedArtworkIds.length > 0) {
      const { error: addedError } = await supabase
        .from("artworks")
        .update({
          buyer_id: clientId,
          is_sold: true,
        })
        .in("id", addedArtworkIds);

      if (addedError) {
        setMessage(
          `Client information was updated, but some works could not be linked: ${addedError.message}`
        );
        setSaving(false);
        return;
      }
    }

    await loadClient();

    setIsEditing(false);
    setSaving(false);
    setMessage("Client updated.");
  }

  const filteredArtworkOptions = availableArtworks.filter((artwork) => {
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

  if (loading) {
    return (
      <main style={{ padding: "48px 72px" }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (!client) {
    return (
      <main style={{ padding: "48px 72px" }}>
        <p>{message || "Client not found."}</p>

        <Link
          href="/clients"
          style={{
            color: "black",
            textDecoration: "none",
          }}
        >
          ← Back to clients
        </Link>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "48px 72px",
        maxWidth: "1400px",
        margin: "0 auto",
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

      {!isEditing ? (
        <section
          style={{
            marginBottom: "56px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "24px",
            }}
          >
            <div>
              <h1
                style={{
                  margin: "0 0 20px 0",
                  fontSize: "32px",
                }}
              >
                {client.name}
              </h1>

              {client.email && (
                <p>
                  <strong>Email:</strong> {client.email}
                </p>
              )}

              {client.phone && (
                <p>
                  <strong>Phone:</strong> {client.phone}
                </p>
              )}

              {client.address && (
                <p style={{ whiteSpace: "pre-wrap" }}>
                  <strong>Address:</strong> {client.address}
                </p>
              )}

              {client.notes && (
                <p style={{ whiteSpace: "pre-wrap" }}>
                  <strong>Notes:</strong> {client.notes}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setMessage("");
                setIsEditing(true);
              }}
              style={{
                padding: "10px 16px",
                border: "1px solid #9c1515",
                background: "#9c1515",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Edit Client
            </button>
          </div>

          {message && (
            <p
              style={{
                marginTop: "20px",
                color: message === "Client updated." ? "#444" : "#9c1515",
                fontSize: "14px",
              }}
            >
              {message}
            </p>
          )}
        </section>
      ) : (
        <section
          style={{
            maxWidth: "760px",
            marginBottom: "64px",
            padding: "24px",
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <h1
            style={{
              margin: "0 0 24px 0",
              fontSize: "28px",
            }}
          >
            Edit Client
          </h1>

          <form
            onSubmit={saveClient}
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
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
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
                  setForm({
                    ...form,
                    email: event.target.value,
                  })
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Phone">
              <input
                type="text"
                value={form.phone}
                onChange={(event) =>
                  setForm({
                    ...form,
                    phone: event.target.value,
                  })
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Address">
              <textarea
                value={form.address}
                onChange={(event) =>
                  setForm({
                    ...form,
                    address: event.target.value,
                  })
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
                  setForm({
                    ...form,
                    notes: event.target.value,
                  })
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
                  maxHeight: "340px",
                  overflowY: "auto",
                  border: "1px solid #bdbdbd",
                  background: "white",
                }}
              >
                {filteredArtworkOptions.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      padding: "14px",
                      fontSize: "14px",
                    }}
                  >
                    No artworks found.
                  </p>
                ) : (
                  filteredArtworkOptions.map((artwork) => {
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
                          style={{
                            marginTop: "3px",
                          }}
                        />

                        <div>
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
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "6px",
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "11px 16px",
                  border: "1px solid #9c1515",
                  background: "#9c1515",
                  color: "white",
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.6 : 1,
                  fontSize: "14px",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={cancelEditing}
                style={{
                  padding: "11px 16px",
                  border: "1px solid #bdbdbd",
                  background: "white",
                  color: "black",
                  cursor: saving ? "default" : "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
            </div>

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
        </section>
      )}

      <section>
        <h2
          style={{
            margin: "0 0 28px 0",
            fontSize: "26px",
          }}
        >
          Purchased Works
        </h2>

        {ownedArtworks.length === 0 ? (
          <p>No purchased artworks found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
              gap: "56px 48px",
            }}
          >
            {ownedArtworks.map((artwork) => (
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
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1",
                      marginBottom: "18px",
                      overflow: "hidden",
                      background: "#f3f3f3",
                    }}
                  >
                    <Image
                      src={artwork.artwork_photo_url}
                      alt={
                        artwork.title_en ||
                        artwork.title_jp ||
                        "Artwork image"
                      }
                      fill
                      style={{
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

                <p
                  style={{
                    margin: "0 0 3px 0",
                    fontWeight: 600,
                  }}
                >
                  {artwork.title_en || artwork.title_jp}
                </p>

                {artwork.title_en && artwork.title_jp && (
                  <p
                    style={{
                      margin: "0 0 3px 0",
                      fontSize: "14px",
                    }}
                  >
                    {artwork.title_jp}
                  </p>
                )}

                {artwork.year && (
                  <p
                    style={{
                      margin: "0 0 3px 0",
                      fontSize: "14px",
                    }}
                  >
                    {artwork.year}
                  </p>
                )}

                {artwork.material && (
                  <p
                    style={{
                      margin: "0 0 3px 0",
                      fontSize: "14px",
                    }}
                  >
                    {artwork.material}
                  </p>
                )}

                {artwork.dimensions && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                    }}
                  >
                    {artwork.dimensions}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
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