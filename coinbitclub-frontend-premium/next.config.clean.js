/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configurações para build limpo
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['pages', 'components', 'src']
  },
  
  typescript: {
    ignoreBuildErrors: false
  },

  // Webpack config para ignorar arquivos problemáticos
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ignorar arquivos problemáticos
    config.module.rules.push({
      test: /\.(tsx|ts|jsx|js)$/,
      exclude: [
        /dashboard-broken/,
        /\.problem$/,
        /\.corrupted/,
        /\.disabled$/,
        /\.temp-backup$/,
        /src\/lib\/mocks/,
        /src\/pages\//,
        /src\/styles\/theme\.ts/,
        /src\/utils\/validation\.ts/
      ]
    });

    return config;
  },

  // Ignorar páginas problemáticas no build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].map(ext => {
    return `*.!(broken|problem|corrupted|disabled|temp-backup).${ext}`;
  }).flat(),

  // Configurações de otimização
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', 'framer-motion']
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
