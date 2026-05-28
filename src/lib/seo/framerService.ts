import fs from "fs";
import path from "path";
import crypto from "crypto";

// DB Path Definition
const framerDbPath = path.join(process.cwd(), "framer_db.json");

// System Secret Key for symmetric encryption
const ENCRYPTION_SECRET = process.env.CMS_ENCRYPTION_KEY || "ranksyncer_secure_pass_phrase_256";

// ==========================================
// DB TYPES & INTERFACES
// ==========================================
export interface FramerIntegration {
  id: string;
  user_id: string;
  project_id: string; // RankSyncer Project ID
  framer_site_id: string; // Framer internal project/site ID
  framer_collection_id: string; // Framer internal collection ID
  encrypted_api_token: string; // Secure token
  framer_project_name?: string;
  framer_collection_name?: string;
  created_at: string;
  is_active: boolean;
}

export interface FramerPublishLog {
  id: string;
  user_id: string;
  project_id: string;
  article_id: string;
  framer_site_id: string;
  cms_post_id?: string;
  publish_status: "success" | "failed";
  publish_error?: string;
  latency_ms: number;
  published_url?: string;
  created_at: string;
}

export interface FramerPublishQueueItem {
  id: string;
  user_id: string;
  project_id: string;
  article_id: string;
  framer_site_id: string;
  framer_collection_id: string;
  scheduled_publish_time: string; // ISO String
  publish_status: "pending" | "processing" | "success" | "failed";
  publish_error?: string;
  attempt_count: number;
  created_at: string;
}

export interface FramerDb {
  framer_integrations: FramerIntegration[];
  framer_publish_logs: FramerPublishLog[];
  framer_publish_queue: FramerPublishQueueItem[];
}

// ==========================================
// DB INITIALIZER & ACCESSORS
// ==========================================
export function readFramerDb(): FramerDb {
  try {
    if (!fs.existsSync(framerDbPath)) {
      const initialDb: FramerDb = {
        framer_integrations: [],
        framer_publish_logs: [],
        framer_publish_queue: []
      };
      fs.writeFileSync(framerDbPath, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const data = fs.readFileSync(framerDbPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[FRAMER DB READ ERROR]:", err);
    return {
      framer_integrations: [],
      framer_publish_logs: [],
      framer_publish_queue: []
    };
  }
}

export function writeFramerDb(db: FramerDb): void {
  try {
    fs.writeFileSync(framerDbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[FRAMER DB WRITE ERROR]:", err);
  }
}

// ==========================================
// SYMMETRIC API KEY ENCRYPTION (AES-256-CBC)
// ==========================================
export function encryptFramerToken(token: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (err) {
    console.error("[ENCRYPTION ERROR]:", err);
    return token;
  }
}

export function decryptFramerToken(encryptedToken: string): string {
  try {
    if (!encryptedToken.includes(":")) {
      return encryptedToken;
    }
    const [ivHex, encryptedHex] = encryptedToken.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[DECRYPTION ERROR]:", err);
    return encryptedToken;
  }
}

// ==========================================
// FORMATTING FOR FRAMER CMS
// ==========================================
export function convertMarkdownToRichHtml(markdown: string): string {
  if (!markdown) return "";
  let html = markdown;

  // Header mappings
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

  // Bold & Italics
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([\s\S]*?)\*/g, "<em>$1</em>");

  // Code formats
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Split double returns into clean HTML paragraph wrappers
  html = html.split(/\n\s*\n/).map(p => {
    const trimmed = p.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<li")) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
  }).join("\n");

  return html;
}

// ==========================================
// CORE PUBLISHING PIPELINE TO FRAMER
// ==========================================
export async function publishToFramer(params: {
  userId: string;
  projectId: string;
  article: {
    id: string;
    title: string;
    slug: string;
    content: string;
    metaDescription: string;
    featureImage?: string;
    targetKeyword?: string;
    tags?: string[];
  };
  siteId: string;
  collectionId: string;
  apiToken: string;
  status?: "draft" | "published" | "scheduled";
  scheduledPublishTime?: string;
  isSandbox?: boolean;
}): Promise<{
  success: boolean;
  publishedUrl?: string;
  cmsPostId?: string;
  error?: string;
}> {
  const startTime = Date.now();
  const { userId, projectId, article, siteId, collectionId, apiToken, status = "draft", scheduledPublishTime, isSandbox = false } = params;

  // Check Sandbox Mode
  const isMock = isSandbox || siteId.toLowerCase().includes("mock") || siteId.toLowerCase().includes("example") || apiToken === "mock-framer-api-token";

  if (isMock) {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulated lag
    const demoPostId = `framer-posts-${Math.floor(Math.random() * 900000 + 100000)}`;
    const mockUrl = `https://framer.media/p/preview-${article.slug || "demo"}`;

    const db = readFramerDb();
    db.framer_publish_logs.push({
      id: `flog-${crypto.randomUUID()}`,
      user_id: userId,
      project_id: projectId,
      article_id: article.id,
      framer_site_id: siteId,
      cms_post_id: demoPostId,
      publish_status: "success",
      latency_ms: Date.now() - startTime,
      published_url: mockUrl,
      created_at: new Date().toISOString()
    });
    writeFramerDb(db);

    return {
      success: true,
      publishedUrl: mockUrl,
      cmsPostId: demoPostId
    };
  }

  try {
    // Official Framer Sites CMS API structures items creation:
    // Base URL: https://api.framer.com/v1/projects/:projectId/collections/:collectionId/items
    const endpoint = `https://api.framer.com/v1/projects/${siteId}/collections/${collectionId}/items`;
    const formattedHtml = convertMarkdownToRichHtml(article.content);

    // Dynamic field mapping as supported by Framer CMS Collection Item schemas
    const payload = {
      title: article.title,
      slug: article.slug,
      status: status === "published" ? "published" : "draft", // Framer fields normally handle simple state toggles
      fields: {
        "title": article.title,
        "slug": article.slug,
        "content": formattedHtml,
        "excerpt": article.metaDescription,
        "meta-title": article.title,
        "meta-description": article.metaDescription,
        "featured-image": article.featureImage || null,
        "canonical-url": `https://${siteId}.framer.website/${article.slug}`,
        "tags": article.tags ? article.tags.join(", ") : "AI, RankSyncer",
        "created-at": new Date().toISOString()
      }
    };

    if (status === "scheduled" && scheduledPublishTime) {
      // Add scheduled property if custom field exists on site collection metadata
      (payload.fields as any)["scheduled-publish"] = new Date(scheduledPublishTime).toISOString();
    }

    console.log(`[FRAMER PUBLISH DISPATCH]: Sending post to Framer endpoint: ${endpoint}`);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Framer API dismissed post. Status: ${res.status}. Reason: ${errText}`);
    }

    const resData = await res.json() as any;
    const cmsPostId = resData?.id || `framer-item-${Math.floor(Math.random() * 100000)}`;
    const publishedUrl = resData?.url || `https://${siteId}.framer.website/${article.slug}`;

    // Publish successfully, log information
    const db = readFramerDb();
    db.framer_publish_logs.push({
      id: `flog-${crypto.randomUUID()}`,
      user_id: userId,
      project_id: projectId,
      article_id: article.id,
      framer_site_id: siteId,
      cms_post_id: cmsPostId,
      publish_status: "success",
      latency_ms: Date.now() - startTime,
      published_url: publishedUrl,
      created_at: new Date().toISOString()
    });
    writeFramerDb(db);

    return {
      success: true,
      publishedUrl,
      cmsPostId
    };

  } catch (err: any) {
    const errorString = err.message || "Failed post synchronization flow to Framer CMS";
    console.error(`[FRAMER CMS ERROR]:`, err);

    const db = readFramerDb();
    db.framer_publish_logs.push({
      id: `flog-${crypto.randomUUID()}`,
      user_id: userId,
      project_id: projectId,
      article_id: article.id,
      framer_site_id: siteId,
      publish_status: "failed",
      latency_ms: Date.now() - startTime,
      publish_error: errorString,
      created_at: new Date().toISOString()
    });
    writeFramerDb(db);

    return {
      success: false,
      error: errorString
    };
  }
}

// ==========================================
// BACKGROUND AUTOMATION PUBLISHING MANAGER
// ==========================================
export function startFramerQueueWorker(): void {
  setInterval(async () => {
    try {
      const db = readFramerDb();
      const now = new Date();

      const pendingItems = db.framer_publish_queue.filter(
        item => item.publish_status === "pending" && new Date(item.scheduled_publish_time) <= now
      );

      if (pendingItems.length === 0) return;

      console.log(`[FRAMER QUEUE SYSTEM]: Found ${pendingItems.length} publications to release automatically to Framer.`);

      for (const item of pendingItems) {
        item.publish_status = "processing";
        writeFramerDb(db);

        const integration = db.framer_integrations.find(
          i => i.framer_site_id === item.framer_site_id && i.project_id === item.project_id && i.is_active
        );

        if (!integration) {
          item.publish_status = "failed";
          item.publish_error = "Active Framer site integration credentials could not be found.";
          writeFramerDb(db);
          continue;
        }

        const apiToken = decryptFramerToken(integration.encrypted_api_token);

        const mockArticle = {
          id: item.article_id,
          title: "Framer Release - " + new Date().toDateString(),
          slug: "scheduled-framer-release-" + Math.floor(Math.random() * 9000),
          content: "### Released natively into Framer CMS\n\nRankSyncer premium autopilot release engine synced this successfully.",
          metaDescription: "Automatic synchronization optimized for topical indexing and responsive layout structure.",
          tags: ["Framer", "SEO", "RankSyncer"]
        };

        const result = await publishToFramer({
          userId: item.user_id,
          projectId: item.project_id,
          article: mockArticle,
          siteId: item.framer_site_id,
          collectionId: item.framer_collection_id,
          apiToken,
          status: "published"
        });

        const refreshedDb = readFramerDb();
        const freshItem = refreshedDb.framer_publish_queue.find(fqi => fqi.id === item.id);

        if (freshItem) {
          if (result.success) {
            freshItem.publish_status = "success";
          } else {
            freshItem.publish_status = "failed";
            freshItem.publish_error = result.error;
            freshItem.attempt_count += 1;
            if (freshItem.attempt_count < 3) {
              freshItem.publish_status = "pending";
              console.log(`[FRAMER QUEUE RETRY]: Scheduled item ${freshItem.id} queued for retry attempt #${freshItem.attempt_count}`);
            }
          }
          writeFramerDb(refreshedDb);
        }
      }
    } catch (err) {
      console.error("[FRAMER CMS QUEUE WORKER EXCEPTION]:", err);
    }
  }, 30000); // 30 second timer
}
