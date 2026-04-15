/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ✅ ENABLED: Auto-serve WebP/AVIF, huge bandwidth saving
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // Cache 24hrs on CDN
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  // 🚀 Reduce JS bundle by treeshaking large packages
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;

