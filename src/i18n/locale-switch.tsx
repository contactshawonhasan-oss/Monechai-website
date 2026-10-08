"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "./dictionary";

export function LocaleSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();
  return <label className="locale-switch"><span className="sr-only">Language / ভাষা</span>
    <select aria-label="Language / ভাষা" value={locale} onChange={(event) => {
      document.cookie = `monechai-locale=${event.target.value === "bn" ? "bn" : "en"}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      window.dispatchEvent(new Event("monechai:locale-change"));
      router.refresh();
    }}><option value="en">English</option><option value="bn">বাংলা</option></select>
  </label>;
}
