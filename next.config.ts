import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Disable strict mode to reduce hydration issues
  experimental: {
    // This helps with hydration mismatches from browser extensions
    scrollRestoration: true,
  },
};

export default nextConfig;
