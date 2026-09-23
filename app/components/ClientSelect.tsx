"use client";

import type { ClientOption } from "@/lib/client-options";
import { normalizeSearch } from "@/lib/search";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export default function ClientSelect({ clients, value, onChange }: {
  clients: ClientOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const selected = clients.find((client) => String(client.id) === value);
  const label = selected ? `${selected.name} (#${selected.id})` : value ? `Current client (#${value})` : "";
  const indexed = useMemo(() => clients.map((client) => ({
    client,
    text: normalizeSearch(`${client.name} #${client.id} ${client.email ?? ""} ${client.phone ?? ""}`),
  })), [clients]);
  const matches = useMemo(() => {
    const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
    return indexed.filter(({ text }) => terms.every((term) => text.includes(term))).map(({ client }) => client);
  }, [indexed, query]);
  const options = [
    { id: "", label: "No client / unknown purchaser", detail: "" },
    ...matches.map((client) => ({ id: String(client.id), label: `${client.name} (#${client.id})`, detail: client.email || client.phone || "" })),
  ];
  const activeIndex = active < options.length ? active : -1;

  useEffect(() => {
    if (open && activeIndex >= 0) {
      listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
    setActive(-1);
  }

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-label="Client: search by name, ID or email"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder="Select client — type name, ID or email"
        value={open ? query : label}
        onFocus={() => { setOpen(true); setQuery(""); setActive(-1); }}
        onClick={() => { if (!open) { setOpen(true); setQuery(""); setActive(-1); } }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(-1); }}
        onBlur={() => { setOpen(false); setQuery(""); setActive(-1); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            const step = event.key === "ArrowDown" ? 1 : -1;
            setActive(activeIndex < 0 ? (step === 1 ? 0 : options.length - 1) : (activeIndex + step + options.length) % options.length);
          } else if (event.key === "Enter") {
            // Searching must never accidentally submit the artwork form.
            event.preventDefault();
            if (open && activeIndex >= 0) choose(options[activeIndex].id);
            else if (open && query.trim() && matches.length === 1) choose(String(matches[0].id));
            else setOpen(true);
          } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
            setQuery("");
            setActive(-1);
          }
        }}
        className="w-full border border-[#bdbdbd] bg-white px-3 py-2.5 pr-8 text-sm text-black focus:border-[#9c1515] focus:outline-none"
      />
      <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 text-xs text-gray-500">▾</span>
      {open && (
        <div className="absolute z-20 mt-1 w-full border border-[#bdbdbd] bg-white text-black shadow-lg">
          <div ref={listRef} id={listId} role="listbox" aria-label="Clients" className="max-h-64 overflow-y-auto">
            {options.map((option, index) => (
              <div key={option.id} id={`${listId}-${index}`} role="option" aria-selected={value === option.id}
                data-index={index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option.id)}
                onMouseMove={() => setActive(index)}
                className={`cursor-pointer break-words px-3 py-2 text-sm ${index === activeIndex ? "bg-[#faf1f1]" : ""} ${value === option.id ? "font-semibold text-[#9c1515]" : ""}`}>
                <div>{option.label}</div>
                {option.detail && <div className="text-xs font-normal text-gray-600">{option.detail}</div>}
              </div>
            ))}
          </div>
          <p role="status" className="border-t px-3 py-2 text-xs text-gray-500">
            {matches.length ? `${matches.length} matching clients` : "No matching clients. Try another name, ID or email."}
          </p>
        </div>
      )}
    </div>
  );
}