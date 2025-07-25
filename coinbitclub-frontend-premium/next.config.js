/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  swcMinify: false,
  experimental: {
    serverComponentsExternalPackages: []
  }
};

module.exports = nextConfig;