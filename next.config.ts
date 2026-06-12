import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kanmbejtvkwifhibskow.supabase.co",
      },
    ],
  },
};

export default nextConfig;