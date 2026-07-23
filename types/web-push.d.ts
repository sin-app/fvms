declare module "web-push" {
  interface PushSubscription {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }

  interface VapidKeys {
    publicKey: string;
    privateKey: string;
  }

  interface RequestOptions {
    TTL?: number;
    vapidDetails?: {
      subject: string;
      publicKey: string;
      privateKey: string;
    };
  }

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string,
  ): void;

  export function generateVAPIDKeys(): VapidKeys;

  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions,
  ): Promise<void>;
}
