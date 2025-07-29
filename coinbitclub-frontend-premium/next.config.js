/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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