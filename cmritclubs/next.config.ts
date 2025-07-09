import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['qpdf']
  },
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
  serverActions: {
    bodySizeLimit: '10mb'
  },

  // ✅ Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
