/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'server',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;