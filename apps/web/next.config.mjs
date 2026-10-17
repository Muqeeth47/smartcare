import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProd = process.env.NODE_ENV === 'production';

// Sent with every page
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Nobody else may put SmartCare inside their own page (stops copy-cat overlays and click tricks)
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Camera is for the QR scanner and location is for finding nearby care. Nothing else is needed.
  { key: 'Permissions-Policy', value: 'camera=(self), geolocation=(self), microphone=(), payment=()' },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }] : []),
];

// Signed-in and sign-in screens: keep out of search engines, archives and shared caches
const privatePageHeaders = [
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
  { key: 'Cache-Control', value: 'no-store, max-age=0' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Optimize heavy barrel icon libraries like lucide-react
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
    turbo: {
      resolveAlias: {
        '@smartcare/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      },
    },
  },
  webpack(config) {
    config.resolve.alias['@smartcare/types'] = path.resolve(__dirname, '../../packages/types/src/index.ts');
    return config;
  },
  async redirects() {
    return [
      {
        source: '/donations',
        destination: '/dashboard/patient/donations',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/login', headers: privatePageHeaders },
      { source: '/dashboard/:path*', headers: privatePageHeaders },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
