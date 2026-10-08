"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAdmin } from "./auth";
import { saveSettings, saveZone, settingsInput, zoneInput } from "./settings";

export type SettingsState = { message: string };
export async function saveSettingsAction(_state: SettingsState, form: FormData): Promise<SettingsState> {
  void _state;
  await requireAdmin();
  const parsed = settingsInput.safeParse({ storeName: form.get("storeName"), whatsappNumber: form.get("whatsappNumber"),
    hotline: form.get("hotline"), supportEmail: form.get("supportEmail"), contactAddress: form.get("contactAddress"), codEnabled: form.has("codEnabled") });
  if (!parsed.success) return { message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  await saveSettings(getDb(), parsed.data);
  revalidatePath("/admin/settings"); revalidatePath("/checkout");
  return { message: "Store settings saved." };
}
export async function saveZoneAction(_state: SettingsState, form: FormData): Promise<SettingsState> {
  void _state;
  await requireAdmin();
  const parsed = zoneInput.safeParse({ code: form.get("code"), feeMinor: form.get("feeMinor"), freeAboveMinor: form.get("freeAboveMinor") });
  if (!parsed.success) return { message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  await saveZone(getDb(), parsed.data);
  revalidatePath("/admin/settings"); revalidatePath("/checkout");
  return { message: "Delivery fee saved. New checkouts use the new rate; existing order totals stay unchanged." };
}
