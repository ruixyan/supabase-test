"use client";

import ClientSelect from "./ClientSelect";
import PurchaseQuantity from "./PurchaseQuantity";
import type { ClientOption } from "@/lib/client-options";

export default function ArtworkBuyerSelect({ clients, value, multiple, onChange, quantities, onQuantityChange }: {
  clients: ClientOption[];
  value: number[];
  multiple: boolean;
  onChange: (value: number[]) => void;
  quantities: Record<string, number>;
  onQuantityChange: (id: number, quantity: number) => void;
}) {
  if (!multiple) return <div className="space-y-2">
    <ClientSelect clients={clients} value={String(value[0] ?? "")}
      onChange={(id) => onChange(id ? [Number(id)] : [])} />
    {value.length === 1 && quantities[value[0]] !== undefined && quantities[value[0]] !== 1 && <>
      <p role="alert">Reduce the quantity to 1 before choosing Unique.</p>
      <PurchaseQuantity value={quantities[value[0]]} unique label="Purchase quantity"
        onChange={(quantity) => onQuantityChange(value[0], quantity)} />
    </>}
  </div>;

  return <div className="space-y-2">
    {value.map((id) => <div key={id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span>{clients.find((client) => client.id === id)?.name ?? "Client"} (#{id})</span>
      <PurchaseQuantity value={quantities[id] ?? 1} label={`Quantity for client ${id}`}
        onChange={(quantity) => onQuantityChange(id, quantity)} />
      <button type="button" className="text-[#9c1515] underline" aria-label={`Remove buyer ${id}`}
        onClick={() => onChange(value.filter((buyer) => buyer !== id))}>Remove</button>
    </div>)}
    <ClientSelect clients={clients.filter((client) => !value.includes(client.id))} value=""
      onChange={(id) => { if (id && !value.includes(Number(id))) onChange([...value, Number(id)]); }} />
    <p className="text-xs text-gray-500">Add each buyer and the number of copies purchased. Leave empty for unknown purchasers.</p>
  </div>;
}
