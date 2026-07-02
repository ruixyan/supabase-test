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

  showCategory?: boolean;

  activeStatus?: string;
  setActiveStatus?: (value: string) => void;

  minPrice?: string;
  setMinPrice?: (value: string) => void;

  maxPrice?: string;
  setMaxPrice?: (value: string) => void;

  showStatus?: boolean;
  showPrice?: boolean;
};

const categoryOptions = [
  "All",
  "Calligraphy",
  "Origami",
  "Metalwork",
  "Ceramics",
  "Lacquerware",
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

  showStatus = true,
  showPrice = true,
  showCategory = true,
}: Props) {
  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "sticky",
        top: "48px",
      }}
    >
      <ViewModePanel current={currentMode} />

      <input
        type="text"
        placeholder="Search artist name"
        value={artistSearchText}
        onChange={(e) => setArtistSearchText(e.target.value)}
        style={inputStyle}
      />

      <input
        type="text"
        placeholder="Search artwork name"
        value={artworkSearchText}
        onChange={(e) => setArtworkSearchText(e.target.value)}
        style={inputStyle}
      />

      <input
        type="text"
        placeholder="Search client name"
        value={buyerSearchText}
        onChange={(e) => setBuyerSearchText(e.target.value)}
        style={inputStyle}
      />

      {showCategory && (
  <select
    value={activeCategory}
    onChange={(e) => setActiveCategory(e.target.value)}
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
          {["Available", "Sold"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() =>
                setActiveStatus(activeStatus === status ? "All" : status)
              }
              style={{
                padding: "10px 12px",
                border: "1px solid #bdbdbd",
                background: activeStatus === status ? "#9c1515" : "white",
                color: activeStatus === status ? "white" : "black",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {status}
            </button>
          ))}
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
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{
              ...inputStyle,
              marginBottom: "8px",
            }}
          />

          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}
    </aside>
  );
}