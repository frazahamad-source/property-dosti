import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/admin/brokers',
        destination: '/admin?view=brokers',
        permanent: true,
      },
      {
        source: '/admin/properties',
        destination: '/admin?view=properties',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
