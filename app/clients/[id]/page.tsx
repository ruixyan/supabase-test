import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

type Artwork = {
  id: number;
  title_jp: string;
  title_en: string | null;
  artwork_photo_url: string | null;
  year: string | null;
  material: string | null;
  dimensions: string | null;
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, name, email, phone, address, notes")
    .eq("id", id)
    .single();

  if (error || !customer) {
    notFound();
  }

  const { data: artworks } = await supabase
    .from("artworks")
    .select("id, title_jp, title_en, artwork_photo_url, year, material, dimensions")
    .eq("buyer_id", id)
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: "48px 72px", maxWidth: "1400px", margin: "0 auto" }}>
      <Link href="/artworks" style={{ color: "black", textDecoration: "none" }}>
        ← Back to artworks
      </Link>

      <section style={{ marginTop: "32px", marginBottom: "56px" }}>
        <h1>{customer.name}</h1>

        {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
        {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
        {customer.address && <p><strong>Address:</strong> {customer.address}</p>}
        {customer.notes && <p><strong>Notes:</strong> {customer.notes}</p>}
      </section>

      <section>
        <h2>Purchased Works</h2>

        {!artworks || artworks.length === 0 ? (
          <p>No purchased artworks found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
              gap: "56px 48px",
            }}
          >
            {artworks.map((artwork: Artwork) => (
              <Link
                key={artwork.id}
                href={`/artworks/${artwork.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {artwork.artwork_photo_url && (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1",
                      marginBottom: "18px",
                    }}
                  >
                    <Image
                      src={artwork.artwork_photo_url}
                      alt={artwork.title_en || artwork.title_jp}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}

                <p style={{ fontWeight: 600 }}>{artwork.title_en || artwork.title_jp}</p>
                {artwork.title_en && <p>{artwork.title_jp}</p>}
                {artwork.year && <p>{artwork.year}</p>}
                {artwork.material && <p>{artwork.material}</p>}
                {artwork.dimensions && <p>{artwork.dimensions}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}