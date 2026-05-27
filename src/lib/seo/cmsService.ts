import fs from "fs";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";

// DB Path Definition
const ghostDbPath = path.join(process.cwd(), "ghost_db.json");

// System Secret Key for symmetric encryption
const ENCRYPTION_SECRET = process.env.CMS_ENCRYPTION_KEY || "ranksyncer_secure_pass_phrase_256";

// ==========================================
// DB TYPES & INTERFACES
// ==========================================
export interface GhostIntegration {
  id: string;
  user_id: string;
  project_id: string;
  ghost_site_url: string;
  encrypted_api_key: string;
  created_at: string;
  is_active: boolean;
}

export interface GhostSite {
  id: string;
  user_id: string;
  project_id: string;
  ghost_site_url: string;
  site_title?: string;
  description?: string;
  connected_at: string;
  language_code?: string;
  visibility_settings?: "public" | "members" | "paid";
}

export interface GhostPublishLog {
  id: string;
  user_id: string;
  project_id: string;
  article_id: string;
  ghost_site_url: string;
  cms_post_id?: string;
  publish_status: "success" | "failed";
  publish_error?: string;
  latency_ms: number;
  published_url?: string;
  created_at: string;
}

export interface GhostPublishQueueItem {
  id: string;
  user_id: string;
  project_id: string;
  article_id: string;
  ghost_site_url: string;
  scheduled_publish_time: string; // ISO String
  publish_status: "pending" | "processing" | "success" | "failed";
  publish_error?: string;
  attempt_count: number;
  created_at: string;
}

export interface CmsSyncEvent {
  id: string;
  project_id: string;
  article_id: string;
  sync_status: "synced" | "out_of_sync" | "removed";
  cms_post_id: string;
  ghost_site_url: string;
  checked_at: string;
}

export interface GhostDb {
  ghost_integrations: GhostIntegration[];
  ghost_sites: GhostSite[];
  ghost_publish_logs: GhostPublishLog[];
  ghost_publish_queue: GhostPublishQueueItem[];
  cms_sync_events: CmsSyncEvent[];
}

// ==========================================
// DB INITIALIZER & ACCESSORS
// ==========================================
export function readGhostDb(): GhostDb {
  try {
    if (!fs.existsSync(ghostDbPath)) {
      const initialDb: GhostDb = {
        ghost_integrations: [],
        ghost_sites: [],
        ghost_publish_logs: [],
        ghost_publish_queue: [],
        cms_sync_events: []
      };
      fs.writeFileSync(ghostDbPath, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const data = fs.readFileSync(ghostDbPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[GHOST DB READ ERROR]:", err);
    return {
      ghost_integrations: [],
      ghost_sites: [],
      ghost_publish_logs: [],
      ghost_publish_queue: [],
      cms_sync_events: []
    };
  }
}

export function writeGhostDb(db: GhostDb): void {
  try {
    fs.writeFileSync(ghostDbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[GHOST DB WRITE ERROR]:", err);
  }
}

// ==========================================
// SYMMETRIC API KEY ENCRYPTION (AES-256-CBC)
// ==========================================
export function encryptApiKey(apiKey: string): string {
  try {
    const iv = crypto.randomBytes(16);
    // Key must be 32 bytes. Pad or cycle system key to match.
    const key = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(apiKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (err) {
    console.error("[ENCRYPTION ERROR]:", err);
    return apiKey; // Fallback
  }
}

export function decryptApiKey(encryptedKey: string): string {
  try {
    if (!encryptedKey.includes(":")) {
      return encryptedKey; // Unencrypted fallback
    }
    const [ivHex, encryptedHex] = encryptedKey.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("[DECRYPTION ERROR]:", err);
    return encryptedKey;
  }
}

// ==========================================
// GHOST AUTHENTICATION (NATIVE SPECIALIZED JWT)
// ==========================================
export function generateGhostToken(apiKey: string): string {
  const [id, secret] = apiKey.split(":");
  if (!id || !secret) {
    throw new Error("Invalid Ghost Admin API Key format. It must follow 'id:secret' standard.");
  }

  // Header payload structure
  const header = { alg: "HS256", typ: "JWT", kid: id };
  
  // Claims payload: 5-minute expiry limits to protect keys
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300, 
    aud: "/admin/"
  };

  const base64UrlEncode = (obj: any) => {
    return Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);

  const keyBuffer = Buffer.from(secret, "hex");
  const signature = crypto
    .createHmac("sha256", keyBuffer)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// ==========================================
// CONVERT BLOCKS TO GHOST COMPATIBLE HTML
// ==========================================
export function convertMarkdownToGhostHtml(markdown: string): string {
  if (!markdown) return "";
  
  // Basic structural markdown replacement
  let html = markdown;

  // Preserve Codeblocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // Bold / Strong matches
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([\s\S]*?)__/g, "<strong>$1</strong>");

  // Italic / Emphasize matches
  html = html.replace(/\*([\s\S]*?)\*/g, "<em>$1</em>");
  html = html.replace(/_([\s\S]*?)_/g, "<em>$1</em>");

  // Format Bulletlists & Lines
  html = html.replace(/^\s*-\s+(.*?)$/gm, "<li>$1</li>");
  html = html.replace(/^\s*\*\s+(.*?)$/gm, "<li>$1</li>");
  
  // Nest List elements beautifully
  html = html.replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>");
  // Clean up adjacent nested lists
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  // Header conversions (Heading levels 1 -> 4)
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

  // Format line dividers and paragraph spacing
  html = html.split(/\n\s*\n/).map(p => {
    const trimmed = p.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<li") || trimmed.startsWith("<pre")) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
  }).join("\n");

  return html;
}

// ==========================================
// FEATURE IMAGE DOWNLOAD & UPLOAD TO GHOST
// ==========================================
export async function uploadImageToGhost(
  imageUrl: string,
  siteUrl: string,
  apiKey: string
): Promise<string> {
  try {
    if (!imageUrl || imageUrl.startsWith("mock") || imageUrl.startsWith("http://localhost") || imageUrl.includes("example.com")) {
      return imageUrl; // Fallback to current URL if mock image
    }

    const token = generateGhostToken(apiKey);
    let url = siteUrl.trim().replace(/\/$/, "");
    if (!url.startsWith("http")) url = `https://${url}`;

    // Download Image content to buffer
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch original image URL: ${response.statusText}`);
    const buffer = await response.buffer();

    // Prepare multipart form-data payload natively without form-data package dependencies
    const boundary = `----RankSyncerBoundary${crypto.randomBytes(8).toString("hex")}`;
    const filename = `featured-image-${Date.now()}.png`;

    const multipartBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
      Buffer.from(`Content-Type: image/png\r\n\r\n`),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const uploadUrl = `${url}/ghost/api/admin/images/upload/`;
    console.log(`[GHOST MEDIA]: Triggering secure file upload to: ${uploadUrl}`);

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Ghost ${token}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body: multipartBody
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ghost image upload rejected status ${res.status}: ${errText}`);
    }

    const data = await res.json() as any;
    const uploadedUrl = data?.images?.[0]?.url || imageUrl;
    console.log(`[GHOST MEDIA SUCCESS]: Embedded reference image node: ${uploadedUrl}`);
    return uploadedUrl;
  } catch (err) {
    console.warn("[GHOST MEDIA WARNING]: Image upload failed, falling back to original URL:", err);
    return imageUrl; // Graceful degradation
  }
}

// ==========================================
// CORE PUBLISHING PIPELINE
// ==========================================
export async function publishToGhost(params: {
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
  ghostSiteUrl: string;
  apiKey: string;
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
  const { userId, projectId, article, ghostSiteUrl, apiKey, status = "draft", scheduledPublishTime, isSandbox = false } = params;

  // Active Sandbox override if site matches local mock names or is specified
  const isMock = isSandbox || ghostSiteUrl.toLowerCase().includes("mock") || ghostSiteUrl.toLowerCase().includes("example");
  
  if (isMock) {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
    const demoId = `ghost-post-${Math.floor(Math.random() * 1000000)}`;
    const demoUrl = `${ghostSiteUrl.replace(/\/$/, "")}/${article.slug || "demo-article"}`;
    
    // Save Log
    const db = readGhostDb();
    db.ghost_publish_logs.push({
      id: `plog-${crypto.randomUUID()}`,
      user_id: userId,
      project_id: projectId,
      article_id: article.id,
      ghost_site_url: ghostSiteUrl,
      cms_post_id: demoId,
      publish_status: "success",
      latency_ms: Date.now() - startTime,
      published_url: demoUrl,
      created_at: new Date().toISOString()
    });
    writeGhostDb(db);

    return {
      success: true,
      publishedUrl: demoUrl,
      cmsPostId: demoId
    };
  }

  try {
    // 1. Prepare Authorization
    const token = generateGhostToken(apiKey);
    let targetUrl = ghostSiteUrl.trim().replace(/\/$/, "");
    if (!targetUrl.startsWith("http")) targetUrl = `https://${targetUrl}`;

    // 2. Upload feature image securely if we have one
    let targetFeatureImage = "";
    if (article.featureImage) {
      targetFeatureImage = await uploadImageToGhost(article.featureImage, targetUrl, apiKey);
    }

    // 3. Format Body blocks to clean layout html
    const ghostHtml = convertMarkdownToGhostHtml(article.content);

    // 4. Map SEO parameters
    const tagsObj = (article.tags || []).map(t => ({ name: t }));
    if (article.targetKeyword) {
      tagsObj.push({ name: `SEO: ${article.targetKeyword}` });
    }

    const postPayload = {
      title: article.title,
      slug: article.slug,
      html: ghostHtml,
      status: status, // "draft" | "published" | "scheduled"
      feature_image: targetFeatureImage || null,
      custom_excerpt: article.metaDescription,
      meta_title: article.title,
      meta_description: article.metaDescription,
      canonical_url: `${targetUrl}/${article.slug}`,
      tags: tagsObj,
      visibility: "public"
    } as any;

    // Apply scheduled properties if selected
    if (status === "scheduled" && scheduledPublishTime) {
      postPayload.published_at = new Date(scheduledPublishTime).toISOString();
    }

    const endpoint = `${targetUrl}/ghost/api/admin/posts/?source=html`;
    console.log(`[GHOST CMS PUBLISH]: Dispatching post deploy request to ${endpoint}`);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Ghost ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ posts: [postPayload] })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Ghost Admin API rejected request status ${res.status}: ${errorText}`);
    }

    const responseData = await res.json() as any;
    const createdPost = responseData?.posts?.[0];
    if (!createdPost) {
      throw new Error("Invalid payload format received from Ghost server.");
    }

    const cmsPostId = createdPost.id;
    const publishedUrl = createdPost.url || `${targetUrl}/${createdPost.slug}`;

    // Save Publish Success log
    const db = readGhostDb();
    db.ghost_publish_logs.push({
      id: `plog-${crypto.randomUUID()}`,
      user_id: userId,
      project_id: projectId,
      article_id: article.id,
      ghost_site_url: ghostSiteUrl,
      cms_post_id: cmsPostId,
      publish_status: "success",
      latency_ms: Date.now() - startTime,
      published_url: publishedUrl,
      created_at: new Date().toISOString()
    });

    // Record cms sync event
    db.cms_sync_events.push({
      id: `sync-${crypto.randomUUID()}`,
      project_id: projectId,
      article_id: article.id,
      sync_status: "synced",
      cms_post_id: cmsPostId,
      ghost_site_url: ghostSiteUrl,
      checked_at: new Date().toISOString()
    });

    writeGhostDb(db);

    return {
      success: true,
      publishedUrl,
      cmsPostId
    };

  } catch (err: any) {
    const errorMsg = err.message || "Failed post synchronization flow";
    console.error("[GHOST CMS EXCEPTION]:", err);

    // Save Failure Log
    const db = readGhostDb();
    db.ghost_publish_logs.push({
      id: `plog-${crypto.randomUUID()}`,
      user_id: userId,
      project_id: projectId,
      article_id: article.id,
      ghost_site_url: ghostSiteUrl,
      publish_status: "failed",
      latency_ms: Date.now() - startTime,
      publish_error: errorMsg,
      created_at: new Date().toISOString()
    });
    writeGhostDb(db);

    return {
      success: false,
      error: errorMsg
    };
  }
}

// ==========================================
// BACKGROUND AUTOMATION PUBLISHING MANAGER
// ==========================================
export function startCmsQueueWorker(): void {
  // Setup standard non-blocking cron scanner to check and publish scheduled entries
  setInterval(async () => {
    try {
      const db = readGhostDb();
      const now = new Date();
      
      const pendingItems = db.ghost_publish_queue.filter(
        item => item.publish_status === "pending" && new Date(item.scheduled_publish_time) <= now
      );

      if (pendingItems.length === 0) return;

      console.log(`[CMS QUEUE SYSTEM]: Found ${pendingItems.length} publications to release automatically.`);

      for (const item of pendingItems) {
        item.publish_status = "processing";
        writeGhostDb(db);

        // Fetch corresponding integration site credentials safely
        const integration = db.ghost_integrations.find(
          i => i.ghost_site_url === item.ghost_site_url && i.project_id === item.project_id && i.is_active
        );

        if (!integration) {
          item.publish_status = "failed";
          item.publish_error = "Active site integration credentials could not be found.";
          writeGhostDb(db);
          continue;
        }

        const apiKey = decryptApiKey(integration.encrypted_api_key);

        // Fetch article metadata from system context (For mockup, we generate beautiful body or look from database folders)
        const mockArticle = {
          id: item.article_id,
          title: "Automated Release - " + new Date().toDateString(),
          slug: "scheduled-release-" + Math.floor(Math.random() * 10000),
          content: "### Welcome to our latest scheduling release\n\nOptimized from RankSyncer's Autopilot CMS publishing manager.",
          metaDescription: "Live continuous syndication to support topical authority and traffic increase.",
          tags: ["Automated", "Autopilot", "SEO"]
        };

        const result = await publishToGhost({
          userId: item.user_id,
          projectId: item.project_id,
          article: mockArticle,
          ghostSiteUrl: item.ghost_site_url,
          apiKey,
          status: "published",
          isSandbox: false
        });

        const refreshedDb = readGhostDb();
        const freshItem = refreshedDb.ghost_publish_queue.find(qi => qi.id === item.id);
        
        if (freshItem) {
          if (result.success) {
            freshItem.publish_status = "success";
          } else {
            freshItem.publish_status = "failed";
            freshItem.publish_error = result.error;
            freshItem.attempt_count += 1;
            // Retry mechanisms: if under 3 attempts, queue back to pending!
            if (freshItem.attempt_count < 3) {
              freshItem.publish_status = "pending";
              console.log(`[CMS QUEUE RETRY]: Scheduled item ${freshItem.id} queued for retry attempt #${freshItem.attempt_count}`);
            }
          }
          writeGhostDb(refreshedDb);
        }
      }
    } catch (workerErr) {
      console.error("[CMS WORKER QUEUE ERROR]:", workerErr);
    }
  }, 30000); // Scans queue every 30 seconds
}
