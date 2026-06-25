import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

type Artist = {
  id: number;
  name: string | null;
  name_en: string | null;
  name_jp: string | null;
  artist_photo_url: string | null;
  nationality: string | null;
  birth_year: string | null;
};

export default async function ArtistsPage() {
  const supabase = await createClient();

  const { data: artists, error } = await supabase
    .from("artists")
    .select("id, name, name_en, name_jp, artist_photo_url, nationality, birth_year")
    .order("name_en", { ascending: true });

  if (error) {
    return (
      <main style={{ padding: "48px 72px" }}>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 260px",
        gap: "48px",
        padding: "48px 72px",
        maxWidth: "1600px",
        margin: "0 auto",
        alignItems: "start",
      }}
    >
      <main>
        {!artists || artists.length === 0 ? (
          <p>No artists found.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
              gap: "56px 48px",
              alignItems: "start",
            }}
          >
            {artists.map((artist: Artist) => {
              const displayName =
                artist.name_en || artist.name || artist.name_jp || "Untitled Artist";

              return (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  {artist.artist_photo_url && (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        position: "relative",
                        marginBottom: "16px",
                        overflow: "hidden",
                        background: "#f3f3f3",
                      }}
                    >
                      <Image
                        src={artist.artist_photo_url}
                        alt={displayName}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}

                  <h2
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "20px",
                      fontWeight: 700,
                      lineHeight: 1.3,
                    }}
                  >
                    {displayName}
                  </h2>

                  {artist.name_jp && artist.name_jp !== displayName && (
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "14px",
                        lineHeight: 1.4,
                        color: "#555",
                      }}
                    >
                      {artist.name_jp}
                    </p>
                  )}

                  {(artist.nationality || artist.birth_year) && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        lineHeight: 1.4,
                        color: "#555",
                      }}
                    >
                      {[artist.nationality, artist.birth_year]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <aside
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          position: "sticky",
          top: "48px",
        }}
      >
        <div
          style={{
            border: "1px solid #bdbdbd",
            padding: "14px",
            background: "#fafafa",
          }}
        >
          <p
            style={{
              margin: "0 0 10px 0",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            View Mode
          </p>

          <Link
            href="/artworks"
            style={{
              display: "block",
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #9c1515",
              background: "#9c1515",
              color: "white",
              textDecoration: "none",
              textAlign: "center",
              fontSize: "13px",
              boxSizing: "border-box",
            }}
          >
            Switch to Artworks
          </Link>
        </div>
      </aside>
    </div>
  );
}