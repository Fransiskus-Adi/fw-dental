import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    }];
  },
  async rewrites() {
    const backend = (process.env.BACKEND_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
    const resources = [
      "bookings", "bookings/available-slots", "services",
      "auth/forgot-password", "auth/reset-password",
    ];
    return resources.map((resource) => ({
      source: `/api/clinic/${resource}`,
      destination: `${backend}/${resource}`,
    }));
  },
};

export default nextConfig;
