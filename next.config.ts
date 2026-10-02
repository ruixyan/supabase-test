import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the mock-data browser checks separate from the developer's server.
  distDir: process.env.RESPONSIVE_TEST === "1" ? ".next-responsive" : ".next",
  allowedDevOrigins: process.env.RESPONSIVE_TEST === "1" ? ["127.0.0.1"] : undefined,
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
