import type { MetadataRoute } from "next";
import { publicSiteOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const origin = publicSiteOrigin();
  if (!origin) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/checkout", "/order/"] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
