"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ArtworkOption = {
  id: number;
  artist_id: number | null;
  artist_name: string | null;
  title_en: string | null;
  title_jp: string | null;
  year: string | null;
  category: string | null;
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #bdbdbd",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box" as const,
};

export default function NewArtistPage() {
  const supabase = createClient();
  const router = useRouter();

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

  const [artworks, setArtworks] = useState<ArtworkOption[]>([]);
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<number[]>([]);
  const [artworkSearchText, setArtworkSearchText] = useState("");

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingArtworks, setLoadingArtworks] = useState(true);

  useEffect(() => {
    async function loadAvailableArtworks() {
      const { data, error } = await supabase
        .from("artworks")
        .select(`
          id,
          artist_id,
          artist_name,
          title_en,
          title_jp,
          year,
          category
        `)
        .is("artist_id", null)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        setLoadingArtworks(false);
        return;
      }

      setArtworks(data || []);
      setLoadingArtworks(false);
    }

    loadAvailableArtworks();
  }, []);

  function toggleArtwork(artworkId: number) {
    setSelectedArtworkIds((current) => {
      if (current.includes(artworkId)) {
        return current.filter((id) => id !== artworkId);
      }

      return [...current, artworkId];
    });
  }

  async function addArtist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const displayName =
      form.name_en.trim() ||
      form.name.trim() ||
      form.name_jp.trim();

    if (!displayName) {
      setMessage("At least one artist name is required.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const { data: newArtist, error: artistError } = await supabase
      .from("artists")
      .insert([
        {
          name: form.name.trim() || null,
          name_en: form.name_en.trim() || null,
          name_jp: form.name_jp.trim() || null,
          artist_photo_url: form.artist_photo_url.trim() || null,
          bio: form.bio.trim() || null,
          nationality: form.nationality.trim() || null,
          birth_year: form.birth_year.trim() || null,
          selected_exhibitions:
            form.selected_exhibitions.trim() || null,
          selected_public_collections:
            form.selected_public_collections.trim() || null,
          contact_info: form.contact_info.trim() || null,
        },
      ])
      .select("id")
      .single();

    if (artistError || !newArtist) {
      setMessage(artistError?.message || "Artist could not be created.");
      setSubmitting(false);
      return;
    }

    if (selectedArtworkIds.length > 0) {
      const { error: artworkError } = await supabase
        .from("artworks")
        .update({
          artist_id: newArtist.id,
          artist_name: displayName,
          artist_photo_url: form.artist_photo_url.trim() || null,
        })
        .in("id", selectedArtworkIds);

      if (artworkError) {
        setMessage(
          `Artist was created, but the selected artworks could not be linked: ${artworkError.message}`
        );
        setSubmitting(false);
        return;
      }
    }

    router.push(`/artists/${newArtist.id}`);
    router.refresh();
  }

  const filteredArtworks = artworks.filter((artwork) => {
    const search = artworkSearchText.trim().toLowerCase();

    if (!search) {
      return true;
    }

    const titleEn = artwork.title_en?.toLowerCase() || "";
    const titleJp = artwork.title_jp?.toLowerCase() || "";
    const existingArtistName = artwork.artist_name?.toLowerCase() || "";
    const year = artwork.year?.toLowerCase() || "";
    const category = artwork.category?.toLowerCase() || "";

    return (
      titleEn.includes(search) ||
      titleJp.includes(search) ||
      existingArtistName.includes(search) ||
      year.includes(search) ||
      category.includes(search)
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
        href="/artists"
        style={{
          display: "inline-block",
          color: "black",
          textDecoration: "none",
          fontSize: "14px",
          marginBottom: "32px",
        }}
      >
        ← Back to artists
      </Link>

      <h1
        style={{
          margin: "0 0 28px 0",
          fontSize: "32px",
        }}
      >
        Add Artist
      </h1>

      <form
        onSubmit={addArtist}
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
            style={inputStyle}
            placeholder="https://..."
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
                selected_public_collections: event.target.value,
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
            placeholder="Search artwork, existing artist name, year, or category"
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
            {loadingArtworks ? (
              <p
                style={{
                  margin: 0,
                  padding: "14px",
                  fontSize: "14px",
                }}
              >
                Loading artworks...
              </p>
            ) : filteredArtworks.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  padding: "14px",
                  fontSize: "14px",
                }}
              >
                No unassigned artworks found.
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
                      style={{
                        marginTop: "3px",
                      }}
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

                      {artwork.title_en && artwork.title_jp && (
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
                        {[artwork.artist_name, artwork.year, artwork.category]
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
            Selected works will be linked to the new artist.
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
          {submitting ? "Saving..." : "Add Artist"}
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