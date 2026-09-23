import { createClient } from "./supabase/client";
import { loadAllRows } from "./search";

export type ClientOption = { id: number; name: string; email?: string | null; phone?: string | null };

export async function loadClientOptions(client: ReturnType<typeof createClient>) {
  try {
    const data = await loadAllRows<ClientOption>((from, to) => client.from("customers")
      .select("id, name, email, phone", { count: "exact" })
      .order("name", { ascending: true }).order("id", { ascending: true }).range(from, to));
    return { data, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : "Could not load clients. Please try again." } };
  }
}
