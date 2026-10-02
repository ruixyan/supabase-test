"use client";

export default function PurchaseQuantity({ value, onChange, label, unique = false }: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  unique?: boolean;
}) {
  return <label className="flex items-center gap-2 text-sm">
    Quantity
    <input type="number" min={1} max={unique ? 1 : 2147483647} step={1} required
      aria-label={label} value={Number.isNaN(value) ? "" : value}
      onChange={(event) => onChange(event.target.valueAsNumber)}
      className="w-24 border border-[#bdbdbd] bg-white px-2 py-1" />
  </label>;
}
