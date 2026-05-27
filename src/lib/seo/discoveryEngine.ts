import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { 
  DiscoveredKeyword, 
  TopicCluster, 
  DiscoveryJob, 
  KeywordCacheItem, 
  SearchIntent 
} from "./types";

// ============================================================================
// 1. LAZY GEMINI CLIENT
// ============================================================================
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || "dummy_key_for_sandbox";
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ============================================================================
// 2. SCORING ENGINE
// ============================================================================
export class KeywordScoringEngine {
  /**
   * Refined mathematical score (5-99) reflecting Organic SERP Opportunity.
   * Prioritizes high search volume, low SEO keyword difficulty, and premium CPC commercial viability.
   */
  public calculateScore(volume: number, difficulty: number, cpc: number, intent: SearchIntent): number {
    // 1. Volume logarithmic scalability
    const volumeIndex = Math.min(100, Math.max(10, Math.log10(volume || 1) * 20));

    // 2. Difficulty scaling: lower difficulty is highly favorable
    const difficultyFactor = (100 - Math.min(100, Math.max(0, difficulty))) / 100;

    // 3. Search intent commercial multipliers
    let intentMultiplier = 1.0;
    if (intent === "Transactional" || intent === "Commercial") {
      intentMultiplier = 1.3;
    } else if (intent === "Navigational") {
      intentMultiplier = 0.8;
    }

    // 4. CPC commercial scale
    const cpcIndex = cpc > 0 ? Math.min(1.4, 1.0 + (cpc / 10)) : 1.0;

    // 5. Quick-win bonus (difficulty <= 25)
    const quickWinBonus = difficulty <= 25 ? 15 : 0;

    const baseCalculation = (volumeIndex * difficultyFactor * intentMultiplier * cpcIndex) + quickWinBonus;

    // Normalize safely matching scope bounds
    const normalized = Math.round(baseCalculation);
    return Math.max(5, Math.min(99, normalized));
  }
}

export const kwScoringEngine = new KeywordScoringEngine();

// ============================================================================
// 3. STORAGE SERVICE
// ============================================================================
export class KeywordStorageService {
  public async saveJobStatus(job: DiscoveryJob): Promise<void> {
    try {
      const path = `projects/${job.projectId}/keyword_generation_logs/${job.id}`;
      const docRef = doc(db, "projects", job.projectId, "keyword_generation_logs", job.id);
      await setDoc(docRef, { ...job });
      console.log(`[STORAGE]: Persisted Discovery Log [${job.status.toUpperCase()}] for Project ${job.projectId}`);
    } catch (err) {
      console.error("[STORAGE ERROR]: Failed saving job status to Firestore:", err);
    }
  }

  public async saveDiscoveredKeywords(keywords: DiscoveredKeyword[], projectId: string): Promise<void> {
    try {
      for (const kw of keywords) {
        const docRef = doc(db, "projects", projectId, "keyword_discoveries", kw.id);
        await setDoc(docRef, { ...kw });
      }
      console.log(`[STORAGE]: Persisted ${keywords.length} AI Discovered Keywords for Project ${projectId}`);
    } catch (err) {
      console.error("[STORAGE ERROR]: Failed to save discovered keywords:", err);
    }
  }

  public async saveTopicClusters(clusters: TopicCluster[], projectId: string): Promise<void> {
    try {
      for (const cl of clusters) {
        const docRef = doc(db, "projects", projectId, "keyword_clusters", cl.id);
        await setDoc(docRef, { ...cl });
      }
      console.log(`[STORAGE]: Persisted ${clusters.length} Topical Clusters for Project ${projectId}`);
    } catch (err) {
      console.error("[STORAGE ERROR]: Failed to save topic clusters:", err);
    }
  }

  public async saveCacheRecord(cache: KeywordCacheItem): Promise<void> {
    try {
      const docRef = doc(db, "projects", cache.projectId, "keyword_cache", cache.id);
      await setDoc(docRef, { ...cache });
      console.log(`[STORAGE]: Cached generation trace for Domain: ${cache.domain}`);
    } catch (err) {
      console.error("[STORAGE ERROR]: Failed saving keyword cache metadata:", err);
    }
  }

  public async appendStatusCrawlerLog(projectId: string, userId: string, message: string, type: "info" | "success" | "warn" | "error"): Promise<void> {
    try {
      const logId = `l-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const docRef = doc(db, "projects", projectId, "logs", logId);
      await setDoc(docRef, {
        id: logId,
        projectId,
        ownerId: userId,
        timestamp: new Date().toISOString(),
        type,
        message,
        module: "SERP_CRAWLER"
      });
    } catch (err) {
      console.error("[STORAGE ERROR]: Skipped telemetry write logger:", err);
    }
  }
}

export const kwStorageService = new KeywordStorageService();

// ============================================================================
// 4. TOPICAL CLUSTERING ENGINE
// ============================================================================
export class KeywordClusterEngine {
  /**
   * Groups a list of discovered keywords by their broad topical clusters.
   * Compiles supporting keyword strings, primary targeting term, and aggregate index scores.
   */
  public buildClusters(keywords: DiscoveredKeyword[], projectId: string, userId: string): TopicCluster[] {
    const groups: { [clusterName: string]: DiscoveredKeyword[] } = {};

    // Group items
    keywords.forEach(kw => {
      const cName = kw.cluster ? kw.cluster.trim() : "General Guides";
      if (!groups[cName]) {
        groups[cName] = [];
      }
      groups[cName].push(kw);
    });

    const clusters: TopicCluster[] = [];

    Object.entries(groups).forEach(([name, items]) => {
      // Sort items descending by Search Volume to determine Primary Keyword
      const sorted = [...items].sort((a, b) => b.volume - a.volume);
      const primaryTerm = sorted[0].keyword;
      const supportingTerms = sorted.slice(1).map(x => x.keyword);

      // Math calculates
      const totalDifficulty = items.reduce((sum, current) => sum + current.difficulty, 0);
      const avgDifficulty = Math.round(totalDifficulty / items.length);

      const totalOpportunity = items.reduce((sum, current) => sum + current.opportunityScore, 0);
      const avgOpportunity = Math.round(totalOpportunity / items.length);

      clusters.push({
        id: `c-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        projectId,
        clusterName: name,
        primaryKeyword: primaryTerm,
        supportingKeywords: supportingTerms,
        clusterDifficulty: avgDifficulty,
        contentOpportunityScore: avgOpportunity,
        createdAt: new Date().toISOString(),
        ownerId: userId
      });
    });

    return clusters;
  }
}

export const kwClusterEngine = new KeywordClusterEngine();

// ============================================================================
// 5. CACHING LAYER
// ============================================================================
export class KeywordCachingLayer {
  private memoryCache = new Map<string, string>(); // Normalized Domain + Niche + Source -> JSON Result

  private getCacheKey(domain: string, niche: string, sourceType = "", sourceValue = ""): string {
    return `${domain.toLowerCase().trim()}::${niche.toLowerCase().trim()}::${sourceType.trim()}::${sourceValue.trim()}`;
  }

  public async get(
    domain: string,
    niche: string,
    projectId: string,
    sourceType = "",
    sourceValue = ""
  ): Promise<string | null> {
    const key = this.getCacheKey(domain, niche, sourceType, sourceValue);
    
    // 1. Check in-memory quick lookups
    if (this.memoryCache.has(key)) {
      console.log(`[CACHE HIT]: In-Memory resolved cache for ${domain}`);
      return this.memoryCache.get(key) || null;
    }

    // 2. Query Firestore Project Cache collection
    try {
      const q = query(
        collection(db, "projects", projectId, "keyword_cache"),
        where("domain", "==", domain.toLowerCase().trim()),
        where("niche", "==", niche.toLowerCase().trim())
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const found = snap.docs.find(d => {
          const data = d.data();
          return (data.sourceType || "") === sourceType && (data.sourceValue || "") === sourceValue;
        });

        if (found) {
          const docData = found.data();
          // Ensure cache is fresh (within 24 hours)
          const ageMs = Date.now() - new Date(docData.createdAt).getTime();
          const oneDayMs = 24 * 60 * 60 * 1000;
          if (ageMs < oneDayMs) {
            console.log(`[CACHE HIT]: Firestore resolved fresh cache for ${domain}`);
            this.memoryCache.set(key, docData.rawResultJson);
            return docData.rawResultJson;
          } else {
            console.log(`[CACHE EXPIRED]: Evicting stale cache record for ${domain}`);
          }
        }
      }
    } catch (e) {
      console.warn("[CACHE WARNING]: Skip Firestore Cache Read query:", e);
    }

    return null;
  }

  public set(domain: string, niche: string, rawJson: string, sourceType = "", sourceValue = ""): void {
    const key = this.getCacheKey(domain, niche, sourceType, sourceValue);
    this.memoryCache.set(key, rawJson);
  }
}

export const kwCachingLayer = new KeywordCachingLayer();

// ============================================================================
// 6. DISCOVERY ENGINE SERVICE (GEMINI DEIGESTION)
// ============================================================================
export class KeywordDiscoveryService {
  /**
   * Generates highly relevant keywords using the model gemini-3.5-flash with a structured response schema.
   */
  public async discoverKeywords(
    domain: string,
    niche: string,
    country: string,
    language: string,
    sourceType = "niche_category",
    sourceValue = "",
    selectedKeywordTypes: string[] = []
  ): Promise<any[]> {
    const client = getGeminiClient();

    const systemInstructions = `You are an elite SEO optimization and organic growth advisor similar to Outrank.
    Your mission is to perform keyword discovery, semantic clustering, intent mapping, structural content silo recommendation, and competitor gap modeling.
    Analyze business attributes carefully and output exactly 25 highly practical, low-duplicate keyword items in standard JSON.`;

    const keywordTypesList = selectedKeywordTypes && selectedKeywordTypes.length > 0
      ? selectedKeywordTypes.join(", ")
      : "short-tail, long-tail, question, transactional, commercial, informational, local SEO, LSI keyword variations";

    let contextInstruction = "";
    if (sourceType === "seed_keyword") {
      contextInstruction = `The user wants you to expand on the seed keyword: "${sourceValue}". Find highly related search phrases, synonyms, and variations.`;
    } else if (sourceType === "website_url") {
      contextInstruction = `Analyze search presence and extract/generate keyword target options for the domain: "${sourceValue}".`;
    } else if (sourceType === "competitor_url") {
      contextInstruction = `Perform a keyword gap analysis looking at a key competitor domain: "${sourceValue}". Extract search terms they are potentially ranking for, identify topic authority gaps, and propose missing search capture angles.`;
    } else if (sourceType === "article_topic") {
      contextInstruction = `Suggest keywords clustered around writing an in-depth authority piece on the topic: "${sourceValue}".`;
    } else if (sourceType === "niche_category") {
      contextInstruction = `Map topical authority, subtopics, and focus themes within the broad category: "${sourceValue || niche}".`;
    } else if (sourceType === "sitemap_upload") {
      contextInstruction = `Analyze sitemap nodes or URL lists: "${sourceValue}". Find structural topic gaps and crawl opportunities.`;
    } else if (sourceType === "existing_article") {
      contextInstruction = `The user uploaded an existing article: "${sourceValue}". Extract its current core focus and outline secondary target keywords, LSI keyword expansions, and supportive search queries to elevate semantic density.`;
    } else if (sourceType === "product_description") {
      contextInstruction = `Recommend commercial and high-intent transactional search terms modeled around this product or service description: "${sourceValue}".`;
    } else {
      contextInstruction = `Perform vertical domain discovery for website: "${domain}" in the "${niche}" niche.`;
    }

    const prompt = `Perform intensive search intent indexing, monthly traffic estimation, market competitiveness, and semantic mapping for:
    Website Domain context: ${domain}
    Business Niche context: ${niche}
    Target Territory Country Code: ${country}
    Selected Language Localize: ${language}
    Input Method: ${sourceType}
    Input Value: ${sourceValue}
    Target Keyword Categories requested: ${keywordTypesList}

    Action item:
    ${contextInstruction}

    Compile exactly 25 targeted keyword opportunities following this requested list of properties:
    - keyword: The lowercase search query. Must represent realistic Google search patterns.
    - intent: Standard SearchIntent ("Informational", "Transactional", "Commercial", "Navigational"). Match current user buying cycle.
    - volume: Annualized monthly search volume estimate based on keyword popularity (from 40 to 800000).
    - difficulty: Standard index difficulty (0-100 scale, where <25 is ultra-easy win, >70 is super-competitive enterprise).
    - cpc: Estimated cost-per-click value in USD.
    - opportunityScore: Integer from 5 to 99 modeling low-difficulty high-volume wins.
    - cluster: Group title for topical grouping (e.g., "Advanced Tutorials", "Product Comparisons").
    - reasoning: 1-sentence tactical explanation of why this term is a ranking win.
    - suggestedTitle: Recommended SEO header title targeting this term.
    - suggestedArticleType: Recommended structural content type (e.g. 'Pillar Page', 'Ultimate Guide', 'Listicle', 'How-to Page', 'Comparison Column', 'Case Study', 'Product Review').
    - contentAngle: Unique content direction to stand out on the SERP.
    - serpCompetition: Competitor SERP density estimate ('Low', 'Medium', 'High').
    - topicalRelevance: Estimated percentage relevance of this keyword to the domain niche (0-100).

    CRITICAL RULE: Generate queries local to the language (${language}) and country (${country}). Suggest real, relevant terms! Avoid generic junk.`;

    try {
      console.log(`[GEMINI DISCOVERY]: Querying model "gemini-3.5-flash" with structured schema response...`);
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [prompt],
        config: {
          systemInstruction: systemInstructions,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              keywords: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: { type: Type.STRING },
                    intent: { type: Type.STRING }, 
                    volume: { type: Type.INTEGER },
                    difficulty: { type: Type.INTEGER },
                    cpc: { type: Type.NUMBER },
                    opportunityScore: { type: Type.INTEGER },
                    cluster: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    suggestedTitle: { type: Type.STRING },
                    suggestedArticleType: { type: Type.STRING },
                    contentAngle: { type: Type.STRING },
                    serpCompetition: { type: Type.STRING },
                    topicalRelevance: { type: Type.INTEGER }
                  },
                  required: [
                    "keyword", "intent", "volume", "difficulty", "cpc", "opportunityScore", 
                    "cluster", "reasoning", "suggestedTitle", "suggestedArticleType", 
                    "contentAngle", "serpCompetition", "topicalRelevance"
                  ]
                }
              }
            },
            required: ["keywords"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty text payload received from Gemini generateContent call");
      }

      const parsed = JSON.parse(responseText);
      if (parsed && Array.isArray(parsed.keywords)) {
        console.log(`[GEMINI DISCOVERY]: successfully fetched ${parsed.keywords.length} keywords`);
        return parsed.keywords;
      }

      throw new Error("Parsed JSON did not contain a valid keywords array");
    } catch (err: any) {
      console.error("[GEMINI API CRASH]: Discovery generation failed:", err);
      throw err;
    }
  }
}

export const kwDiscoveryService = new KeywordDiscoveryService();

// ============================================================================
// 7. BACKGROUND DISCOVERY JOB QUEUE
// ============================================================================
export class DiscoveryJobQueue {
  private running = false;
  private queue: Array<{
    job: DiscoveryJob;
    resolve: () => void;
  }> = [];

  /**
   * Adds an asynchronous keyword discovery job to the system.
   * Runs non-blockingly, instantly updates status to queued in DB, and wakes execution daemon.
   */
  public addJob(
    projectId: string,
    domain: string,
    niche: string,
    country: string,
    language: string,
    userId: string,
    sourceType?: string,
    sourceValue?: string,
    selectedKeywordTypes?: string[]
  ): void {
    const job: DiscoveryJob = {
      id: `job-${Date.now()}`,
      projectId,
      status: "queued",
      totalKeywords: 0,
      niche,
      country,
      language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: userId,
      sourceType,
      sourceValue,
      selectedKeywordTypes
    };

    console.log(`[QUEUE]: Adding job ${job.id} for Project ${projectId} to Background Runner`);
    
    // Save to Firestore so UI elements can display "queued" loading indicators immediately
    kwStorageService.saveJobStatus(job);
    kwStorageService.appendStatusCrawlerLog(
      projectId, 
      userId, 
      `AI Keyword Discovery (${sourceType || "broad"}) requested for: "${sourceValue || niche}"`, 
      "info"
    );

    this.queue.push({
      job,
      resolve: () => {}
    });

    // Start running the queue in the background
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const current = this.queue.shift();
      if (!current) continue;

      const { job } = current;
      let retries = 0;
      const maxRetries = 3;
      let success = false;

      // Update state to "processing"
      job.status = "processing";
      job.updatedAt = new Date().toISOString();
      await kwStorageService.saveJobStatus(job);
      await kwStorageService.appendStatusCrawlerLog(
        job.projectId,
        job.ownerId,
        `Analyzing domain profile and generating optimal keywords...`,
        "info"
      );

      while (retries < maxRetries && !success) {
        try {
          let rawDataString = await kwCachingLayer.get(
            job.projectId, 
            job.niche, 
            job.projectId,
            job.sourceType,
            job.sourceValue
          );
          let rawKeywords: any[] = [];

          if (rawDataString) {
            // Cache Hit: Parse cached results
            rawKeywords = JSON.parse(rawDataString);
            await kwStorageService.appendStatusCrawlerLog(
              job.projectId,
              job.ownerId,
              `Instantly resolved search queries using pre-compiled industry intelligence cache.`,
              "success"
            );
          } else {
            // Cache Miss: Query Gemini
            rawKeywords = await kwDiscoveryService.discoverKeywords(
              job.projectId,
              job.niche,
              job.country,
              job.language,
              job.sourceType,
              job.sourceValue,
              job.selectedKeywordTypes
            );

            // Set Cache
            rawDataString = JSON.stringify(rawKeywords);
            kwCachingLayer.set(job.projectId, job.niche, rawDataString, job.sourceType, job.sourceValue);

            // Persist Cache doc
            await kwStorageService.saveCacheRecord({
              id: `cache-${Date.now()}`,
              projectId: job.projectId,
              domain: job.projectId.toLowerCase(),
              niche: job.niche,
              rawResultJson: rawDataString,
              createdAt: new Date().toISOString(),
              ownerId: job.ownerId,
              sourceType: job.sourceType || "",
              sourceValue: job.sourceValue || ""
            } as any);
          }

          // Transform and run the scoring engine
          const discoveredKeywords: DiscoveredKeyword[] = rawKeywords.map((raw: any, idx: number) => {
            // Standardize Search Intent
            let safeIntent: SearchIntent = "Informational";
            if (["Transactional", "Commercial", "Navigational", "Informational"].includes(raw.intent)) {
              safeIntent = raw.intent;
            }

            // Refine proprietary opportunity score mathematically
            const opportunityIndex = kwScoringEngine.calculateScore(
              raw.volume || 100,
              raw.difficulty || 45,
              raw.cpc || 0.5,
              safeIntent
            );

            return {
              id: `dkw-${Date.now()}-${idx}`,
              projectId: job.projectId,
              keyword: raw.keyword.toLowerCase().trim(),
              term: raw.keyword.toLowerCase().trim(),
              intent: safeIntent,
              volume: raw.volume || 100,
              difficulty: raw.difficulty || 40,
              cpc: raw.cpc || 0,
              cluster: raw.cluster || "General SEO Guidelines",
              opportunityScore: opportunityIndex,
              reasoning: raw.reasoning || "Highly relevant long-tail opportunity search query.",
              suggestedTitle: raw.suggestedTitle || `Optimizing content search targeting for ${raw.keyword}`,
              createdAt: new Date().toISOString(),
              ownerId: job.ownerId,
              generatedBy: "Gemini AI",
              suggestedArticleType: raw.suggestedArticleType || "SEO Article Guide",
              contentAngle: raw.contentAngle || "Tactical value optimization",
              serpCompetition: ["Low", "Medium", "High"].includes(raw.serpCompetition) ? raw.serpCompetition : "Medium",
              topicalRelevance: typeof raw.topicalRelevance === 'number' ? raw.topicalRelevance : 70,
              keywordType: raw.keywordType || (job.selectedKeywordTypes && job.selectedKeywordTypes.length > 0 ? job.selectedKeywordTypes[0] : 'long-tail'),
              sourceType: job.sourceType || "seed_keyword"
            };
          });

          // Build topic clusters
          const topicClusters = kwClusterEngine.buildClusters(discoveredKeywords, job.projectId, job.ownerId);

          // Persist both keywords and clusters to Firestore!
          await kwStorageService.saveDiscoveredKeywords(discoveredKeywords, job.projectId);
          await kwStorageService.saveTopicClusters(topicClusters, job.projectId);

          // Update Job Completed
          job.status = "completed";
          job.totalKeywords = discoveredKeywords.length;
          job.updatedAt = new Date().toISOString();
          await kwStorageService.saveJobStatus(job);

          await kwStorageService.appendStatusCrawlerLog(
            job.projectId,
            job.ownerId,
            `Successfully processed AI SEO discovery! ${discoveredKeywords.length} opportunities created across ${topicClusters.length} clusters.`,
            "success"
          );

          success = true;
        } catch (error: any) {
          retries++;
          console.warn(`[QUEUE FAILURE]: Job attempt ${retries} failed:`, error.message);
          
          if (retries < maxRetries) {
            await kwStorageService.appendStatusCrawlerLog(
              job.projectId,
              job.ownerId,
              `Generation attempt ${retries} failed: "${error.message}". Retrying shortly...`,
              "warn"
            );
            // Delay before retrying
            await new Promise(resolve => setTimeout(resolve, 1500));
          } else {
            // Final Exhaustion
            job.status = "failed";
            job.error = error.message || "Unknown error during AI generation";
            job.updatedAt = new Date().toISOString();
            await kwStorageService.saveJobStatus(job);
            await kwStorageService.appendStatusCrawlerLog(
              job.projectId,
              job.ownerId,
              `AI analysis aborted: "${error.message}". Please check your API key options.`,
              "error"
            );
          }
        }
      }
    }

    this.running = false;
  }
}

export const discoveryJobQueue = new DiscoveryJobQueue();
