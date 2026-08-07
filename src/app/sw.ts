import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    registration: {
      showNotification(title: string, options?: NotificationOptions): Promise<void>;
    };
    clients: {
      matchAll(options: { type: string; includeUncontrolled: boolean }): Promise<
        Array<{ url: string; navigate(url: string): Promise<{ focus(): void } | null> }>
      >;
      openWindow(url: string): Promise<{ focus(): void } | null>;
    };
  }
}

declare const self: WorkerGlobalScope;

interface SwPushData {
  json(): unknown;
  text(): string;
}
interface SwPushEvent {
  data: SwPushData | null;
  waitUntil(promise: Promise<unknown>): void;
}
interface SwNotificationClickEvent {
  notification: { close(): void; data?: { url?: string } };
  waitUntil(promise: Promise<unknown>): void;
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener("push", (rawEvent) => {
  const event = rawEvent as unknown as SwPushEvent;
  if (!event.data) return;
  let payload: { title?: string; body?: string; url?: string } = {};
  try {
    payload = (event.data.json() as { title?: string; body?: string; url?: string }) as {
      title?: string;
      body?: string;
      url?: string;
    };
  } catch {
    payload = { title: event.data.text() };
  }

  const title = payload.title ?? "FVMS";
  const options: NotificationOptions = {
    body: payload.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url ?? "/dashboard" },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => undefined),
  );
});

self.addEventListener("notificationclick", (rawEvent) => {
  const event = rawEvent as unknown as SwNotificationClickEvent;
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients: Array<{ url: string; navigate(url: string): Promise<{ focus(): void } | null> }>) => {
        for (const client of clients) {
          const url = new URL(client.url);
          if (url.pathname.startsWith(new URL(targetUrl, self.location.origin).pathname)) {
            return client.navigate(targetUrl).then((navigated) => navigated?.focus());
          }
        }
        return self.clients.openWindow(targetUrl).then(() => undefined);
      }),
  );
});
