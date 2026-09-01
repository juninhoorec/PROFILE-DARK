/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Development and production must never overwrite each other's manifests.
  // This prevents a running local server from losing files when `npm run build` executes.
  distDir: process.env.npm_lifecycle_event === 'dev' ? '.next-dev' : '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
