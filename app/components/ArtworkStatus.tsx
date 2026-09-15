export default function ArtworkStatus({ sold, unavailable, onChange }: {
  sold: boolean;
  unavailable: boolean;
  onChange: (sold: boolean, unavailable: boolean) => void;
}) {
  const current = sold ? "Sold" : unavailable ? "Not Available" : "Available";
  return <fieldset>
    <legend className="mb-2 text-sm font-semibold">Status</legend>
    <div className="flex flex-wrap gap-2">
      {["Available", "Sold", "Not Available"].map((status) =>
        <button key={status} type="button" aria-pressed={current === status}
          onClick={() => onChange(status === "Sold", status === "Not Available")}
          className={`border border-gray-400 px-3 py-2 text-sm ${current === status ? "bg-[#9c1515] text-white" : "bg-white text-black"}`}>
          {status}
        </button>)}
    </div>
  </fieldset>;
}
