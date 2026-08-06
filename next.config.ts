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
      {
        protocol: "https",
        hostname: "www.dropbox.com",
      },
      {
        protocol: "https",
        hostname: "dl.dropboxusercontent.com",
      },
      {
        protocol: "https",
        hostname: "previews.dropbox.com",
      },
    ],
  },
};

export default nextConfig;