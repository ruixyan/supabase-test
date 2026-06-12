import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import Image from "next/image";

async function FlowersData() {
  const supabase = await createClient();
  const { data: flowers, error } = await supabase.from("flowers").select();

  if (error) {
    return <pre>Error: {JSON.stringify(error, null, 2)}</pre>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", padding: "24px" }}>
      {flowers?.map((flower) => (
        <div key={flower.id} style={{ width: "200px", textAlign: "center" }}>
          <Image
            src={flower.image_url}
            alt={flower.name}
            width={200}
            height={200}
            style={{ objectFit: "cover", borderRadius: "8px" }}
          />
          <h2>{flower.name}</h2>
          <p style={{ fontSize: "14px" }}>{flower.description}</p>
        </div>
      ))}
    </div>
  );
}

export default function Flowers() {
  return (
    <Suspense fallback={<div>Loading flowers...</div>}>
      <FlowersData />
    </Suspense>
  );
}