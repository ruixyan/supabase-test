"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

type Artist = {
  id: number;
  name: string | null;
  name_en: string | null;
  name_jp: string | null;
  artist_photo_url: string | null;
  bio: string | null;
  nationality: string | null;
  birth_year: string | null;
  selected_exhibitions: string | null;
  selected_public_collections: string | null;
  contact_info: string | null;
};

type Artwork = {
  id: number;
  artist_id: number | null;
  artist_name: string | null;
  title_jp: string | null;
  title_en: string | null;
  artwork_photo_url: string | null;
  year: string | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;
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

export default function ArtistDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const supabase = createClient();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectableArtworks, setSelectableArtworks] = useState<Artwork[]>([]);

  const [selectedArtworkIds, setSelectedArtworkIds] = useState<number[]>([]);
  const [originalArtworkIds, setOriginalArtworkIds] = useState<number[]>([]);

  const [artworkSearchText, setArtworkSearchText] = useState("");
  const [message, setMessage] = useState("Loading...");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    name_en: "",
    name_jp: "",
    artist_photo_url: "",
    bio: "",
    nationality: "",
    birth_year: "",
    selected_exhibitions: "",
    selected_public_collections: "",
    contact_info: "",
  });

  async function loadArtistAndWorks() {
    if (Number.isNaN(id)) {
      setMessage("Invalid artist ID.");
      return;
    }

    setMessage("Loading...");

    const { data: artistData, error: artistError } = await supabase
      .from("artists")
      .select(`
        id,
        name,
        name_en,
        name_jp,
        artist_photo_url,
        bio,
        nationality,
        birth_year,
        selected_exhibitions,
        selected_public_collections,
        contact_info
      `)
      .eq("id", id)
      .maybeSingle();

    if (artistError) {
      setMessage(artistError.message);
      return;
    }

    if (!artistData) {
      setMessage("Artist not found.");
      return;
    }

    const { data: artworkData, error: artworkError } = await supabase
      .from("artworks")
      .select(`
        id,
        artist_id,
        artist_name,
        title_jp,
        title_en,
        artwork_photo_url,
        year,
        material,
        dimensions,
        category,
        is_sold
      `)
      .eq("artist_id", id)
      .order("created_at", { ascending: false });

    if (artworkError) {
      setMessage(artworkError.message);
      return;
    }

    const { data: selectableData, error: selectableError } = await supabase
      .from("artworks")
      .select(`
        id,
        artist_id,
        artist_name,
        title_jp,
        title_en,
        artwork_photo_url,
        year,
        material,
        dimensions,
        category,
        is_sold
      `)
      .or(`artist_id.is.null,artist_id.eq.${id}`)
      .order("created_at", { ascending: false });

    if (selectableError) {
      setMessage(selectableError.message);
      return;
    }

    const currentArtworkIds = (artworkData || []).map(
      (artwork) => artwork.id
    );

    setArtist(artistData);
    setArtworks(artworkData || []);
    setSelectableArtworks(selectableData || []);
    setSelectedArtworkIds(currentArtworkIds);
    setOriginalArtworkIds(currentArtworkIds);

    setForm({
      name: artistData.name || "",
      name_en: artistData.name_en || "",
      name_jp: artistData.name_jp || "",
      artist_photo_url: artistData.artist_photo_url || "",
      bio: artistData.bio || "",
      nationality: artistData.nationality || "",
      birth_year: artistData.birth_year || "",
      selected_exhibitions: artistData.selected_exhibitions || "",
      selected_public_collections:
        artistData.selected_public_collections || "",
      contact_info: artistData.contact_info || "",
    });

    setMessage("");
  }

  useEffect(() => {
    loadArtistAndWorks();
  }, [id]);

  function toggleArtwork(artworkId: number) {
    setSelectedArtworkIds((current) => {
      if (current.includes(artworkId)) {
        return current.filter((currentId) => currentId !== artworkId);
      }

      return [...current, artworkId];
    });
  }

  function cancelEditing() {
    if (!artist) return;

    setForm({
      name: artist.name || "",
      name_en: artist.name_en || "",
      name_jp: artist.name_jp || "",
      artist_photo_url: artist.artist_photo_url || "",
      bio: artist.bio || "",
      nationality: artist.nationality || "",
      birth_year: artist.birth_year || "",
      selected_exhibitions: artist.selected_exhibitions || "",
      selected_public_collections:
        artist.selected_public_collections || "",
      contact_info: artist.contact_info || "",
    });

    setSelectedArtworkIds(originalArtworkIds);
    setArtworkSearchText("");
    setMessage("");
    setIsEditing(false);
  }

  async function saveArtist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const displayName =
      form.name_en.trim() ||
      form.name.trim() ||
      form.name_jp.trim();

    if (!displayName) {
      setMessage("At least one artist name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    const artistPhotoUrl =
      form.artist_photo_url.trim() || null;

    const { error: artistError } = await supabase
      .from("artists")
      .update({
        name: form.name.trim() || null,
        name_en: form.name_en.trim() || null,
        name_jp: form.name_jp.trim() || null,
        artist_photo_url: artistPhotoUrl,
        bio: form.bio.trim() || null,
        nationality: form.nationality.trim() || null,
        birth_year: form.birth_year.trim() || null,
        selected_exhibitions:
          form.selected_exhibitions.trim() || null,
        selected_public_collections:
          form.selected_public_collections.trim() || null,
        contact_info: form.contact_info.trim() || null,
      })
      .eq("id", id);

    if (artistError) {
      setMessage(artistError.message);
      setSaving(false);
      return;
    }

    const removedArtworkIds = originalArtworkIds.filter(
      (artworkId) => !selectedArtworkIds.includes(artworkId)
    );

    const addedArtworkIds = selectedArtworkIds.filter(
      (artworkId) => !originalArtworkIds.includes(artworkId)
    );

    if (removedArtworkIds.length > 0) {
      const { error: removedError } = await supabase
        .from("artworks")
        .update({
          artist_id: null,
          artist_name: null,
          artist_photo_url: null,
        })
        .in("id", removedArtworkIds);

      if (removedError) {
        setMessage(
          `Artist information was updated, but some artworks could not be removed: ${removedError.message}`
        );
        setSaving(false);
        return;
      }
    }

    if (addedArtworkIds.length > 0) {
      const { error: addedError } = await supabase
        .from("artworks")
        .update({
          artist_id: id,
          artist_name: displayName,
          artist_photo_url: artistPhotoUrl,
        })
        .in("id", addedArtworkIds);

      if (addedError) {
        setMessage(
          `Artist information was updated, but some artworks could not be linked: ${addedError.message}`
        );
        setSaving(false);
        return;
      }
    }

    /*
      如果 artist 名字或照片被修改，
      已经属于该 artist 的所有作品也一起同步。
    */
    const { error: syncError } = await supabase
      .from("artworks")
      .update({
        artist_name: displayName,
        artist_photo_url: artistPhotoUrl,
      })
      .eq("artist_id", id);

    if (syncError) {
      setMessage(
        `Artist was updated, but artwork artist information could not be synchronized: ${syncError.message}`
      );
      setSaving(false);
      return;
    }

    await loadArtistAndWorks();

    setIsEditing(false);
    setSaving(false);
    setMessage("Artist updated.");
  }

  const filteredSelectableArtworks = selectableArtworks.filter(
    (artwork) => {
      const search = artworkSearchText.trim().toLowerCase();

      if (!search) return true;

      const titleEn = artwork.title_en?.toLowerCase() || "";
      const titleJp = artwork.title_jp?.toLowerCase() || "";
      const artistName = artwork.artist_name?.toLowerCase() || "";
      const year = artwork.year?.toLowerCase() || "";
      const category = artwork.category?.toLowerCase() || "";

      return (
        titleEn.includes(search) ||
        titleJp.includes(search) ||
        artistName.includes(search) ||
        year.includes(search) ||
        category.includes(search)
      );
    }
  );

  if (message === "Loading...") {
    return (
      <main style={{ padding: "48px 72px" }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (!artist) {
    return (
      <main style={{ padding: "48px 72px" }}>
        <p>{message || "Artist not found."}</p>

        <Link
          href="/artists"
          style={{
            color: "#9c1515",
            textDecoration: "none",
          }}
        >
          ← Back to artists
        </Link>
      </main>
    );
  }

  const displayName =
    artist.name_en ||
    artist.name ||
    artist.name_jp ||
    "Untitled Artist";

  return (
    <main className="artist-detail-main">
      <Link
        href="/artists"
        style={{
          display: "inline-block",
          color: "#9c1515",
          textDecoration: "none",
          marginBottom: "32px"
        }}
      >
        ← Back to artists
      </Link>

      {!isEditing ? (
        <>
          <section className="artist-detail-grid">
            <div>
              {artist.artist_photo_url && (
                <div
                  // style={{
                  //   position: "relative",
                  //   width: "320px",
                  //   height: "320px",
                  //   background: "#f3f3f3",
                  // }}
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1 / 1",
                    background: "#f3f3f3",
                  }}
                >
                  <Image
                    src={artist.artist_photo_url}
                    alt={displayName}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "24px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <h1 style={{ marginTop: 0, fontSize: "24px", fontWeight: 700 }}>{displayName}</h1>

                  {artist.name_jp &&
                    artist.name_jp !== displayName && (
                      <p style={{ marginTop: 0, fontSize: "24px", fontWeight: 700, color: "#666" }}>{artist.name_jp}</p>
                    )}

                  {/* {(artist.nationality || artist.birth_year) && (
                    <p>
                      {[artist.nationality, artist.birth_year]
                        .filter(Boolean)
                        .join(", b. ")}
                    </p>
                  )} */}
                  <h3 style={{ marginTop: 0, fontSize: "16px", fontWeight: 400, color: "#666" }}>{"b. " + artist.birth_year}</h3>

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
                    flexShrink: 0,
                  }}
                >
                  Edit Artist
                </button>
              </div>

              {artist.bio && (
                <div>
                <h3 style ={{ marginBottom: "8px", fontSize: "16px", fontWeight: 600}}>Description</h3>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  {artist.bio}
                </p>
              </div>
              )}

              {/* {artist.selected_exhibitions && (
                <div style={{ marginTop: "28px" }}>
                  <h3>Selected Exhibitions</h3>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {artist.selected_exhibitions}
                  </p>
                </div>
              )} */}

              {artist.selected_public_collections && (
                <div style={{ marginTop: "28px" }}>
                  <h3 style ={{ marginBottom: "12px", fontSize: "16px", fontWeight: 600}}>Selected Public Collections</h3>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {artist.selected_public_collections}
                  </p>
                </div>
              )}

              {artist.contact_info && (
                <div style={{ marginTop: "28px" }}>
                  <h3 style={{fontWeight: "600"}}>Contact Information</h3>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {artist.contact_info}
                  </p>
                </div>
              )}

              {message && (
                <p
                  style={{
                    marginTop: "20px",
                    color:
                      message === "Artist updated."
                        ? "#444"
                        : "#9c1515",
                  }}
                >
                  {message}
                </p>
              )}
            </div>
          </section>
        </>
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
          <h1 style={{ margin: "0 0 24px 0" }}>Edit Artist</h1>

          <form
            onSubmit={saveArtist}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <FormField label="Name">
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
              />
            </FormField>

            <FormField label="English Name">
              <input
                type="text"
                value={form.name_en}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name_en: event.target.value,
                  })
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Japanese Name">
              <input
                type="text"
                value={form.name_jp}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name_jp: event.target.value,
                  })
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Artist Photo URL">
              <input
                type="url"
                value={form.artist_photo_url}
                onChange={(event) =>
                  setForm({
                    ...form,
                    artist_photo_url: event.target.value,
                  })
                }
                placeholder="https://..."
                style={inputStyle}
              />
            </FormField>

            <FormField label="Nationality">
              <input
                type="text"
                value={form.nationality}
                onChange={(event) =>
                  setForm({
                    ...form,
                    nationality: event.target.value,
                  })
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Birth Year">
              <input
                type="text"
                value={form.birth_year}
                onChange={(event) =>
                  setForm({
                    ...form,
                    birth_year: event.target.value,
                  })
                }
                style={inputStyle}
              />
            </FormField>

            <FormField label="Bio">
              <textarea
                value={form.bio}
                onChange={(event) =>
                  setForm({
                    ...form,
                    bio: event.target.value,
                  })
                }
                style={{
                  ...inputStyle,
                  minHeight: "160px",
                  resize: "vertical",
                }}
              />
            </FormField>

            <FormField label="Selected Exhibitions">
              <textarea
                value={form.selected_exhibitions}
                onChange={(event) =>
                  setForm({
                    ...form,
                    selected_exhibitions: event.target.value,
                  })
                }
                style={{
                  ...inputStyle,
                  minHeight: "130px",
                  resize: "vertical",
                }}
              />
            </FormField>

            <FormField label="Selected Public Collections">
              <textarea
                value={form.selected_public_collections}
                onChange={(event) =>
                  setForm({
                    ...form,
                    selected_public_collections:
                      event.target.value,
                  })
                }
                style={{
                  ...inputStyle,
                  minHeight: "130px",
                  resize: "vertical",
                }}
              />
            </FormField>

            <FormField label="Contact Information">
              <textarea
                value={form.contact_info}
                onChange={(event) =>
                  setForm({
                    ...form,
                    contact_info: event.target.value,
                  })
                }
                style={{
                  ...inputStyle,
                  minHeight: "100px",
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
                  Registered Artworks
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
                placeholder="Search artwork, artist, year, or category"
                value={artworkSearchText}
                onChange={(event) =>
                  setArtworkSearchText(event.target.value)
                }
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
                {filteredSelectableArtworks.length === 0 ? (
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
                  filteredSelectableArtworks.map((artwork) => {
                    const selected =
                      selectedArtworkIds.includes(artwork.id);

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
                          background: selected
                            ? "#faf1f1"
                            : "white",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleArtwork(artwork.id)
                          }
                          style={{ marginTop: "3px" }}
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

                          {artwork.title_en &&
                            artwork.title_jp && (
                              <p
                                style={{
                                  margin: "0 0 3px 0",
                                  fontSize: "13px",
                                }}
                              >
                                {artwork.title_jp}
                              </p>
                            )}

                          <p
                            style={{
                              margin: 0,
                              fontSize: "13px",
                              color: "#555",
                            }}
                          >
                            {[
                              artwork.artist_name,
                              artwork.year,
                              artwork.category,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
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
                Deselected works will become unassigned.
              </p>
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

      <section style={{ borderTop: "1px solid #ddd" }}>
        <h2 style={{ marginTop: "16px",marginBottom: "32px", fontSize: "24px", fontWeight: 600 }}>Works</h2>

        {artworks.length === 0 ? (
          <p>No artworks found for this artist.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(220px, 1fr))",
              gap: "56px 48px",
              alignItems: "start",
            }}
          >
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
                      src={artwork.artwork_photo_url}
                      alt={
                        artwork.title_en ||
                        artwork.title_jp ||
                        "Artwork image"
                      }
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}

                <p
                  style={{
                    margin: "0 0 2px 0",
                    fontSize: "15px",
                    fontWeight: 600,
                  }}
                >
                  {artwork.title_en || artwork.title_jp}
                </p>

                {artwork.title_jp && artwork.title_en && (
                  <p
                    style={{
                      margin: "0 0 2px 0",
                      fontSize: "14px",
                      color: "#555",
                    }}
                  >
                    {artwork.title_jp}
                  </p>
                )}

                {artwork.year && (
                  <p
                    style={{
                      margin: "0 0 2px 0",
                      fontSize: "14px",
                    }}
                  >
                    {artwork.year}
                  </p>
                )}

                {artwork.material && (
                  <p
                    style={{
                      margin: "0 0 2px 0",
                      fontSize: "14px",
                    }}
                  >
                    {artwork.material}
                  </p>
                )}

                {artwork.dimensions && (
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "14px",
                    }}
                  >
                    {artwork.dimensions}
                  </p>
                )}

                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    border: "1px solid #bdbdbd",
                    fontSize: "13px",
                    color: artwork.is_sold
                      ? "#9c1515"
                      : "#444",
                  }}
                >
                  {artwork.is_sold ? "Sold" : "Available"}
                </span>
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