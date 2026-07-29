import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kanmbejtvkwifhibskow.supabase.co",
      },
      {
        protocol: "https",
        hostname: "static-assets.artlogic.net",
      },
    ],
  },
};

export default nextConfig;