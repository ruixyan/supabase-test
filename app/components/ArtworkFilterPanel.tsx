"use client";

import Link from "next/link";
import ViewModePanel from "@/app/components/ViewModePanel";

type Props = {
  currentMode: "artworks" | "artists" | "clients";

  artistSearchText: string;
  setArtistSearchText: (value: string) => void;

  artworkSearchText: string;
  setArtworkSearchText: (value: string) => void;

  buyerSearchText: string;
  setBuyerSearchText: (value: string) => void;

  activeCategory: string;
  setActiveCategory: (value: string) => void;

  activeStatus?: string;
  setActiveStatus?: (value: string) => void;

  minPrice?: string;
  setMinPrice?: (value: string) => void;

  maxPrice?: string;
  setMaxPrice?: (value: string) => void;

  showArtistSearch?: boolean;
  showArtworkSearch?: boolean;
  showClientSearch?: boolean;
  showCategory?: boolean;
  showStatus?: boolean;
  showPrice?: boolean;

  addNewLabel?: string;
  addNewHref?: string;
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
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box" as const,
};

export default function ArtworkFilterPanel({
  currentMode,

  artistSearchText,
  setArtistSearchText,

  artworkSearchText,
  setArtworkSearchText,

  buyerSearchText,
  setBuyerSearchText,

  activeCategory,
  setActiveCategory,

  activeStatus = "All",
  setActiveStatus = () => {},

  minPrice = "",
  setMinPrice = () => {},

  maxPrice = "",
  setMaxPrice = () => {},

  showArtistSearch = true,
  showArtworkSearch = true,
  showClientSearch = true,
  showCategory = true,
  showStatus = true,
  showPrice = true,

  addNewLabel,
  addNewHref,
}: Props) {
  return (
    // <aside
    //   style={{
    //     display: "flex",
    //     flexDirection: "column",
    //     gap: "12px",
    //     position: "sticky",
    //     top: "48px",
    //   }}
    // >

    // for mobile
    <aside className="sidebar"> 
      {/* <ViewModePanel current={currentMode} /> */}

      {addNewLabel && addNewHref && (
  <Link
    href={addNewHref}
    style={{
      display: "block",
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #9c1515",
      background: "white",
      color: "#9c1515",
      textDecoration: "none",
      textAlign: "center",
      fontSize: "13px",
      fontWeight: 600,
      boxSizing: "border-box",
    }}
  >
    {addNewLabel}
  </Link>
)}

      {showArtistSearch && (
        <input
          type="text"
          placeholder="Search artist name"
          value={artistSearchText}
          onChange={(event) => setArtistSearchText(event.target.value)}
          style={inputStyle}
        />
      )}

      {showArtworkSearch && (
        <input
          type="text"
          placeholder="Search artwork name"
          value={artworkSearchText}
          onChange={(event) => setArtworkSearchText(event.target.value)}
          style={inputStyle}
        />
      )}

      {showClientSearch && (
        <input
          type="text"
          placeholder="Search client name"
          value={buyerSearchText}
          onChange={(event) => setBuyerSearchText(event.target.value)}
          style={inputStyle}
        />
      )}

      {showCategory && (
        <select
          value={activeCategory}
          onChange={(event) => setActiveCategory(event.target.value)}
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
      )}

      {showStatus && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          {["Available", "Sold"].map((status) => {
            const isActive = activeStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() =>
                  setActiveStatus(isActive ? "All" : status)
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
                {status}
              </button>
            );
          })}
        </div>
      )}

      {showPrice && (
        <div
          style={{
            border: "1px solid #bdbdbd",
            padding: "12px",
            background: "white",
          }}
        >
          <p
            style={{
              margin: "0 0 12px 0",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Market Price
          </p>

          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            style={{
              ...inputStyle,
              marginBottom: "8px",
            }}
          />

          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            style={inputStyle}
          />
        </div>
      )}
    </aside>
  );
}