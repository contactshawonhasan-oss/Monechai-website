import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A portable Node artifact for the VPS/Docker deployment goal.
  output: "standalone",
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL ? [{
      protocol: "https",
      hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
      pathname: "/storage/v1/object/public/products/**",
      search: "",
    }] : [],
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
      ...(process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
    ] }];
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/shop.html", destination: "/shop", permanent: true },
      { source: "/checkout.html", destination: "/checkout", permanent: true },
      { source: "/order-success.html", destination: "/checkout", permanent: true },
    ];
  },
};

export default nextConfig;
