/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'export' to allow dynamic API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack(config) {
    // Turn off persistent (filesystem) caching to avoid ENOENT warnings
    config.cache = false;
    return config;
  }
};

module.exports = nextConfig;
