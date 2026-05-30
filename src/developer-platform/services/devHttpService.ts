import { ApiKey, WebhookEndpoint, WebhookDelivery, ApiUsageLog } from "../types/devTypes";

export const devHttpService = {
  async getKeys(): Promise<ApiKey[]> {
    const res = await fetch("/api/developer/keys");
    const body = await res.json();
    return body.success ? body.keys : [];
  },

  async createKey(name: string, plan: "free" | "paid" | "enterprise", permissions: string[]): Promise<ApiKey | null> {
    const res = await fetch("/api/developer/keys/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, plan, permissions })
    });
    const body = await res.json();
    return body.success ? body.key : null;
  },

  async revokeKey(keyId: string): Promise<boolean> {
    const res = await fetch("/api/developer/keys/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId })
    });
    const body = await res.json();
    return !!body.success;
  },

  async rotateKey(keyId: string): Promise<ApiKey | null> {
    const res = await fetch("/api/developer/keys/rotate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId })
    });
    const body = await res.json();
    return body.success ? body.key : null;
  },

  async getWebhooks(): Promise<WebhookEndpoint[]> {
    const res = await fetch("/api/developer/webhooks");
    const body = await res.json();
    return body.success ? body.webhooks : [];
  },

  async createWebhook(name: string, url: string, events: string[]): Promise<WebhookEndpoint | null> {
    const res = await fetch("/api/developer/webhooks/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, events })
    });
    const body = await res.json();
    return body.success ? body.webhook : null;
  },

  async updateWebhook(webhookId: string, payload: Partial<WebhookEndpoint>): Promise<WebhookEndpoint | null> {
    const res = await fetch("/api/developer/webhooks/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookId, ...payload })
    });
    const body = await res.json();
    return body.success ? body.webhook : null;
  },

  async deleteWebhook(webhookId: string): Promise<boolean> {
    const res = await fetch("/api/developer/webhooks/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookId })
    });
    const body = await res.json();
    return !!body.success;
  },

  async getDeliveries(): Promise<WebhookDelivery[]> {
    const res = await fetch("/api/developer/webhooks/deliveries");
    const body = await res.json();
    return body.success ? body.deliveries : [];
  },

  async triggerWebhookTest(webhookId: string, event: string): Promise<WebhookDelivery | null> {
    const res = await fetch("/api/developer/webhooks/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookId, event })
    });
    const body = await res.json();
    return body.success ? body.delivery : null;
  },

  async retryDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
    const res = await fetch("/api/developer/webhooks/deliveries/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryId })
    });
    const body = await res.json();
    return body.success ? body.delivery : null;
  },

  async getUsageLogs(): Promise<ApiUsageLog[]> {
    const res = await fetch("/api/developer/usage-logs");
    const body = await res.json();
    return body.success ? body.logs : [];
  }
};
