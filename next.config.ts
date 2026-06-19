import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/n8n/:path*",
        destination: "https://simengliu.app.n8n.cloud/webhook/:path*",
      },
    ];
  },
};

export default nextConfig;
