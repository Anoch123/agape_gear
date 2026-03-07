import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize production builds
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Image optimization settings
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Experimental features for faster builds
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@supabase/ssr', '@supabase/supabase-js'],
  },

  // TypeScript during builds (disable for faster builds - run tsc separately)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
