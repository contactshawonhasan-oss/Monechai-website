"use client";
import { useSyncExternalStore } from "react";
import { getDictionary } from "@/i18n/dictionary";
const subscribe = (callback: () => void) => { window.addEventListener("monechai:locale-change", callback); return () => window.removeEventListener("monechai:locale-change", callback); };
const snapshot = () => document.cookie.split("; ").includes("monechai-locale=bn") ? "bn" as const : "en" as const;
const serverSnapshot = () => "en" as const;
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = getDictionary(useSyncExternalStore(subscribe, snapshot, serverSnapshot));
  return <div className="container empty-state page-message" role="alert"><h1>{t.storeError}</h1><p>{t.storeErrorText}</p><button className="button button-gold" onClick={() => reset()}>{t.tryAgain}</button></div>;
}
