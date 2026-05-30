export interface ApiKey {
  id: string;
  name: string;
  apiKey: string; // Plain visible text for the user to copy once (or masked)
  secretHash: string; // Internal hash pattern
  userId: string;
  rateLimit: number; // requests/minute or requests/month
  requestCount: number;
  permissions: string[]; // ['content', 'keywords', 'publishing', 'seo', 'analytics']
  createdAt: string;
  lastUsedAt?: string;
  status: "active" | "revoked";
  plan: "free" | "paid" | "enterprise";
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  userId: string;
  url: string;
  events: string[]; // ['article.generated', 'article.published', 'audit.completed', 'keywords.completed', 'ranking.updated']
  status: "active" | "inactive";
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  responseStatus: number;
  responseBody: string;
  timestamp: string;
  status: "success" | "failed";
  retryCount: number;
}

export interface ApiUsageLog {
  id: string;
  apiKeyId: string;
  userId: string;
  endpoint: string;
  method: string;
  status: number;
  responseTime: number; // millisecond count
  timestamp: string;
  ip?: string;
}

export interface DeveloperApp {
  id: string;
  name: string;
  userId: string;
  description?: string;
  createdAt: string;
}

export interface DeveloperPlatformDb {
  apiKeys: ApiKey[];
  webhooks: WebhookEndpoint[];
  webhookDeliveries: WebhookDelivery[];
  apiUsage: ApiUsageLog[];
  developerApps: DeveloperApp[];
}
