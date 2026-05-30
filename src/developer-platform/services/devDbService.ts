import fs from "fs";
import path from "path";
import crypto from "crypto";
import { DeveloperPlatformDb, ApiKey, WebhookEndpoint, WebhookDelivery, ApiUsageLog, DeveloperApp } from "../types/devTypes";

const DB_FILE = path.join(process.cwd(), "developer_platform_db.json");

function getInitialDb(): DeveloperPlatformDb {
  const now = new Date();
  
  // Create some realistic historical dates
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };

  // Seed default Api Keys
  const seedKeys: ApiKey[] = [
    {
      id: "key-starter-demo",
      name: "Production Workspace Key",
      apiKey: "rs_live_3f78a2e1d09c8b6a5f4e3d2c1b0a9f8e",
      secretHash: crypto.createHash("sha256").update("rs_live_3f78a2e1d09c8b6a5f4e3d2c1b0a9f8e").digest("hex"),
      userId: "demo-user",
      rateLimit: 60,
      requestCount: 342,
      permissions: ["content", "keywords", "publishing", "seo", "analytics"],
      createdAt: daysAgo(15),
      lastUsedAt: daysAgo(0),
      status: "active",
      plan: "paid"
    },
    {
      id: "key-revoked-demo",
      name: "Staging Sandbox Key",
      apiKey: "rs_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d",
      secretHash: crypto.createHash("sha256").update("rs_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d").digest("hex"),
      userId: "demo-user",
      rateLimit: 15,
      requestCount: 8,
      permissions: ["seo", "analytics"],
      createdAt: daysAgo(30),
      lastUsedAt: daysAgo(29),
      status: "revoked",
      plan: "free"
    }
  ];

  // Seed default Webhook list
  const seedWebhooks: WebhookEndpoint[] = [
    {
      id: "webhook-demo-1",
      name: "Zapier Content Integrator",
      userId: "demo-user",
      url: "https://hooks.zapier.com/hooks/catch/12345/abcde",
      events: ["article.generated", "article.published"],
      status: "active",
      createdAt: daysAgo(10)
    },
    {
      id: "webhook-demo-2",
      name: "Slack Audit Alerts Trigger",
      userId: "demo-user",
      url: "https://hooks.slack.com/services/T000/B000/XXXXXX",
      events: ["audit.completed", "ranking.updated"],
      status: "inactive",
      createdAt: daysAgo(5)
    }
  ];

  // Seed default Deliveries logs
  const seedDeliveries: WebhookDelivery[] = [
    {
      id: "del-1",
      webhookId: "webhook-demo-1",
      event: "article.published",
      payload: {
        articleId: "art-9988",
        title: "Top 10 Emerging SEO Trends in 2026",
        slug: "top-10-seo-trends-2026",
        publishedAt: daysAgo(1),
        cms: "Ghost"
      },
      responseStatus: 200,
      responseBody: '{"status":"success","deliveryId":"zap-98218"}',
      timestamp: daysAgo(1),
      status: "success",
      retryCount: 0
    },
    {
      id: "del-2",
      webhookId: "webhook-demo-1",
      event: "article.generated",
      payload: {
        articleId: "art-9988",
        keyword: "SEO automated content",
        wordCount: 1650
      },
      responseStatus: 504,
      responseBody: "Gateway Timeout - Hook server unreachable",
      timestamp: daysAgo(2),
      status: "failed",
      retryCount: 2
    }
  ];

  // Seed default API usages
  const endpointCatalog = [
    { m: "POST", e: "/api/developer/content/create", r: 1200 },
    { m: "POST", e: "/api/developer/content/rewrite", r: 850 },
    { m: "POST", e: "/api/developer/keywords/generate", r: 420 },
    { m: "GET", e: "/api/developer/seo/audit", r: 2100 },
    { m: "GET", e: "/api/developer/analytics/rankings", r: 150 }
  ];

  const seedUsage: ApiUsageLog[] = [];
  let count = 0;
  // Generate 70 request records distributed across the last 7 days
  for (let i = 7; i >= 0; i--) {
    const recordsPerDay = 8 + Math.floor(Math.random() * 8);
    for (let r = 0; r < recordsPerDay; r++) {
      count++;
      const ep = endpointCatalog[Math.floor(Math.random() * endpointCatalog.length)];
      const success = Math.random() > 0.08;
      const status = success ? 200 : (Math.random() > 0.5 ? 429 : 500);
      
      const hour = 8 + Math.floor(Math.random() * 12);
      const min = Math.floor(Math.random() * 60);
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(hour, min, 0, 0);

      seedUsage.push({
        id: `usage-${count}`,
        apiKeyId: "key-starter-demo",
        userId: "demo-user",
        endpoint: ep.e,
        method: ep.m,
        status,
        responseTime: ep.r + Math.floor(Math.random() * 600),
        timestamp: d.toISOString(),
        ip: "74.120.250.8"
      });
    }
  }

  return {
    apiKeys: seedKeys,
    webhooks: seedWebhooks,
    webhookDeliveries: seedDeliveries,
    apiUsage: seedUsage,
    developerApps: [
      {
        id: "app-1",
        name: "Enterprise Rank Dashboard Hub",
        userId: "demo-user",
        description: "Connects RankSyncer data directly to internal enterprise dashboard",
        createdAt: daysAgo(12)
      }
    ]
  };
}

export const devDbService = {
  readDevDb(): DeveloperPlatformDb {
    try {
      if (!fs.existsSync(DB_FILE)) {
        const initial = getInitialDb();
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
        return initial;
      }
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (e) {
      console.error("[devDbService.readDevDb FAULT]:", e);
      return getInitialDb();
    }
  },

  writeDevDb(db: DeveloperPlatformDb): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch (e) {
      console.error("[devDbService.writeDevDb FAULT]:", e);
    }
  },

  getApiKeys(userId: string): ApiKey[] {
    const db = this.readDevDb();
    return db.apiKeys.filter(key => key.userId === userId);
  },

  createApiKey(userId: string, name: string, plan: "free" | "paid" | "enterprise", permissions: string[]): ApiKey {
    const db = this.readDevDb();
    
    // Generate a secure API key
    const randomHex = crypto.randomBytes(16).toString("hex");
    const apiKey = `rs_live_${randomHex}`;
    const secretHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const rateLimit = plan === "enterprise" ? 1000 : (plan === "paid" ? 120 : 15);

    const newKey: ApiKey = {
      id: `key-${crypto.randomBytes(6).toString("hex")}`,
      name: name || "Unnamed API Key",
      apiKey,
      secretHash,
      userId,
      rateLimit,
      requestCount: 0,
      permissions,
      createdAt: new Date().toISOString(),
      status: "active",
      plan
    };

    db.apiKeys.push(newKey);
    this.writeDevDb(db);
    return newKey;
  },

  revokeApiKey(userId: string, keyId: string): boolean {
    const db = this.readDevDb();
    const key = db.apiKeys.find(k => k.userId === userId && k.id === keyId);
    if (key) {
      key.status = "revoked";
      this.writeDevDb(db);
      return true;
    }
    return false;
  },

  rotateApiKey(userId: string, keyId: string): ApiKey | null {
    const db = this.readDevDb();
    const key = db.apiKeys.find(k => k.userId === userId && k.id === keyId);
    if (key) {
      const randomHex = crypto.randomBytes(16).toString("hex");
      const apiKey = `rs_live_${randomHex}`;
      const secretHash = crypto.createHash("sha256").update(apiKey).digest("hex");

      key.apiKey = apiKey;
      key.secretHash = secretHash;
      key.createdAt = new Date().toISOString();
      this.writeDevDb(db);
      return key;
    }
    return null;
  },

  getWebhooks(userId: string): WebhookEndpoint[] {
    const db = this.readDevDb();
    return db.webhooks.filter(w => w.userId === userId);
  },

  getWebhookDeliveries(userId: string): WebhookDelivery[] {
    const db = this.readDevDb();
    const webhookIds = db.webhooks.filter(w => w.userId === userId).map(w => w.id);
    return db.webhookDeliveries.filter(d => webhookIds.includes(d.webhookId));
  },

  createWebhook(userId: string, name: string, url: string, events: string[]): WebhookEndpoint {
    const db = this.readDevDb();
    const newWebhook: WebhookEndpoint = {
      id: `wh-${crypto.randomBytes(6).toString("hex")}`,
      name: name || "System Integrator Hook",
      userId,
      url,
      events,
      status: "active",
      createdAt: new Date().toISOString()
    };
    db.webhooks.push(newWebhook);
    this.writeDevDb(db);
    return newWebhook;
  },

  updateWebhook(userId: string, webhookId: string, payload: Partial<WebhookEndpoint>): WebhookEndpoint | null {
    const db = this.readDevDb();
    const hook = db.webhooks.find(w => w.userId === userId && w.id === webhookId);
    if (hook) {
      if (payload.name !== undefined) hook.name = payload.name;
      if (payload.url !== undefined) hook.url = payload.url;
      if (payload.events !== undefined) hook.events = payload.events;
      if (payload.status !== undefined) hook.status = payload.status;
      this.writeDevDb(db);
      return hook;
    }
    return null;
  },

  deleteWebhook(userId: string, webhookId: string): boolean {
    const db = this.readDevDb();
    const filterLen = db.webhooks.length;
    db.webhooks = db.webhooks.filter(w => !(w.userId === userId && w.id === webhookId));
    if (db.webhooks.length !== filterLen) {
      // Clean deliveries associated
      db.webhookDeliveries = db.webhookDeliveries.filter(d => d.webhookId !== webhookId);
      this.writeDevDb(db);
      return true;
    }
    return false;
  },

  triggerWebhookMockDelivery(userId: string, webhookId: string, event: string): WebhookDelivery | null {
    const db = this.readDevDb();
    const hook = db.webhooks.find(w => w.userId === userId && w.id === webhookId);
    if (!hook) return null;

    let testPayload: any = {
      event,
      timestamp: new Date().toISOString(),
      triggeredBy: "mock_console_tester"
    };

    if (event === "article.generated") {
      testPayload.article = {
        id: "art-5521",
        title: "Advanced Keyword Pruning with RankSyncer",
        wordCount: 1820,
        slug: "keyword-pruning-ranksyncer",
        seoScore: 92
      };
    } else if (event === "audit.completed") {
      testPayload.audit = {
        domain: "clientportfolio.com",
        score: 87,
        sslValid: true,
        pagesCrawled: 48,
        criticalErrors: 2
      };
    } else {
      testPayload.data = {
        status: "updated",
        batchId: "bat-9e8d"
      };
    }

    const responseStatus = 200;
    const responseBody = JSON.stringify({ success: true, received: true, id: `test-del-${Math.floor(Math.random() * 9999)}` });

    const newDelivery: WebhookDelivery = {
      id: `del-${crypto.randomBytes(6).toString("hex")}`,
      webhookId: hook.id,
      event,
      payload: testPayload,
      responseStatus,
      responseBody,
      timestamp: new Date().toISOString(),
      status: "success",
      retryCount: 0
    };

    db.webhookDeliveries.unshift(newDelivery);
    if (db.webhookDeliveries.length > 100) db.webhookDeliveries.pop();
    this.writeDevDb(db);
    return newDelivery;
  },

  retryWebhookDelivery(userId: string, deliveryId: string): WebhookDelivery | null {
    const db = this.readDevDb();
    const del = db.webhookDeliveries.find(d => d.id === deliveryId);
    if (del) {
      del.retryCount += 1;
      del.timestamp = new Date().toISOString();
      del.status = "success"; // mark as resolved on retry simulation
      del.responseStatus = 200;
      del.responseBody = JSON.stringify({ status: "ok", message: "Retried and resolved programmatically" });
      this.writeDevDb(db);
      return del;
    }
    return null;
  },

  logRequest(apiKey: string, endpoint: string, method: string, status: number, responseTime: number, ip: string = "127.0.0.1"): void {
    const db = this.readDevDb();
    
    // Find key by plaintext api key OR hash
    const hash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const key = db.apiKeys.find(k => k.apiKey === apiKey || k.secretHash === hash);
    
    if (key && key.status === "active") {
      key.requestCount += 1;
      key.lastUsedAt = new Date().toISOString();

      const newLog: ApiUsageLog = {
        id: `usage-${crypto.randomBytes(6).toString("hex")}`,
        apiKeyId: key.id,
        userId: key.userId,
        endpoint,
        method,
        status,
        responseTime,
        timestamp: new Date().toISOString(),
        ip
      };

      db.apiUsage.unshift(newLog);
      if (db.apiUsage.length > 500) db.apiUsage.pop();
      this.writeDevDb(db);
    }
  },

  getUsageLogs(userId: string): ApiUsageLog[] {
    const db = this.readDevDb();
    return db.apiUsage.filter(u => u.userId === userId);
  }
};
