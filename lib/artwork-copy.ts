// Update generated price lines while retaining the user's other text and formatting.
export function syncRetailPrice(text: string, price: string) {
  const formatted = price.trim() ? `$${Number(price).toLocaleString("en-US")}` : "";
  let hasRetailLine = false;
  const lines = text.split("\n").flatMap((line) => {
    if (/^\s*(?:\*\*)?Cost:(?:\*\*)?\s*/i.test(line)) return [];
    if (/^\s*Retail Price:/i.test(line) || /^\s*\$[\d,.]+\s*$/.test(line)) {
      if (hasRetailLine) return [];
      hasRetailLine = true;
      return formatted ? [formatted] : [];
    }
    return [line];
  });
  if (!hasRetailLine && formatted) lines.push(formatted);
  return lines.join("\n").trim();
}
