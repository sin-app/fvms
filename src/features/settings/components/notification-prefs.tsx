"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/features/notifications/services/push-manager";
import { Loader2 } from "lucide-react";

export function NotificationPrefs() {
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    isPushSubscribed().then(setSubscribed);
  }, []);

  async function handlePushToggle(v: boolean) {
    setLoading(true);
    try {
      if (v) {
        const ok = await subscribeToPush();
        setSubscribed(ok);
      } else {
        await unsubscribeFromPush();
        setSubscribed(false);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5 min-w-0 flex-1">
          <Label htmlFor="push">Notifikasi Push</Label>
          <p className="text-sm text-muted-foreground">
            {subscribed ? "Terdaftar untuk notifikasi push" : "Terima notifikasi real-time di perangkat"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Switch
            id="push"
            checked={subscribed}
            onCheckedChange={handlePushToggle}
            disabled={loading}
          />
        </div>
      </div>

      {saved && (
        <p className="text-sm text-green-600">
          {subscribed ? "Notifikasi push diaktifkan" : "Notifikasi push dinonaktifkan"}
        </p>
      )}
    </div>
  );
}
