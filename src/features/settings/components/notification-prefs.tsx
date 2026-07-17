"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const STORAGE_KEY = "fvms_notification_prefs";

interface NotificationPrefs {
  pushEnabled: boolean;
  emailEnabled: boolean;
}

function loadPrefs(): NotificationPrefs {
  if (typeof window === "undefined") {
    return { pushEnabled: true, emailEnabled: false };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { pushEnabled: true, emailEnabled: false };
}

export function NotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [saved, setSaved] = useState(false);

  function update(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="push">Notifikasi Push</Label>
          <p className="text-sm text-muted-foreground">
            Terima notifikasi di aplikasi
          </p>
        </div>
        <Switch
          id="push"
          checked={prefs.pushEnabled}
          onCheckedChange={(v) => update("pushEnabled", v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="email">Notifikasi Email</Label>
          <p className="text-sm text-muted-foreground">
            Terima notifikasi via email
          </p>
        </div>
        <Switch
          id="email"
          checked={prefs.emailEnabled}
          onCheckedChange={(v) => update("emailEnabled", v)}
        />
      </div>

      {saved && (
        <p className="text-sm text-green-600">
          Preferensi tersimpan
        </p>
      )}
    </div>
  );
}
