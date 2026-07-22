"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg text-sm">
      <WifiOff className="h-4 w-4" />
      Anda sedang offline
    </div>
  );
}
