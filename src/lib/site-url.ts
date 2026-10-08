/** Only a verified absolute origin can be used in canonical URLs and structured data. */
export function siteOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) return null;
    return url.origin;
  } catch { return null; }
}

export function publicSiteOrigin(): string | null {
  const origin = siteOrigin();
  return origin?.startsWith("https://") ? origin : null;
}
