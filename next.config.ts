import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ofeakmhuaspzgwolxjnj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
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
