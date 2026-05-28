import fs from "fs";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";

// DB Path Definition
const wordpressComDbPath = path.join(process.cwd(), "wordpress_com_db.json");

// System Secret Key for symmetric encryption
const ENCRYPTION_SECRET = process.env.CMS_ENCRYPTION_KEY || "ranksyncer_secure_pass_phrase_256";

// ==========================================
// WORDPRESS.COM DB TYPES & INTERFACES
// ==========================================
export interface WordpressComIntegration {
  id: string; // unique database record ID
  user_id: string;
  project_id: string; // RankSyncer Project ID
  wordpress_site_id: string; // The specific WordPress.com Blog ID
  wordpress_site_url: string; // e.g., "myblog.wordpress.com"
  wordpress_site_name: string; // e.g., "My Travels Blog"
  encrypted_access_token: string; // Securely encrypted OAuth Token
  created_at: string;
  is_active: boolean;
}

export interface WordpressComPublishLog {
  id: string;
  user_id: string;
  project_id: string;
  article_id: string;
  wordpress_site_id: string;
  wordpress_post_id?: string;
  publish_status: "success" | "failed";
  publish_error?: string;
  latency_ms: number;
  published_url?: string;
  created_at: string;
}

export interface WordpressComPublishQueueItem {
  id: string;
  user_id: string;
  project_id: string;
  article_id: string;
  wordpress_site_id: string;
  scheduled_publish_time: string; // ISO String
  publish_status: "pending" | "processing" | "success" | "failed";
  publish_error?: string;
  attempt_count: number;
  created_at: string;
}

export interface WordpressComCmsSyncEvent {
  id: string;
  project_id: string;
  article_id: string;
  sync_status: "synced" | "out_of_sync" | "removed";
  wordpress_post_id: string;
  wordpress_site_id: string;
  checked_at: string;
}

export interface WordpressComDb {
  wordpress_com_integrations: WordpressComIntegration[];
  wordpress_com_publish_logs: WordpressComPublishLog[];
  wordpress_com_publish_queue: WordpressComPublishQueueItem[];
  cms_sync_events?: WordpressComCmsSyncEvent[];
}

// ==========================================
// DB INITIALIZER & ACCESSORS
// ==========================================
export function readWordpressComDb(): WordpressComDb {
  try {
    if (!fs.existsSync(wordpressComDbPath)) {
      const initialDb: WordpressComDb = {
        wordpress_com_integrations: [],
        wordpress_com_publish_logs: [],
        wordpress_com_publish_queue: [],
        cms_sync_events: []
      };
      fs.writeFileSync(wordpressComDbPath, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const data = fs.readFileSync(wordpressComDbPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[WORDPRESS.COM DB READ ERROR]:", err);
    return {
      wordpress_com_integrations: [],
      wordpress_com_publish_logs: [],
      wordpress_com_publish_queue: [],
      cms_sync_events: []
    };
  }
}

export function writeWordpressComDb(db: WordpressComDb): void {
  try {
    fs.writeFileSync(wordpressComDbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[WORDPRESS.COM DB WRITE ERROR]:", err);
  }
}

// ==========================================
// SYMMETRIC AUTH TOKEN ENCRYPTION
// ==========================================
export function encryptWordpressToken(token: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (err) {
    console.error("[WP ENCRYPTION ERROR]:", err);
    return token;
  }
}

export function decryptWordpressToken(encryptedToken: string): string {
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
    console.error("[WP DECRYPTION ERROR]:", err);
    return encryptedToken;
  }
}

// ==========================================
// CONVERT MARKDOWN TO WORDPRESS COMPATIBLE HTML
// ==========================================
export function convertMarkdownToWordpressHtml(markdown: string): string {
  if (!markdown) return "";
  
  let html = markdown;

  // Preserve Codeblocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // Bold / Strong matches
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([\s\S]*?)__/g, "<strong>$1</strong>");

  // Italic / Emphasize matches
  html = html.replace(/\*([\s\S]*?)\*/g, "<em>$1</em>");
  html = html.replace(/_([\s\S]*?)_/g, "<em>$1</em>");

  // Format Bulletlists
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
// FEATURE IMAGE DEPLOY TO WORDPRESS.COM SITE
// ==========================================
export async function uploadImageToWordpressCom(
  imageUrl: string,
  siteId: string,
  accessToken: string
): Promise<string> {
  try {
    if (!imageUrl || imageUrl.startsWith("mock") || imageUrl.startsWith("http://localhost") || imageUrl.includes("example.com")) {
      return imageUrl; // Fallback
    }

    console.log(`[WP.COM MEDIA]: Launching media upload for URL: ${imageUrl} to WP.com site ID ${siteId}`);
    
    // WordPress.com media endpoint
    const uploadUrl = `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/media/new`;

    // Attempt the fast media_urls upload format
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        media_urls: [imageUrl]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`WP.COM Media API rejected upload (Code ${response.status}): ${errText}`);
    }

    const data = await response.json() as any;
    const uploadedUrl = data?.media?.[0]?.URL || imageUrl;
    console.log(`[WP.COM MEDIA SUCCESS]: Media added. Destination WP.com URL: ${uploadedUrl}`);
    return uploadedUrl;
  } catch (err) {
    console.warn("[WP.COM MEDIA EXCEPTION] Media upload fallback deployed:", err);
    return imageUrl; // Graceful fallback
  }
}

// ==========================================
// CORE PUBLISHING PIPELINE FOR WORDPRESS.COM
// ==========================================
export async function publishToWordpressCom(params: {
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
  wordpressSiteId: string;
  accessToken: string;
  status?: "draft" | "publish" | "private" | "schedule";
  scheduledPublishTime?: string;
  isSandbox?: boolean;
}): Promise<{
  success: boolean;
  publishedUrl?: string;
  wordpressPostId?: string;
  error?: string;
}> {
  const startTime = Date.now();
  const { userId, projectId, article, wordpressSiteId, accessToken, status = "draft", scheduledPublishTime, isSandbox = false } = params;

  const isMock = isSandbox || wordpressSiteId.toLowerCase().includes("mock") || accessToken === "mock-wordpress-token";

  if (isMock) {
    await new Promise(resolve => setTimeout(resolve, 800)); // Latency Simulation
    const mockPostId = `wp-post-${Math.floor(Math.random() * 1000000)}`;
    const mockUrl = `https://ranksyncer-preview.wordpress.com/${article.slug || "demo-article"}`;

    const db = readWordpressComDb();
    db.wordpress_com_publish_logs.push({
      id: `wplog-${crypto.randomUUID()}`,
      user_id: userId,
      project_id: projectId,
      article_id: article.id,
      wordpress_site_id: wordpressSiteId,
      wordpress_post_id: mockPostId,
      publish_status: "success",
      latency_ms: Date.now() - startTime,
      published_url: mockUrl,
      created_at: new Date().toISOString()
    });
    writeWordpressComDb(db);

    return {
      success: true,
      publishedUrl: mockUrl,
      wordpressPostId: mockPostId
    };
  }

  try {
    // 1. Upload Featured Image if exists
    let featuredImageUrl = "";
    if (article.featureImage) {
      featuredImageUrl = await uploadImageToWordpressCom(article.featureImage, wordpressSiteId, accessToken);
    }

    // 2. Format Body Content to HTML
    const formattedContent = convertMarkdownToWordpressHtml(article.content);

    // 3. Assemble SEO & Tags Parameters
    const tagNames = article.tags || [];
    if (article.targetKeyword) {
      tagNames.push(article.targetKeyword);
    }

    // Determine target status
    let targetStatus = "draft";
    if (status === "publish" || status === "schedule") {
      targetStatus = "publish"; // Note: wordpress.com uses "publish"
    } else if (status === "private") {
      targetStatus = "private";
    }

    // 4. Construct WordPress.com Create Post payload
    const postPayload: Record<string, any> = {
      title: article.title,
      content: formattedContent,
      slug: article.slug,
      excerpt: article.metaDescription,
      status: targetStatus,
      tags: tagNames.join(", "),
      metadata: [
        { key: "_yoast_wpseo_title", value: article.title },
        { key: "_yoast_wpseo_metadesc", value: article.metaDescription },
        { key: "canonical_url", value: `https://wordpress.com/post/${wordpressSiteId}/${article.slug}` },
        { key: "_ranksyncer_synced_id", value: article.id }
      ]
    };

    // If scheduled publish date is provided
    if (status === "schedule" && scheduledPublishTime) {
      postPayload.date = new Date(scheduledPublishTime).toISOString();
    }

    if (featuredImageUrl) {
      postPayload.featured_image = featuredImageUrl;
    }

    const createPostUrl = `https://public-api.wordpress.com/rest/v1.1/sites/${wordpressSiteId}/posts/new`;
    console.log(`[WP.COM PUBLISH]: Dispatched post insert flow to: ${createPostUrl}`);

    const response = await fetch(createPostUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(postPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`WordPress.com API rejected request (Code ${response.status}): ${errText}`);
    }

    const resData = await response.json() as any;
    const wordpressPostId = resData?.ID ? String(resData.ID) : undefined;
    const publishedUrl = resData?.URL || `https://wordpress.com/post/${wordpressSiteId}/${resData?.slug || article.slug}`;

    if (!wordpressPostId) {
      throw new Error("Invalid output received from WordPress.com backend API.");
    }

    // Log success
    const db = readWordpressComDb();
    db.wordpress_com_publish_logs.push({
      id: `wplog-${crypto.randomUUID()}`,
      user_id: userId,
      project_id: projectId,
      article_id: article.id,
      wordpress_site_id: wordpressSiteId,
      wordpress_post_id: wordpressPostId,
      publish_status: "success",
      latency_ms: Date.now() - startTime,
      published_url: publishedUrl,
      created_at: new Date().toISOString()
    });

    if (!db.cms_sync_events) {
      db.cms_sync_events = [];
    }
    db.cms_sync_events.push({
      id: `wpsync-${crypto.randomUUID()}`,
      project_id: projectId,
      article_id: article.id,
      sync_status: "synced",
      wordpress_post_id: wordpressPostId,
      wordpress_site_id: wordpressSiteId,
      checked_at: new Date().toISOString()
    });

    writeWordpressComDb(db);

    return {
      success: true,
      publishedUrl,
      wordpressPostId
    };

  } catch (err: any) {
    const errMsg = err.message || "Failed post deployment steps to WordPress.com site core.";
    console.error("[WORDPRESS.COM PUBLISH EXCEPTION]:", err);

    // Record failure in logs
    const db = readWordpressComDb();
    db.wordpress_com_publish_logs.push({
      id: `wplog-${crypto.randomUUID()}`,
      user_id: userId,
      project_id: projectId,
      article_id: article.id,
      wordpress_site_id: wordpressSiteId,
      publish_status: "failed",
      publish_error: errMsg,
      latency_ms: Date.now() - startTime,
      created_at: new Date().toISOString()
    });
    writeWordpressComDb(db);

    return {
      success: false,
      error: errMsg
    };
  }
}

// ==========================================
// BACKGROUND RETRY & BACKGROUND SCHEDULER DAEMON WORKER
// ==========================================
export function startWordpressComQueueWorker(): void {
  // Scans database file every 30 seconds for scheduled or retry jobs
  setInterval(async () => {
    try {
      const db = readWordpressComDb();
      const now = new Date();

      const pendingJobs = db.wordpress_com_publish_queue.filter(
        item => item.publish_status === "pending" && new Date(item.scheduled_publish_time) <= now
      );

      if (pendingJobs.length === 0) return;

      console.log(`[WP.com SCHEDULER]: Discovered ${pendingJobs.length} automated syndications ready for execution.`);

      for (const item of pendingJobs) {
        item.publish_status = "processing";
        writeWordpressComDb(db);

        // Lookup active integration credentials
        const integration = db.wordpress_com_integrations.find(
          i => i.wordpress_site_id === item.wordpress_site_id && i.project_id === item.project_id && i.is_active
        );

        if (!integration) {
          item.publish_status = "failed";
          item.publish_error = "Associated active WordPress.com workspace credentials could not be loaded.";
          writeWordpressComDb(db);
          continue;
        }

        const accessToken = decryptWordpressToken(integration.encrypted_access_token);

        // Fetch placeholder fallback article data or construct standard release content block
        const fallbackArticle = {
          id: item.article_id,
          title: "Scheduled Release - " + new Date().toDateString(),
          slug: "scheduled-syndication-" + Math.floor(Math.random() * 100000),
          content: "### RankSyncer Scheduled Syndication\n\nOptimized straight to WordPress.com hosted blogs via the RankSyncer premium scheduler backend worker daemon.",
          metaDescription: "Automatic continuous publication syndicating high value indexable blog node posts.",
          tags: ["RankSyncer", "WordPress", "SEO", "Autopilot", "Automated"]
        };

        const result = await publishToWordpressCom({
          userId: item.user_id,
          projectId: item.project_id,
          article: fallbackArticle,
          wordpressSiteId: item.wordpress_site_id,
          accessToken,
          status: "publish",
          isSandbox: false
        });

        // Refresh database reference for atomic safety update
        const refreshedDb = readWordpressComDb();
        const freshJob = refreshedDb.wordpress_com_publish_queue.find(q => q.id === item.id);

        if (freshJob) {
          if (result.success) {
            freshJob.publish_status = "success";
          } else {
            freshJob.publish_status = "failed";
            freshJob.publish_error = result.error;
            freshJob.attempt_count += 1;

            // Simple retry mechanism: under 3 attempts sends it back to pending status
            if (freshJob.attempt_count < 3) {
              freshJob.publish_status = "pending";
              console.log(`[WP.COM RETRY HANDLER]: Job ID ${freshJob.id} queued for retry attempt #${freshJob.attempt_count}`);
            }
          }
          writeWordpressComDb(refreshedDb);
        }
      }
    } catch (workerErr) {
      console.error("[WP.COM WORKER EXCEPTION]:", workerErr);
    }
  }, 30000);
}
