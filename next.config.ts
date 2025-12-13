import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Local development
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
      // Production backend
      {
        protocol: 'https',
        hostname: 'tawsila-backend-odj7.onrender.com',
        pathname: '/storage/**',
      },
      // Unsplash images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    // Disable optimization for external images to avoid Vercel caching issues
    unoptimized: process.env.NODE_ENV === 'production',
  },
};

export default withNextIntl(nextConfig);
