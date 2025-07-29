/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    esmExternals: false,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://coinbitclub-market-bot.up.railway.app',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://coinbitclub-frontend-premium.vercel.app',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'coinbitclub-secret-2024',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*'
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: false
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: false
      }
    ];
  }
};

module.exports = nextConfig;