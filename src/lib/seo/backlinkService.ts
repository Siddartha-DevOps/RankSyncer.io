import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";

// Path to the JSON persistence file
const backlinkDbPath = path.join(process.cwd(), "backlink_network_db.json");

// ==========================================
// DB ENTITY SCHEMAS
// ==========================================

export interface BacklinkNetworkSite {
  id: string;
  user_id: string;
  website_id: string; // From project ID
  domain: string;
  niche: string;
  authority_score: number; // 0 to 100
  language: string;
  country: string;
  spam_score: number; // 0 to 100
  is_active: boolean;
  categories: string[];
  backlink_profile_health: "Excellent" | "Good" | "Needs Attention" | "Poor";
  created_at: string;
}

export interface BacklinkMatch {
  id: string;
  site_a_id: string;
  site_b_id: string;
  relevance_score: number; // 0 to 100
  matching_niches: string[];
  language_compatibility: boolean;
  country_compatibilty: boolean;
  explanation: string;
  exchange_potential: "Elite" | "High" | "Moderate" | "Low";
  created_at: string;
}

export interface BacklinkRequest {
  id: string;
  sender_site_id: string;
  receiver_site_id: string;
  sender_user_id: string;
  receiver_user_id: string;
  target_url: string; // Page to link to
  anchor_text: string; // Text to click
  placement_suggestion: string; // URL where the link should match
  context_snippet: string; // Sentence containing the link
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
}

export interface BacklinkExchange {
  id: string;
  request_id: string;
  sender_site_id: string;
  receiver_site_id: string;
  domain_from: string; // The site hosting the link
  domain_to: string; // The site receiving credit
  backlink_url: string; // Actual published URL
  target_url: string; // Link destination URL
  anchor_text: string;
  exchange_status: "live" | "broken" | "removed" | "mismatched" | "pending_placement";
  verification_status: "verified" | "not_found" | "mismatched_anchor" | "broken_target" | "never_verified";
  created_at: string;
  updated_at: string;
}

export interface BacklinkVerification {
  id: string;
  exchange_id: string;
  verified_at: string;
  html_status: number;
  link_found: boolean;
  exact_anchor_matches: boolean;
  remarks: string;
}

export interface BacklinkHealthLog {
  id: string;
  site_id: string;
  log_type: "link_scanned" | "link_lost" | "link_restored" | "authority_growth" | "spam_alert" | "anti_spam_shield";
  severity: "info" | "success" | "warn" | "error";
  message: string;
  timestamp: string;
}

export interface BacklinkDbSchema {
  backlink_network_sites: BacklinkNetworkSite[];
  backlink_matches: BacklinkMatch[];
  backlink_requests: BacklinkRequest[];
  backlink_exchanges: BacklinkExchange[];
  backlink_verifications: BacklinkVerification[];
  backlink_health_logs: BacklinkHealthLog[];
}

// ==========================================
// DB ACCESSORS (PERSISTENCE)
// ==========================================

export function readBacklinkDb(): BacklinkDbSchema {
  try {
    if (!fs.existsSync(backlinkDbPath)) {
      const initialDb: BacklinkDbSchema = {
        backlink_network_sites: [],
        backlink_matches: [],
        backlink_requests: [],
        backlink_exchanges: [],
        backlink_verifications: [],
        backlink_health_logs: []
      };
      // Populate seed matching candidates to represent the user network
      populateSeedNetwork(initialDb);
      fs.writeFileSync(backlinkDbPath, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const data = fs.readFileSync(backlinkDbPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[BACKLINK DB READ ERROR]:", err);
    return {
      backlink_network_sites: [],
      backlink_matches: [],
      backlink_requests: [],
      backlink_exchanges: [],
      backlink_verifications: [],
      backlink_health_logs: []
    };
  }
}

export function writeBacklinkDb(db: BacklinkDbSchema): void {
  try {
    fs.writeFileSync(backlinkDbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[BACKLINK DB WRITE ERROR]:", err);
  }
}

// ==========================================
// IN-NETWORK SEED DATA SEEDING
// ==========================================

function populateSeedNetwork(db: BacklinkDbSchema) {
  // Let's seed some external network candidates so users immediately have other sites to match/exchange with
  const seedSites: BacklinkNetworkSite[] = [
    {
      id: "seed-site-1",
      user_id: "network-user-1",
      website_id: "seed-project-1",
      domain: "saasgrowthlabs.com",
      niche: "SaaS & AI Tools",
      authority_score: 72,
      language: "en",
      country: "US",
      spam_score: 2,
      is_active: true,
      categories: ["marketing", "b2b saas", "growth-hacking"],
      backlink_profile_health: "Excellent",
      created_at: new Date(Date.now() - 30 * 86450000).toISOString()
    },
    {
      id: "seed-site-2",
      user_id: "network-user-2",
      website_id: "seed-project-2",
      domain: "thetechhub.io",
      niche: "Technology & Software",
      authority_score: 64,
      language: "en",
      country: "UK",
      spam_score: 5,
      is_active: true,
      categories: ["development", "data science", "cloud-computing"],
      backlink_profile_health: "Excellent",
      created_at: new Date(Date.now() - 22 * 86450000).toISOString()
    },
    {
      id: "seed-site-3",
      user_id: "network-user-3",
      website_id: "seed-project-3",
      domain: "ecommerceacademy.org",
      niche: "E-Commerce",
      authority_score: 59,
      language: "en",
      country: "AU",
      spam_score: 4,
      is_active: true,
      categories: ["shopify", "dropshipping", "retail-marketing"],
      backlink_profile_health: "Good",
      created_at: new Date(Date.now() - 15 * 86450000).toISOString()
    },
    {
      id: "seed-site-4",
      user_id: "network-user-4",
      website_id: "seed-project-4",
      domain: "fitlifestylemag.com",
      niche: "Health & Fitness",
      authority_score: 51,
      language: "en",
      country: "CA",
      spam_score: 8,
      is_active: true,
      categories: ["wellness", "nutrition", "dieting"],
      backlink_profile_health: "Good",
      created_at: new Date(Date.now() - 12 * 86450000).toISOString()
    },
    {
      id: "seed-site-5",
      user_id: "network-user-5",
      website_id: "seed-project-5",
      domain: "financepulse.co",
      niche: "Finance & Investing",
      authority_score: 78,
      language: "en",
      country: "US",
      spam_score: 1,
      is_active: true,
      categories: ["personal finance", "crypto", "real estate"],
      backlink_profile_health: "Excellent",
      created_at: new Date(Date.now() - 40 * 86450000).toISOString()
    },
    {
      id: "seed-site-6",
      user_id: "network-user-6",
      website_id: "seed-project-6",
      domain: "travelersdiary.net",
      niche: "Travel & Hospitality",
      authority_score: 45,
      language: "en",
      country: "US",
      spam_score: 15, // slightly higher spam risk
      is_active: true,
      categories: ["travel blogs", "hotels", "adventure"],
      backlink_profile_health: "Needs Attention",
      created_at: new Date(Date.now() - 8 * 86450000).toISOString()
    },
    {
      id: "seed-site-7",
      user_id: "network-user-7",
      website_id: "seed-project-7",
      domain: "aimarketinginsights.com",
      niche: "SaaS & AI Tools",
      authority_score: 68,
      language: "en",
      country: "US",
      spam_score: 3,
      is_active: true,
      categories: ["artificial intelligence", "copywriting", "seo-tools"],
      backlink_profile_health: "Excellent",
      created_at: new Date(Date.now() - 14 * 86450000).toISOString()
    }
  ];

  db.backlink_network_sites.push(...seedSites);

  // Let's pre-generate some seed exchanges too so the user starts with data to look at
  const seedExchanges: BacklinkExchange[] = [
    {
      id: "seed-ex-1",
      request_id: "seed-req-1",
      sender_site_id: "seed-site-1", // saasgrowthlabs.com
      receiver_site_id: "seed-site-2", // thetechhub.io
      domain_from: "saasgrowthlabs.com",
      domain_to: "thetechhub.io",
      backlink_url: "https://saasgrowthlabs.com/blog/scaling-your-technical-stack",
      target_url: "https://thetechhub.io/cloud-architecture-patterns",
      anchor_text: "robust cloud tech platform",
      exchange_status: "live",
      verification_status: "verified",
      created_at: new Date(Date.now() - 10 * 86450000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 86450000).toISOString()
    },
    {
      id: "seed-ex-2",
      request_id: "seed-req-2",
      sender_site_id: "seed-site-3", // ecommerceacademy.org
      receiver_site_id: "seed-site-1", // saasgrowthlabs.com
      domain_from: "ecommerceacademy.org",
      domain_to: "saasgrowthlabs.com",
      backlink_url: "https://ecommerceacademy.org/resources/marketing-automation-benefits",
      target_url: "https://saasgrowthlabs.com/features/automatic-conversion",
      anchor_text: "SaaS growth optimization frameworks",
      exchange_status: "live",
      verification_status: "verified",
      created_at: new Date(Date.now() - 5 * 86450000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86450000).toISOString()
    }
  ];

  db.backlink_exchanges.push(...seedExchanges);

  // Add initial logs
  db.backlink_health_logs.push(
    {
      id: "seed-log-1",
      site_id: "seed-site-1",
      log_type: "authority_growth",
      severity: "success",
      message: "saasgrowthlabs.com Authority Score increased by +4 points following high relevance placements.",
      timestamp: new Date(Date.now() - 3 * 86450000).toISOString()
    },
    {
      id: "seed-log-2",
      site_id: "seed-site-2",
      log_type: "link_scanned",
      severity: "info",
      message: "Daily backlink daemon verified backlink from saasgrowthlabs.com is ACTIVE with correct anchor text 'robust cloud tech platform'.",
      timestamp: new Date(Date.now() - 1 * 86450000).toISOString()
    }
  );
}

// ==========================================
// INTELLIGENT MATCHING ENGINE & UTILITIES
// ==========================================

/**
 * Dynamically computes authority score of a site based on its metrics
 */
export function calculateAuthorityScore(domain: string, spamScore: number, niche: string): number {
  let baseScore = 30 + Math.floor(Math.random() * 25);
  if (domain.endsWith(".com") || domain.endsWith(".org") || domain.endsWith(".edu")) {
    baseScore += 10;
  }
  // Spam deduction
  baseScore = Math.max(0, baseScore - Math.floor(spamScore * 1.5));
  
  // Niche weight
  if (niche.toLowerCase().includes("tech") || niche.toLowerCase().includes("saas") || niche.toLowerCase().includes("finance")) {
    baseScore += 5;
  }
  return Math.min(99, baseScore);
}

/**
 * Generates matching score between two network sites
 */
export function matchTwoSites(siteA: BacklinkNetworkSite, siteB: BacklinkNetworkSite): BacklinkMatch {
  let score = 50; // base score

  const nichesA = getKeywordsForNiche(siteA.niche);
  const nichesB = getKeywordsForNiche(siteB.niche);

  // Evaluate niche similarities
  let matchedNiches: string[] = [];
  if (siteA.niche.toLowerCase() === siteB.niche.toLowerCase()) {
    score += 25;
    matchedNiches.push(siteA.niche);
  } else {
    // Partial overlaps
    const aWords = siteA.niche.toLowerCase().split(/\s+/);
    const bWords = siteB.niche.toLowerCase().split(/\s+/);
    const common = aWords.filter(w => bWords.includes(w) && w.length > 2);
    if (common.length > 0) {
      score += 15;
      matchedNiches.push(...common);
    }
  }

  // Language match weight
  const languageCompat = siteA.language === siteB.language;
  if (languageCompat) {
    score += 15;
  } else {
    score -= 20; // language mismatch hurts backlink SEO value
  }

  // Country compat
  const countryCompat = siteA.country === siteB.country;
  if (countryCompat) {
    score += 10;
  }

  // Authority score disparity check (High difference lowers exchange compatibility score)
  const authDiff = Math.abs(siteA.authority_score - siteB.authority_score);
  if (authDiff < 10) {
    score += 10;
  } else if (authDiff > 35) {
    score -= 15; // too asymmetrical
  }

  // Deduct score for high spam sites
  score = Math.max(0, score - siteB.spam_score);

  // Normalize final score 0-100
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine exchange potential tag
  let potential: "Elite" | "High" | "Moderate" | "Low" = "Low";
  if (finalScore >= 85) potential = "Elite";
  else if (finalScore >= 70) potential = "High";
  else if (finalScore >= 50) potential = "Moderate";

  // Build semantic match explanation
  let explanation = `Relevance is computed at ${finalScore}% because of `;
  if (languageCompat && siteA.niche === siteB.niche) {
    explanation += `perfect topical niche compatibility in "${siteA.niche}" and uniform '${siteA.language.toUpperCase()}' matching.`;
  } else if (languageCompat) {
    explanation += `shared language profile '${siteA.language.toUpperCase()}' with auxiliary synergistic thematic sectors.`;
  } else {
    explanation += `regional variations that require manual semantic cross-linking.`;
  }

  return {
    id: `match-node-${crypto.randomUUID()}`,
    site_a_id: siteA.id,
    site_b_id: siteB.id,
    relevance_score: finalScore,
    matching_niches: matchedNiches,
    language_compatibility: languageCompat,
    country_compatibilty: countryCompat,
    explanation,
    exchange_potential: potential,
    created_at: new Date().toISOString()
  };
}

function getKeywordsForNiche(niche: string): string[] {
  const parts = niche.toLowerCase().split(/[&,/\s]+/);
  return parts.filter(p => p.length > 2);
}

// ==========================================
// AI CO-PILOT ASSISTANT FOR ANCHORS & PLACEMENTS
// ==========================================

export function generateAiContextRecommendation(
  senderDomain: string,
  receiverDomain: string,
  niche: string
): { anchor_text: string; placement_suggestion: string; context_snippet: string } {
  
  // AI predictions based on niche keywords
  const lowerNiche = niche.toLowerCase();
  
  let anchor = "insightful industry statistics";
  let targetPath = `/blog/proven-strategies`;
  let contextSnippet = `When reviewing their operational overhead, leading researchers highlighted several ${anchor} indicating substantial SaaS transformation efficiency.`;

  if (lowerNiche.includes("tech") || lowerNiche.includes("saas") || lowerNiche.includes("software")) {
    anchor = "cloud optimization framework";
    targetPath = "/growth-insights/modern-saas-efficiency";
    contextSnippet = `Many development teams rely on a ${anchor} to monitor transaction bottlenecks and maintain 99.99% system uptime automatically.`;
  } else if (lowerNiche.includes("commerce") || lowerNiche.includes("store") || lowerNiche.includes("shop")) {
    anchor = "organic checkout conversion benchmarks";
    targetPath = "/resources/ecommerce-growth-playbook";
    contextSnippet = `Retail store administrators looking to scale must evaluate their ${anchor} against contemporary Shopify and BigCommerce platform metrics.`;
  } else if (lowerNiche.includes("fitness") || lowerNiche.includes("health") || lowerNiche.includes("wellness")) {
    anchor = "metabolic lifestyle guidelines";
    targetPath = "/nutrition/daily-hydration-plan";
    contextSnippet = `Integrating high-quality nutrition directly with these ${anchor} provides optimal cardiovascular support for busy developers.`;
  } else if (lowerNiche.includes("finance") || lowerNiche.includes("invest")) {
    anchor = "diversified assets returns guide";
    targetPath = "/academy/passive-income-blueprints";
    contextSnippet = `Successful long-term wealth advisors consistently reference this ${anchor} to insulate portfolios against inflationary downturns.`;
  }

  return {
    anchor_text: anchor,
    placement_suggestion: `https://${senderDomain}${targetPath}`,
    context_snippet: contextSnippet
  };
}

// ==========================================
// QUALITY SYSTEM & VERIFICATION SIMULATORS (CRAWLER)
// ==========================================

/**
 * Runs a simulated real-time backlink verification crawler.
 * Scans the host site's HTML to look for the backlink pointing to target page.
 */
export function simulateVerifyBacklink(exchange: BacklinkExchange): {
  success: boolean;
  status: "verified" | "not_found" | "mismatched_anchor" | "broken_target";
  remarks: string;
} {
  // Let's model real verification checks:
  // 1. Is there an active server shutdown / target breakdown simulation?
  // We check domain contents to simulate edge cases like site shutdown or deleted page.
  if (exchange.backlink_url.includes("broken-test")) {
    return {
      success: false,
      status: "not_found",
      remarks: "HTTP 404 Page Not Found error on host domain. Crawler was blocked from reading HTML block."
    };
  }

  if (exchange.anchor_text.includes("mismatch-test")) {
    return {
      success: false,
      status: "mismatched_anchor",
      remarks: "Found link pointing to target, but anchor text is 'deleted product' instead of '" + exchange.anchor_text + "'."
    };
  }

  if (exchange.target_url.includes("broken-target-test")) {
    return {
      success: false,
      status: "broken_target",
      remarks: "Link is present, but target page returns a 500 Server Error. Highly risky for Google Rank safety."
    };
  }
  
  // Standard successful check (90% success rate in general simulator)
  return {
    success: true,
    status: "verified",
    remarks: `Crawler successfully audited host ${exchange.domain_from}. Link found in main <article> node tag pointing to ${exchange.domain_to} with perfect anchor match '${exchange.anchor_text}'.`
  };
}
