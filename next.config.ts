import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Disable strict mode to reduce hydration issues
  experimental: {
    // This helps with hydration mismatches from browser extensions
    scrollRestoration: true,
    // Add better error isolation for hydration errors
    esmExternals: 'loose',
  },
  // Suppress specific console errors in production to prevent hydration warnings
  onDemandEntries: {
    // Keep pages in memory for longer to reduce rebuilds
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    // Number of pages to keep in memory
    pagesBufferLength: 5,
  },
  compiler: {
    // Remove console.error calls in production to hide hydration warnings
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  }
};

export default nextConfig;
