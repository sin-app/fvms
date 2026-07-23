export async function getVapidKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push/vapid-key");
    if (!res.ok) return null;
    const { publicKey } = await res.json();
    return publicKey ?? null;
  } catch {
    return null;
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const publicKey = await getVapidKey();
  if (!publicKey) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as never,
  });

  const sub = subscription.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });

  return res.ok;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();

  const res = await fetch("/api/push/unsubscribe", { method: "POST" });
  return res.ok;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
