import "server-only";

type Level = "info" | "warn" | "error";

/** Log operational events without request bodies, customer details or secrets. */
export function logEvent(level: Level, event: string, fields: Record<string, string | number | boolean> = {}) {
  const entry = JSON.stringify({ level, event, ...fields, time: new Date().toISOString() });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}
