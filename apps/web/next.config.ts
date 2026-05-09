import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin-login",
        destination: "/admin/login",
        permanent: true,
      },
      {
        source: "/admin-blindada.html",
        destination: "/admin/login",
        permanent: true,
      },
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: true,
      },
    ];
  },
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' https://res.cloudinary.com data: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              `connect-src 'self' ${apiUrl} https://wa.me`,
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
