"use client";

import { useI18n } from "@/lib/i18n/context";
import { Check } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="space-y-2">
      <button
        onClick={() => setLocale("id")}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${locale === "id" ? "border-primary bg-primary/5" : "border-input hover:bg-muted"}`}
      >
        <span>Bahasa Indonesia</span>
        {locale === "id" && <Check className="h-4 w-4 text-primary" />}
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${locale === "en" ? "border-primary bg-primary/5" : "border-input hover:bg-muted"}`}
      >
        <span>English</span>
        {locale === "en" && <Check className="h-4 w-4 text-primary" />}
      </button>
    </div>
  );
}
