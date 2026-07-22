"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type Locale = "id" | "en";
type Messages = Record<string, string>;

const STORAGE_KEY = "fvms_locale";

const messagesCache = new Map<Locale, Messages>();

async function loadMessages(locale: Locale): Promise<Messages> {
  if (messagesCache.has(locale)) return messagesCache.get(locale)!;
  const msgs = await import(`/messages/${locale}.json`);
  messagesCache.set(locale, msgs.default ?? msgs);
  return messagesCache.get(locale)!;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "id",
  setLocale: () => {},
  t: (k) => k,
  ready: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");
  const [messages, setMessages] = useState<Messages>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null) as Locale | null;
    const initial: Locale = stored === "en" ? "en" : "id";
    setLocaleState(initial);
    loadMessages(initial).then((msgs) => {
      setMessages(msgs);
      setReady(true);
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.cookie = `locale=${l};path=/;max-age=31536000`;
    loadMessages(l).then(setMessages);
  }, []);

  const t = useCallback(
    (key: string): string => messages[key] ?? key,
    [messages],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, ready }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useTranslation() {
  const { t } = useI18n();
  return { t };
}
