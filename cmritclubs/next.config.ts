import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ disables ESLint during `next build`
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ disables TypeScript build errors
  },

  serverExternalPackages: ['qpdf'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({ 'qpdf': 'qpdf' });
    }
    return config;
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
};
