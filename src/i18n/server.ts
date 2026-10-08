import "server-only";
import { cookies } from "next/headers";
import type { Locale } from "./dictionary";

export async function getLocale(): Promise<Locale> {
  return (await cookies()).get("monechai-locale")?.value === "bn" ? "bn" : "en";
}
