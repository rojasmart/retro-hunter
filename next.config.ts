import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "**.mercadolivre.com.br",
      },
      {
        protocol: "https",
        hostname: "**.olx.com.br",
      },
      {
        protocol: "https",
        hostname: "**.amazon.com.br",
      },
      {
        protocol: "https",
        hostname: "i.ebayimg.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
    ];
  },
/*   async rewrites() {
    return [
      {
        source: "/api/:path*", // Rota no frontend
        destination: "http://127.0.0.1:8000/:path*", // Redirecionar para o backend FastAPI
      },
    ];
  }, */
};

export default nextConfig;
