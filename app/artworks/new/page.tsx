"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import ReactMarkdown from "react-markdown";
import ImageUploadField from "@/app/components/ImageUploadField";

type ArtistOption = {
  id: number;
  name: string | null;
  name_en: string | null;
  name_jp: string | null;
  artist_photo_url: string | null;
};

type ClientOption = {
  id: number;
  name: string;
};

const categoryOptions = [
  "All",
  "Ceramic",
  "Metalwork",
  "Lacquer",
  "Glass",
  "Wall",
  "Other",
];

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #bdbdbd",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box" as const,
};

export default function NewArtworkPage() {
  const supabase = createClient();
  const router = useRouter();

  const copyInfoRef = useRef<HTMLTextAreaElement>(null);

  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  const [form, setForm] = useState({
    artist_id: "",
    title_en: "",
    title_jp: "",
    artwork_photo_url: "",
    year: "",
    material: "",
    dimensions: "",
    category: "Metalwork",
    market_price: "",
    cost: "",
    extra_photo_link: "",
    fact_sheet_link: "",
    copy_info: "",
    is_sold: false,
      is_unique: true,
    buyer_id: "",
  });

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);
      setMessage("");

      const [
        { data: artistData, error: artistError },
        { data: clientData, error: clientError },
      ] = await Promise.all([
        supabase
          .from("artists")
          .select(`
            id,
            name,
            name_en,
            name_jp,
            artist_photo_url
          `)
          .order("name_en", { ascending: true }),

        supabase
          .from("customers")
          .select("id, name")
          .order("name", { ascending: true }),
      ]);

      if (artistError) {
        setMessage(artistError.message);
        setLoadingOptions(false);
        return;
      }

      if (clientError) {
        setMessage(clientError.message);
        setLoadingOptions(false);
        return;
      }

      setArtists(artistData || []);
      setClients(clientData || []);
      setLoadingOptions(false);
    }

    loadOptions();
  }, []);

  const selectedArtist = artists.find(
    (artist) => artist.id === Number(form.artist_id)
  );

  const artistDisplayName =
    selectedArtist?.name_en ||
    selectedArtist?.name ||
    selectedArtist?.name_jp ||
    "";

  function generateCopyInfo() {
    const marketPrice =
      form.market_price.trim() !== ""
        ? `$${Number(form.market_price).toLocaleString()}`
        : "";

    const cost =
      form.cost.trim() !== ""
        ? `￥${Number(form.cost).toLocaleString()}`
        : "";

    const title = form.title_en.trim() || form.title_jp.trim();

    const generatedText = `**${artistDisplayName}**

*${title}*${form.year.trim() ? `, ${form.year.trim()}` : ""}
${form.material.trim()}
${form.dimensions.trim()}
${marketPrice}

Gallery Price: ${marketPrice}
Cost: ${cost}`;

    setForm((current) => ({
      ...current,
      copy_info: generatedText,
    }));
  }

  function applyMarkdownFormat(
    textareaRef: RefObject<HTMLTextAreaElement | null>,
    marker: "*" | "**"
  ) {
    const textarea = textareaRef.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.copy_info.slice(start, end);

    const replacement =
      selectedText.length > 0
        ? `${marker}${selectedText}${marker}`
        : `${marker}text${marker}`;

    const updatedValue =
      form.copy_info.slice(0, start) +
      replacement +
      form.copy_info.slice(end);

    setForm((current) => ({
      ...current,
      copy_info: updatedValue,
    }));

    requestAnimationFrame(() => {
      textarea.focus();

      if (selectedText.length > 0) {
        textarea.setSelectionRange(
          start + marker.length,
          end + marker.length
        );
      } else {
        textarea.setSelectionRange(
          start + marker.length,
          start + marker.length + 4
        );
      }
    });
  }

  function escapeHtml(text: string) {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function markdownToHtml(text: string) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/gs, "<em>$1</em>")
      .split("\n")
      .map((line) => {
        if (line.trim() === "") {
          return "<br>";
        }

        return `<div>${line}</div>`;
      })
      .join("");
  }

  function stripMarkdown(text: string) {
    return text
      .replace(/\*\*(.+?)\*\*/gs, "$1")
      .replace(/\*(.+?)\*/gs, "$1");
  }

  async function copyInformation() {
    if (!form.copy_info.trim()) {
      setMessage("There is no copy information to copy.");
      return;
    }

    const plainText = stripMarkdown(form.copy_info);
    const htmlText = markdownToHtml(form.copy_info);

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([plainText], {
            type: "text/plain",
          }),
          "text/html": new Blob([htmlText], {
            type: "text/html",
          }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(plainText);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  let artworkPhotoUrl = form.artwork_photo_url.trim() || null;
  
  async function addArtwork(event: React.FormEvent<HTMLFormElement>) {
    if (uploadedImage) {
  const fileExt = uploadedImage.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("artworks")
    .upload(fileName, uploadedImage);

  if (uploadError) {
    setMessage(uploadError.message);
    setSubmitting(false);
    return;
  }

  const { data } = supabase.storage
    .from("artworks")
    .getPublicUrl(fileName);

  artworkPhotoUrl = data.publicUrl;
}
    event.preventDefault();

    if (!form.artist_id) {
      setMessage("Please select an artist.");
      return;
    }

    if (!form.title_en.trim() && !form.title_jp.trim()) {
      setMessage("At least one artwork title is required.");
      return;
    }

    if (form.is_sold && !form.buyer_id) {
      setMessage("Please select a client for a sold artwork.");
      return;
    }

    if (!selectedArtist) {
      setMessage("The selected artist could not be found.");
      return;
    }

    const selectedArtistDisplayName =
      selectedArtist.name_en ||
      selectedArtist.name ||
      selectedArtist.name_jp ||
      "Unknown Artist";

    setSubmitting(true);
    setMessage("");

    const { data: newArtwork, error } = await supabase
      .from("artworks")
      .insert([
        {
          artist_id: selectedArtist.id,
          artist_name: selectedArtistDisplayName,
          artist_photo_url: selectedArtist.artist_photo_url,

          title_en: form.title_en.trim() || null,
          title_jp: form.title_jp.trim() || null,
          artwork_photo_url: form.artwork_photo_url.trim() || null,
          year: form.year.trim() || null,
          material: form.material.trim() || null,
          dimensions: form.dimensions.trim() || null,
          category: form.category || null,

          market_price:
            form.market_price.trim() === ""
              ? null
              : Number(form.market_price),

          cost:
            form.cost.trim() === ""
              ? null
              : Number(form.cost),

          extra_photo_link: form.extra_photo_link.trim() || null,
          fact_sheet_link: form.fact_sheet_link.trim() || null,
          copy_info: form.copy_info.trim() || null,

          is_sold: form.is_sold,
          buyer_id:
            form.is_sold && form.buyer_id
              ? Number(form.buyer_id)
              : null,
        },
      ])
      .select("id")
      .single();

    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }

    if (!newArtwork) {
      setMessage("Artwork could not be created.");
      setSubmitting(false);
      return;
    }

    router.push(`/artworks/${newArtwork.id}`);
    router.refresh();
  }

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
        href="/artworks"
        style={{
          display: "inline-block",
          color: "black",
          textDecoration: "none",
          fontSize: "14px",
          marginBottom: "32px",
        }}
      >
        ← Back to artworks
      </Link>

      <h1
        style={{
          margin: "0 0 28px 0",
          fontSize: "32px",
        }}
      >
        Add Artwork
      </h1>

      {loadingOptions ? (
        <p>Loading artists and clients...</p>
      ) : (
        <form
          onSubmit={addArtwork}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <FormField label="Artist">
            <select
              value={form.artist_id}
              onChange={(event) =>
                setForm({
                  ...form,
                  artist_id: event.target.value,
                })
              }
              style={{
                ...inputStyle,
                background: "white",
              }}
              required
            >
              <option value="">Select an artist</option>

              {artists.map((artist) => {
                const displayName =
                  artist.name_en ||
                  artist.name ||
                  artist.name_jp ||
                  `Artist ${artist.id}`;

                return (
                  <option key={artist.id} value={artist.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </FormField>

          <FormField label="English Title">
            <input
              type="text"
              value={form.title_en}
              onChange={(event) =>
                setForm({
                  ...form,
                  title_en: event.target.value,
                })
              }
              style={inputStyle}
            />
          </FormField>

          <FormField label="Japanese Title">
  <input
    type="text"
    value={form.title_jp}
    onChange={(event) =>
      setForm({
        ...form,
        title_jp: event.target.value,
      })
    }
    style={inputStyle}
  />
</FormField>

  <ImageUploadField
  label="Artwork Image"
  bucket="artworks"
  folder="main-images"
  value={form.artwork_photo_url}
  onChange={(url) =>
    setForm((current) => ({
      ...current,
      artwork_photo_url: url,
    }))
  }
/>

          <FormField label="Year">
            <input
              type="text"
              value={form.year}
              onChange={(event) =>
                setForm({
                  ...form,
                  year: event.target.value,
                })
              }
              style={inputStyle}
            />
          </FormField>

          <FormField label="Material">
            <textarea
              value={form.material}
              onChange={(event) =>
                setForm({
                  ...form,
                  material: event.target.value,
                })
              }
              style={{
                ...inputStyle,
                minHeight: "90px",
                resize: "vertical",
              }}
            />
          </FormField>

          <FormField label="Dimensions">
            <textarea
              value={form.dimensions}
              onChange={(event) =>
                setForm({
                  ...form,
                  dimensions: event.target.value,
                })
              }
              style={{
                ...inputStyle,
                minHeight: "90px",
                resize: "vertical",
              }}
            />
          </FormField>

          <FormField label="Category">
            <select
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value,
                })
              }
              style={{
                ...inputStyle,
                background: "white",
              }}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Market Price (USD)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.market_price}
              onChange={(event) =>
                setForm({
                  ...form,
                  market_price: event.target.value,
                })
              }
              placeholder="23000"
              style={inputStyle}
            />
          </FormField>

          <FormField label="Cost (JPY)">
            <input
              type="number"
              min="0"
              step="1"
              value={form.cost}
              onChange={(event) =>
                setForm({
                  ...form,
                  cost: event.target.value,
                })
              }
              placeholder="100000"
              style={inputStyle}
            />
          </FormField>

          <FormField label="Additional Photos Folder Link">
            <input
              type="url"
              value={form.extra_photo_link}
              onChange={(event) =>
                setForm({
                  ...form,
                  extra_photo_link: event.target.value,
                })
              }
              placeholder="https://..."
              style={inputStyle}
            />
          </FormField>

          <FormField label="Fact Sheet Link">
            <input
              type="url"
              value={form.fact_sheet_link}
              onChange={(event) =>
                setForm({
                  ...form,
                  fact_sheet_link: event.target.value,
                })
              }
              placeholder="https://..."
              style={inputStyle}
            />
          </FormField>

          <section
            style={{
              marginTop: "8px",
              padding: "20px",
              border: "1px solid #bdbdbd",
              background: "#fafafa",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                }}
              >
                Copy Information
              </h2>

              <button
                type="button"
                onClick={generateCopyInfo}
                style={{
                  padding: "8px 10px",
                  border: "1px solid #bdbdbd",
                  background: "white",
                  color: "black",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Generate from Fields
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  applyMarkdownFormat(copyInfoRef, "**")
                }
                style={{
                  padding: "7px 12px",
                  border: "1px solid #bdbdbd",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                Bold
              </button>

              <button
                type="button"
                onClick={() =>
                  applyMarkdownFormat(copyInfoRef, "*")
                }
                style={{
                  padding: "7px 12px",
                  border: "1px solid #bdbdbd",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontStyle: "italic",
                }}
              >
                Italic
              </button>
            </div>

            <textarea
              ref={copyInfoRef}
              value={form.copy_info}
              onChange={(event) =>
                setForm({
                  ...form,
                  copy_info: event.target.value,
                })
              }
              placeholder="Enter the copy information here..."
              style={{
                ...inputStyle,
                minHeight: "260px",
                resize: "vertical",
                fontFamily: "Arial, sans-serif",
                lineHeight: 1.6,
              }}
            />

            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                border: "1px solid #ddd",
                background: "white",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {form.copy_info.trim() ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p style={{ margin: "0 0 12px 0" }}>
                        {children}
                      </p>
                    ),
                  }}
                >
                  {form.copy_info}
                </ReactMarkdown>
              ) : (
                <p
                  style={{
                    margin: 0,
                    color: "#777",
                    fontSize: "14px",
                  }}
                >
                  Copy information preview
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={copyInformation}
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                border: "1px solid #9c1515",
                background: "#9c1515",
                color: "white",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {copied ? "Copied" : "Copy Information"}
            </button>
          </section>

<div>
  <label
    style={{
      display: "block",
      marginBottom: "8px",
      fontSize: "13px",
      fontWeight: 600,
    }}
  >
    Edition Type
  </label>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px",
    }}
  >
    {[
      { label: "Unique", value: true },
      { label: "Multiple", value: false },
    ].map((option) => {
      const isActive = form.is_unique === option.value;

      return (
        <button
          key={option.label}
          type="button"
          onClick={() =>
            setForm({
              ...form,
              is_unique: option.value,
            })
          }
          style={{
            padding: "10px 12px",
            border: "1px solid #bdbdbd",
            background: isActive ? "#9c1515" : "white",
            color: isActive ? "white" : "black",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {option.label}
        </button>
      );
    })}
  </div>
</div>

<div>
  <label
    style={{
      display: "block",
      marginBottom: "8px",
      fontSize: "13px",
      fontWeight: 600,
    }}
  >
    Status
  </label>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px",
    }}
  >
    <button
      type="button"
      onClick={() =>
        setForm({
          ...form,
          is_sold: false,
          buyer_id: "",
        })
      }
      style={{
        padding: "10px 12px",
        border: "1px solid #bdbdbd",
        background: !form.is_sold ? "#9c1515" : "white",
        color: !form.is_sold ? "white" : "black",
        cursor: "pointer",
        fontSize: "13px",
      }}
    >
      Available
    </button>

    <button
      type="button"
      onClick={() =>
        setForm({
          ...form,
          is_sold: true,
        })
      }
      style={{
        padding: "10px 12px",
        border: "1px solid #bdbdbd",
        background: form.is_sold ? "#9c1515" : "white",
        color: form.is_sold ? "white" : "black",
        cursor: "pointer",
        fontSize: "13px",
      }}
    >
      Sold
    </button>
  </div>
</div>

{form.is_sold && (
  <FormField label="Client">
    <select
      value={form.buyer_id}
      onChange={(event) =>
        setForm({
          ...form,
          buyer_id: event.target.value,
        })
      }
      style={{
        ...inputStyle,
        background: "white",
      }}
      required
    >
      <option value="">Select a client</option>

      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.name}
        </option>
      ))}
    </select>
  </FormField>
)}

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
            {submitting ? "Saving..." : "Add Artwork"}
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
      )}
    </main>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
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