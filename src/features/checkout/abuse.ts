/** A replaceable per-process throttle for a single Node VPS process. */
const attempts = new Map<string, { count: number; expires: number }>();
const windowMs = 10 * 60_000;

export function checkoutRateKey(request: Request): string {
  // Only trust x-real-ip if the deployment proxy overwrites it and blocks direct app access.
  if (process.env.CHECKOUT_TRUST_PROXY_IP_HEADER === "true") {
    const value = request.headers.get("x-real-ip")?.trim();
    if (value && value.length <= 45 && /^[0-9a-fA-F:.]+$/.test(value)) return `ip:${value}`;
  }
  return "unidentified";
}

export function allowCheckoutAttempt(key: string, now = Date.now()): boolean {
  const max = key === "unidentified" ? 100 : 10;
  if (attempts.size > 10000) {
    for (const [entryKey, value] of attempts) if (value.expires <= now) attempts.delete(entryKey);
    if (attempts.size > 10000) attempts.delete(attempts.keys().next().value!);
  }
  const entry = attempts.get(key);
  if (!entry || entry.expires <= now) { attempts.set(key, { count: 1, expires: now + windowMs }); return true; }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export async function readLimitedBody(request: Request, maxBytes: number): Promise<string | null> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) return null;
  if (request.headers.get("content-encoding") && request.headers.get("content-encoding") !== "identity") return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    const all = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
    try { return new TextDecoder("utf-8", { fatal: true }).decode(all); }
    catch { return null; }
  } finally { reader.releaseLock(); }
}
