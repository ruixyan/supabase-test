"use client";

import { useState } from "react";

export default function ClientSelect({ clients, value, onChange }: {
  clients: { id: number; name: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const matches = clients.filter((client) =>
    String(client.id) === value || client.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  return (
    <div className="space-y-2">
      <input aria-label="Search clients" type="search" placeholder="Type to search clients…"
        value={search} onChange={(event) => setSearch(event.target.value)}
        className="w-full border border-gray-400 bg-white p-2 text-sm" />
      <select aria-label="Client (optional)" value={value} onChange={(event) => onChange(event.target.value)}
        className="w-full border border-gray-400 bg-white p-2 text-sm">
        <option value="">No client / unknown purchaser</option>
        {matches.map((client) => <option key={client.id} value={client.id}>{client.name} (#{client.id})</option>)}
      </select>
      {matches.length === 0 && <p className="text-sm text-gray-600">No matching clients.</p>}
    </div>
  );
}
