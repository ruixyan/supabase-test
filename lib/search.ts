/** Compare Latin accents without changing stored text or Japanese voiced marks. */
export function normalizeSearch(value: string | null | undefined): string {
  return (value ?? "").normalize("NFD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .normalize("NFC").toLowerCase().trim();
}

export function matchesSearch(value: string | null | undefined, query: string): boolean {
  return normalizeSearch(value).includes(normalizeSearch(query));
}

/** Follow database batches, including installations with a lower row limit. */
export async function loadAllRows<T>(fetchRange: (from: number, to: number) => PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
  count: number | null;
}>): Promise<T[]> {
  const rows: T[] = [];
  while (true) {
    const { data, error, count } = await fetchRange(rows.length, rows.length + 499);
    if (error) throw new Error(error.message);
    if (!data?.length) {
      if (count !== null && rows.length < count) throw new Error("The complete search list could not be loaded. Please refresh and try again.");
      return rows;
    }
    rows.push(...data);
    if (count !== null && rows.length >= count) return rows;
  }
}
