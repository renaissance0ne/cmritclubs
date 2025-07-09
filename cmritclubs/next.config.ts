import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ✅ disables TypeScript errors during build
  },
  
  // Moved from experimental.serverComponentsExternalPackages
  serverExternalPackages: ['qpdf'],
  
  // Include the qpdf binaries in the deployment
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure qpdf binaries are included in the server build
      config.externals = config.externals || [];
      config.externals.push({
        'qpdf': 'qpdf'
      });
    }
    return config;
  },
  
  // Configure body size limit for server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
};