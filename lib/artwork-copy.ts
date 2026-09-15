// Update generated price lines while retaining the user's other text and formatting.
export function syncRetailPrice(text: string, price: string) {
  const formatted = price.trim() ? `$${Number(price).toLocaleString("en-US")}` : "";
  let hasRetailLine = false;
  const lines = text.split("\n").map((line) => {
    if (/^\s*Retail Price:/i.test(line)) {
      hasRetailLine = true;
      return formatted ? `Retail Price: ${formatted}` : "";
    }
    if (/^\s*\$[\d,.]+\s*$/.test(line)) return formatted;
    return line;
  });
  if (!hasRetailLine && formatted) lines.push(`Retail Price: ${formatted}`);
  return lines.join("\n").trim();
}
