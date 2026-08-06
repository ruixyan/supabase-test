"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import ImageUploadField from "@/app/components/ImageUploadField";

type Artist = {
  id: number;
  name: string | null;
  name_en: string | null;
  name_jp: string | null;
  artist_photo_url: string | null;
};

type Customer = {
  id: number;
  name: string;
};

type Artwork = {
  id: number;
  artist_id: number | null;
  artist_name: string | null;
  title_jp: string | null;
  title_en: string | null;
  artwork_photo_url: string | null;
  artist_photo_url: string | null;
  extra_photo_link: string | null;
  fact_sheet_link: string | null;
  copy_info: string | null;
  year: string | null;
  material: string | null;
  dimensions: string | null;
  category: string | null;
  is_sold: boolean;
  buyer_id: number | null;
  market_price: number | null;
  cost: number | null;
  artists: Artist[] | Artist | null;
  customers: Customer[] | Customer | null;
};

const categoryOptions = [
  "All",
  "Ceramics",
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

export default function ArtworkDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const supabase = createClient();

  const copyInfoRef = useRef<HTMLTextAreaElement>(null);

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [artistOptions, setArtistOptions] = useState<Artist[]>([]);
  const [clientOptions, setClientOptions] = useState<Customer[]>([]);

  const [message, setMessage] = useState("Loading...");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  const [form, setForm] = useState({
    artist_id: "",
    title_en: "",
    title_jp: "",
    artwork_photo_url: "",
    year: "",
    material: "",
    dimensions: "",
    category: "",
    market_price: "",
    cost: "",
    extra_photo_link: "",
    fact_sheet_link: "",
    copy_info: "",
    is_sold: false,
    buyer_id: "",
  });

  async function loadArtwork() {
    if (Number.isNaN(id)) {
      setMessage("Invalid artwork ID.");
      return;
    }

    setMessage("Loading...");

    const { data, error } = await supabase
      .from("artworks")
      .select(`
        id,
        artist_id,
        artist_name,
        title_jp,
        title_en,
        artwork_photo_url,
        artist_photo_url,
        extra_photo_link,
        fact_sheet_link,
        copy_info,
        year,
        material,
        dimensions,
        category,
        is_sold,
        buyer_id,
        market_price,
        cost,
        artists (
          id,
          name,
          name_en,
          name_jp,
          artist_photo_url
        ),
        customers (
          id,
          name
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data) {
      setMessage("Artwork not found.");
      return;
    }

    setArtwork(data);

    setForm({
      artist_id: data.artist_id ? String(data.artist_id) : "",
      title_en: data.title_en || "",
      title_jp: data.title_jp || "",
      artwork_photo_url: data.artwork_photo_url || "",
      year: data.year || "",
      material: data.material || "",
      dimensions: data.dimensions || "",
      category: data.category || "",
      market_price:
        data.market_price !== null ? String(data.market_price) : "",
      cost: data.cost !== null ? String(data.cost) : "",
      extra_photo_link: data.extra_photo_link || "",
      fact_sheet_link: data.fact_sheet_link || "",
      copy_info: data.copy_info || "",
      is_sold: data.is_sold,
      buyer_id: data.buyer_id ? String(data.buyer_id) : "",
    });

    setMessage("");
  }

  async function loadOptions() {
    const [
      { data: artists, error: artistError },
      { data: clients, error: clientError },
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
      return;
    }

    if (clientError) {
      setMessage(clientError.message);
      return;
    }

    setArtistOptions(artists || []);
    setClientOptions(clients || []);
  }

  useEffect(() => {
    loadArtwork();
    loadOptions();
  }, [id]);

  if (message === "Loading...") {
    return (
      <main style={{ padding: "48px 72px" }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (!artwork) {
    return (
      <main style={{ padding: "48px 72px" }}>
        <p>{message || "Artwork not found."}</p>

        <Link
          href="/artworks"
          style={{
            color: "black",
            textDecoration: "none",
          }}
        >
          ← Back to artworks
        </Link>
      </main>
    );
  }

  const artist = Array.isArray(artwork.artists)
    ? artwork.artists[0]
    : artwork.artists;

  const customer = Array.isArray(artwork.customers)
    ? artwork.customers[0]
    : artwork.customers;

  const artistDisplayName =
    artist?.name_en ||
    artist?.name ||
    artist?.name_jp ||
    artwork.artist_name ||
    "Unknown Artist";

  const artistHref = artwork.artist_id
    ? `/artists/${artwork.artist_id}`
    : "#";

  const marketPriceText =
    artwork.market_price !== null
      ? `$${artwork.market_price.toLocaleString()}`
      : "";

  const costText =
    artwork.cost !== null
      ? `￥${artwork.cost.toLocaleString()}`
      : "";



      function generateCopyInfo() {
        if (!artwork) return;
      
        const selectedArtist = artistOptions.find(
          (option) => option.id === Number(form.artist_id)
        );
      
        const selectedArtistName =
          selectedArtist?.name_en ||
          selectedArtist?.name ||
          selectedArtist?.name_jp ||
          artwork.artist_name ||
          "Unknown Artist";
      
        const title =
          form.title_en.trim() ||
          form.title_jp.trim() ||
          "Untitled";
      
        const titleWithYear = form.year.trim()
          ? `${title}, ${form.year.trim()}`
          : title;
      
        const generatedMarketPrice =
          form.market_price.trim() !== ""
            ? `$${Number(form.market_price).toLocaleString()}`
            : "";
      
        const generatedCost =
          form.cost.trim() !== ""
            ? `￥${Number(form.cost).toLocaleString()}`
            : "";
      
        const generatedText = [
          `**${selectedArtistName}**`,
          `*${titleWithYear}*`,
          form.material.trim(),
          form.dimensions.trim(),
          generatedMarketPrice,
          generatedMarketPrice
            ? `Gallery Price: ${generatedMarketPrice}`
            : "",
          generatedCost
            ? `Cost: ${generatedCost}`
            : "",
        ]
          .filter((line) => line !== "")
          .join("\n");
      
        setForm((current) => ({
          ...current,
          copy_info: generatedText,
        }));
      }

  function applyMarkdownFormat(marker: "*" | "**") {
    const textarea = copyInfoRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.copy_info.slice(start, end);

    const replacement = selectedText
      ? `${marker}${selectedText}${marker}`
      : `${marker}text${marker}`;

    const updatedText =
      form.copy_info.slice(0, start) +
      replacement +
      form.copy_info.slice(end);

    setForm((current) => ({
      ...current,
      copy_info: updatedText,
    }));

    requestAnimationFrame(() => {
      textarea.focus();

      if (selectedText) {
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
    const formatted = escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/gs, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/gs, "<em>$1</em>");

    return formatted
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

  async function copyArtworkInfo() {
    if (!artwork) return;
  
    const sourceText =
      artwork.copy_info?.trim() ||
      form.copy_info.trim();
  
    if (!sourceText) {
      setMessage("There is no copy information.");
      return;
    }

    const plainText = stripMarkdown(sourceText);
    const htmlText = markdownToHtml(sourceText);

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

  function cancelEditing() {
    if (!artwork) return;
  
    setForm({
      artist_id: artwork.artist_id
        ? String(artwork.artist_id)
        : "",
      title_en: artwork.title_en || "",
      title_jp: artwork.title_jp || "",
      artwork_photo_url: artwork.artwork_photo_url || "",
      year: artwork.year || "",
      material: artwork.material || "",
      dimensions: artwork.dimensions || "",
      category: artwork.category || "",
      market_price:
        artwork.market_price !== null
          ? String(artwork.market_price)
          : "",
      cost:
        artwork.cost !== null
          ? String(artwork.cost)
          : "",
      extra_photo_link: artwork.extra_photo_link || "",
      fact_sheet_link: artwork.fact_sheet_link || "",
      copy_info: artwork.copy_info || "",
      is_sold: artwork.is_sold,
      buyer_id: artwork.buyer_id
        ? String(artwork.buyer_id)
        : "",
    });

    setMessage("");
    setIsEditing(false);
  }

  async function saveArtwork(
    event: React.FormEvent<HTMLFormElement>
  ) {
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

    const selectedArtist = artistOptions.find(
      (option) => option.id === Number(form.artist_id)
    );

    if (!selectedArtist) {
      setMessage("The selected artist could not be found.");
      return;
    }

    const selectedArtistName =
      selectedArtist.name_en ||
      selectedArtist.name ||
      selectedArtist.name_jp ||
      "Unknown Artist";

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("artworks")
      .update({
        artist_id: selectedArtist.id,
        artist_name: selectedArtistName,
        artist_photo_url:
          selectedArtist.artist_photo_url || null,

        title_en: form.title_en.trim() || null,
        title_jp: form.title_jp.trim() || null,
        artwork_photo_url:
          form.artwork_photo_url.trim() || null,

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

        extra_photo_link:
          form.extra_photo_link.trim() || null,

        fact_sheet_link:
          form.fact_sheet_link.trim() || null,

        copy_info:
          form.copy_info.trim() || null,

        is_sold: form.is_sold,

        buyer_id:
          form.is_sold && form.buyer_id
            ? Number(form.buyer_id)
            : null,
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    await loadArtwork();

    setSaving(false);
    setIsEditing(false);
    setMessage("Artwork updated.");
  }

  return (
    // <main
    //   style={{
    //     maxWidth: "1200px",
    //     margin: "0 auto",
    //     padding: "48px 72px",
    //   }}
    // >

    <main className="artwork-detail-main">

      <Link
        href="/artworks"
        style={{
          color: "black",
          textDecoration: "none",
        }}
      >
        ← Back to artworks
      </Link>

      {!isEditing ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "24px",
            }}
          >
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
              Edit Artwork
            </button>
          </div>

          {/* <section
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "56px",
              marginTop: "20px",
              marginBottom: "48px",
            }}
          > */}

            <section className="artwork-detail-grid">

            <div>
              {artwork.artwork_photo_url && (
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "1 / 1",
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
            </div>

            <div>
              <h1 style={{fontSize: "18px", fontWeight: 600 }}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <>{children}</>,
                  }}
                >
                  {artwork.title_en ||
                    artwork.title_jp ||
                    "Untitled"}
                </ReactMarkdown>
              </h1>

              {artwork.title_en && artwork.title_jp && (
                <p style={{marginBottom: "16px", fontSize: "18px", fontWeight: 600 }}>{artwork.title_jp}</p>
              )}

              <p>
                <strong>Artist:</strong>{" "}
                {artwork.artist_id ? (
                  <Link href={artistHref}>
                    {artistDisplayName}
                  </Link>
                ) : (
                  artistDisplayName
                )}
              </p>

              {artwork.category && (
                <p>
                  <strong>Category:</strong>{" "}
                  {artwork.category}
                </p>
              )}

              {artwork.year && (
                <p>
                  <strong>Year:</strong> {artwork.year}
                </p>
              )}

              {artwork.material && (
                <p>
                  <strong>Material:</strong>{" "}
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <>{children}</>,
                    }}
                  >
                    {artwork.material}
                  </ReactMarkdown>
                </p>
              )}

              {artwork.dimensions && (
                <p>
                  <strong>Dimensions:</strong>{" "}
                  {artwork.dimensions}
                </p>
              )}

              {artwork.market_price !== null && (
                <p
                  style={{
                    margin: "20px 0 0 0",
                    fontSize: "16px",
                  }}
                >
                  <strong>Market Price:</strong>{" "}
                  {marketPriceText}
                </p>
              )}

              {artwork.cost !== null && (
                <p style={{ margin: 0, fontSize: "16px" }}>
                  <strong>Cost:</strong> {costText}
                </p>
              )}

              <span
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  padding: "6px 12px",
                  border: "1px solid #bdbdbd",
                  color: artwork.is_sold
                    ? "#9c1515"
                    : "#444",
                }}
              >
                {artwork.is_sold ? "Sold" : "Available"}
              </span>

              <div style={{ marginTop: "24px" }}>
                {artwork.extra_photo_link && (
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "15px",
                    }}
                  >
                    <strong>Additional Photos:</strong>{" "}
                    <a
                      href={artwork.extra_photo_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#9c1515",
                        textDecoration: "underline",
                      }}
                    >
                      View Folder
                    </a>
                  </p>
                )}

                {artwork.fact_sheet_link && (
                  <p style={{ margin: 0, fontSize: "15px" }}>
                    <strong>Fact Sheet:</strong>{" "}
                    <a
                      href={artwork.fact_sheet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#9c1515",
                        textDecoration: "underline",
                      }}
                    >
                      View File
                    </a>
                  </p>
                )}
              </div>

              {artwork.is_sold && (
                <div
                  style={{
                    marginTop: "28px",
                    padding: "20px",
                    border: "1px solid #ddd",
                    background: "#fafafa",
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>
                    Client
                  </h3>

                  {customer ? (
                    <Link href={`/clients/${customer.id}`}>
                      {customer.name}
                    </Link>
                  ) : (
                    <p>Unknown client</p>
                  )}
                </div>
              )}

              {message && (
                <p
                  style={{
                    marginTop: "20px",
                    color:
                      message === "Artwork updated."
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
            margin: "32px auto 64px",
            padding: "24px",
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          <h1 style={{ margin: "0 0 24px 0" }}>
            Edit Artwork
          </h1>

          <form
            onSubmit={saveArtwork}
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

                {artistOptions.map((option) => {
                  const displayName =
                    option.name_en ||
                    option.name ||
                    option.name_jp ||
                    `Artist ${option.id}`;

                  return (
                    <option
                      key={option.id}
                      value={option.id}
                    >
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
    setForm({
      ...form,
      artwork_photo_url: url,
    })
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
                <option value="">Select category</option>

                {categoryOptions.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
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
                    extra_photo_link:
                      event.target.value,
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
                    fact_sheet_link:
                      event.target.value,
                  })
                }
                placeholder="https://..."
                style={inputStyle}
              />
            </FormField>

            <section
              style={{
                padding: "20px",
                border: "1px solid #bdbdbd",
                background: "white",
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
                    applyMarkdownFormat("**")
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
                    applyMarkdownFormat("*")
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
                placeholder="Enter copy information..."
                style={{
                  ...inputStyle,
                  minHeight: "260px",
                  resize: "vertical",
                  lineHeight: 1,
                }}
              />

              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  border: "1px solid #ddd",
                  background: "#fafafa",
                  lineHeight: 1,
                }}
              >
                {form.copy_info.trim() ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p
                          style={{
                            margin: "0 0 12px 0",
                          }}
                        >
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
                    }}
                  >
                    Copy information preview
                  </p>
                )}
              </div>
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
                    background: !form.is_sold
                      ? "#9c1515"
                      : "white",
                    color: !form.is_sold
                      ? "white"
                      : "black",
                    cursor: "pointer",
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
                    background: form.is_sold
                      ? "#9c1515"
                      : "white",
                    color: form.is_sold
                      ? "white"
                      : "black",
                    cursor: "pointer",
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
                  <option value="">
                    Select a client
                  </option>

                  {clientOptions.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                    >
                      {option.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

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
                  cursor: saving
                    ? "default"
                    : "pointer",
                  opacity: saving ? 0.6 : 1,
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
                  cursor: saving
                    ? "default"
                    : "pointer",
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
                }}
              >
                {message}
              </p>
            )}
          </form>
        </section>
      )}

      {!isEditing && (
        <>
          

<section
  style={{
    border: "1px solid #ddd",
    padding: "24px",
    marginBottom: "48px",
    background: "#fafafa",
  }}
>
  {artwork.copy_info ? (
    <div
      style={{
        whiteSpace: "pre-wrap",
        lineHeight: 1.7,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          p: ({ children }) => <>{children}</>,
        }}
      >
        {artwork.copy_info}
      </ReactMarkdown>
    </div>
  ) : (
    <p
      style={{
        margin: 0,
        color: "#777",
      }}
    >
      No copy information saved.
    </p>
  )}

  <button
    type="button"
    onClick={copyArtworkInfo}
    disabled={!artwork.copy_info}
    style={{
      marginTop: "20px",
      padding: "10px 14px",
      border: "1px solid #9c1515",
      background: "#9c1515",
      color: "white",
      cursor: artwork.copy_info ? "pointer" : "default",
      opacity: artwork.copy_info ? 1 : 0.5,
    }}
  >
    {copied ? "Copied" : "Copy Information"}
  </button>
</section>

          <section
            style={{
              borderTop: "1px solid #ddd",
              paddingTop: "40px"
            }}
          >
            <h2 style={{ marginBottom: "12px", fontSize: "18px", fontWeight: 600 }}>Artist</h2>

            <Link
              href={artistHref}
              style={{
                display: "flex",
                gap: "24px",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                pointerEvents: artwork.artist_id
                  ? "auto"
                  : "none",
              }}
            >
              {artwork.artist_photo_url && (
                <div
                  style={{
                    position: "relative",
                    width: "180px",
                    height: "180px",
                  }}
                >
                  <Image
                    src={artwork.artist_photo_url}
                    alt={artistDisplayName}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}

              <h3>{artistDisplayName}</h3>
            </Link>
          </section>
        </>
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