/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removido experimental.appDir pois não é necessário para pages router
  images: {
    domains: ['localhost', 'api.coinbitclub.vip'],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/admin/:path*',
        destination: 'http://localhost:8082/api/admin/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8081/api/:path*',
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081',
    NEXT_PUBLIC_SSE_URL: process.env.NEXT_PUBLIC_SSE_URL || 'http://localhost:8081',
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
