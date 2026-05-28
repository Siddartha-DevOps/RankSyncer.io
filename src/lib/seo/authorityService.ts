import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";

const authorityDbPath = path.join(process.cwd(), "authority_intelligence_db.json");

// ==========================================
// DB ENTITY SCHEMAS
// ==========================================

export interface AuthoritySnapshot {
  id: string;
  user_id: string;
  project_id: string;
  domain: string;
  current_dr: number; // Domain Rating (Ahrefs style)
  current_da: number; // Domain Authority (Moz style)
  referring_domains: number;
  backlinks: number;
  authority_score: number; // Composite (0 - 100)
  growth_percentage: number;
  velocity: number; // Points gained per month rate
  trust_flow: number; // Majestic style
  citation_flow: number; // Majestic style
  snapshot_date: string; // ISO date format
  created_at: string;
}

export interface AuthorityCompetitor {
  id: string;
  project_id: string;
  domain: string;
  competitor_name: string;
  current_dr: number;
  current_da: number;
  referring_domains: number;
  backlinks: number;
  authority_gap: number; // Gap between project and this competitor
  is_verified: boolean;
  created_at: string;
}

export interface AuthorityAlert {
  id: string;
  project_id: string;
  alert_type: "dr_increase" | "dr_decrease" | "da_increase" | "milestone_achieved" | "competitor_overtake" | "abrupt_drop";
  severity: "info" | "success" | "warn" | "error";
  title: string;
  message: string;
  triggered_at: string;
  is_read: boolean;
}

export interface AuthorityReport {
  id: string;
  project_id: string;
  report_type: "weekly" | "monthly";
  duration_label: string;
  start_da: number;
  end_da: number;
  start_dr: number;
  end_dr: number;
  backlink_gains: number;
  referring_domains_gains: number;
  summary: string;
  created_at: string;
}

export interface AuthorityDbSchema {
  authority_snapshots: AuthoritySnapshot[];
  competitor_authority_tracking: AuthorityCompetitor[];
  authority_alerts: AuthorityAlert[];
  authority_reports: AuthorityReport[];
}

// ==========================================
// DB OPERATIONS WITH PERSISTENCE
// ==========================================

export function readAuthorityDb(): AuthorityDbSchema {
  try {
    if (!fs.existsSync(authorityDbPath)) {
      const initialDb: AuthorityDbSchema = {
        authority_snapshots: [],
        competitor_authority_tracking: [],
        authority_alerts: [],
        authority_reports: []
      };
      
      // Seed prefilled data so that the charts render historical lines immediately on startup
      seedHistoricalAuthorityData(initialDb);
      fs.writeFileSync(authorityDbPath, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const data = fs.readFileSync(authorityDbPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[AUTHORITY DB READ ERROR]:", err);
    return {
      authority_snapshots: [],
      competitor_authority_tracking: [],
      authority_alerts: [],
      authority_reports: []
    };
  }
}

export function writeAuthorityDb(db: AuthorityDbSchema): void {
  try {
    fs.writeFileSync(authorityDbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[AUTHORITY DB WRITE ERROR]:", err);
  }
}

// ==========================================
// SEED GENERATOR FOR LONG-TERM SEO TIMELINES
// ==========================================

function seedHistoricalAuthorityData(db: AuthorityDbSchema) {
  // Let's seed history over the last 12 weeks for a default project "p-1"
  const baselineDate = Date.now();
  const ONE_DAY_MS = 86400000;
  
  // Snapshots (Project: p-1, Domain: buycoffees.com as custom demo target or general site)
  const snapshots: AuthoritySnapshot[] = [
    {
      id: "snap-1",
      user_id: "anonymous",
      project_id: "p-1",
      domain: "buycoffees.com",
      current_dr: 35,
      current_da: 31,
      referring_domains: 120,
      backlinks: 450,
      authority_score: 33,
      growth_percentage: 0.0,
      velocity: 0.2,
      trust_flow: 28,
      citation_flow: 32,
      snapshot_date: new Date(baselineDate - 60 * ONE_DAY_MS).toISOString(),
      created_at: new Date(baselineDate - 60 * ONE_DAY_MS).toISOString()
    },
    {
      id: "snap-2",
      user_id: "anonymous",
      project_id: "p-1",
      domain: "buycoffees.com",
      current_dr: 36,
      current_da: 33,
      referring_domains: 135,
      backlinks: 520,
      authority_score: 34,
      growth_percentage: 3.0,
      velocity: 0.5,
      trust_flow: 30,
      citation_flow: 34,
      snapshot_date: new Date(baselineDate - 45 * ONE_DAY_MS).toISOString(),
      created_at: new Date(baselineDate - 45 * ONE_DAY_MS).toISOString()
    },
    {
      id: "snap-3",
      user_id: "anonymous",
      project_id: "p-1",
      domain: "buycoffees.com",
      current_dr: 38,
      current_da: 35,
      referring_domains: 158,
      backlinks: 680,
      authority_score: 36,
      growth_percentage: 5.8,
      velocity: 1.2,
      trust_flow: 35,
      citation_flow: 38,
      snapshot_date: new Date(baselineDate - 30 * ONE_DAY_MS).toISOString(),
      created_at: new Date(baselineDate - 30 * ONE_DAY_MS).toISOString()
    },
    {
      id: "snap-4",
      user_id: "anonymous",
      project_id: "p-1",
      domain: "buycoffees.com",
      current_dr: 42,
      current_da: 38,
      referring_domains: 195,
      backlinks: 810,
      authority_score: 40,
      growth_percentage: 11.1,
      velocity: 2.1,
      trust_flow: 39,
      citation_flow: 40,
      snapshot_date: new Date(baselineDate - 15 * ONE_DAY_MS).toISOString(),
      created_at: new Date(baselineDate - 15 * ONE_DAY_MS).toISOString()
    },
    {
      id: "snap-5",
      user_id: "anonymous",
      project_id: "p-1",
      domain: "buycoffees.com",
      current_dr: 45,
      current_da: 41,
      referring_domains: 228,
      backlinks: 980,
      authority_score: 43,
      growth_percentage: 7.5,
      velocity: 2.4,
      trust_flow: 41,
      citation_flow: 42,
      snapshot_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ];

  db.authority_snapshots.push(...snapshots);

  // Seed competitors for comparison
  const competitors: AuthorityCompetitor[] = [
    {
      id: "comp-1",
      project_id: "p-1",
      domain: "coffeescape.io",
      competitor_name: "CoffeeScape",
      current_dr: 43,
      current_da: 39,
      referring_domains: 210,
      backlinks: 840,
      authority_gap: -2, // We overtook them recently (we are DR 45, they are 43)
      is_verified: true,
      created_at: new Date(baselineDate - 30 * ONE_DAY_MS).toISOString()
    },
    {
      id: "comp-2",
      project_id: "p-1",
      domain: "brewmastery.com",
      competitor_name: "BrewMastery HQ",
      current_dr: 52,
      current_da: 48,
      referring_domains: 310,
      backlinks: 1450,
      authority_gap: 7, // Brewmastery is still ahead
      is_verified: true,
      created_at: new Date(baselineDate - 30 * ONE_DAY_MS).toISOString()
    },
    {
      id: "comp-3",
      project_id: "p-1",
      domain: "espressohub.org",
      competitor_name: "EspressoHub",
      current_dr: 40,
      current_da: 37,
      referring_domains: 170,
      backlinks: 710,
      authority_gap: -5, // We lead by 5 points
      is_verified: true,
      created_at: new Date(baselineDate - 30 * ONE_DAY_MS).toISOString()
    }
  ];

  db.competitor_authority_tracking.push(...competitors);

  // Seed relative milestone alerts
  db.authority_alerts.push(
    {
      id: "alert-1",
      project_id: "p-1",
      alert_type: "dr_increase",
      severity: "success",
      title: "Domain Rating Improved",
      message: "Congratulations! buycoffees.com Domain Rating (DR) jumped from 38 to 42 (+4) following backlinks from high authority blog.",
      triggered_at: new Date(baselineDate - 15 * ONE_DAY_MS).toISOString(),
      is_read: false
    },
    {
      id: "alert-2",
      project_id: "p-1",
      alert_type: "competitor_overtake",
      severity: "success",
      title: "Overtook Competitor coffeescape.io",
      message: "Overtake Achieved! buycoffees.com (DR 45) moved ahead of coffeescape.io (DR 43) in general search authority ranking.",
      triggered_at: new Date(baselineDate - 5 * ONE_DAY_MS).toISOString(),
      is_read: false
    },
    {
      id: "alert-3",
      project_id: "p-1",
      alert_type: "milestone_achieved",
      severity: "success",
      title: "DA Level 40 Milestone Unlocked",
      message: "Authority Milestone! buycoffees.com unlocked Domain Authority 41. You have advanced into the Top 25% of niche competitors.",
      triggered_at: new Date(baselineDate - 2 * ONE_DAY_MS).toISOString(),
      is_read: false
    }
  );

  // Seed default summary report
  db.authority_reports.push({
    id: "rep-1",
    project_id: "p-1",
    report_type: "monthly",
    duration_label: "May 2026 Monthly Summary",
    start_da: 35,
    end_da: 41,
    start_dr: 38,
    end_dr: 45,
    backlink_gains: 300,
    referring_domains_gains: 70,
    summary: "May 2026 has been an exceptional month of organic authority performance. Domain Authority jumped (+6 points) and Domain Rating rose (+7 points). Trust Flow climbed substantially due to high contextual parameters established, especially via safe niche network placements. The SEO velocity curve is fully vertical.",
    created_at: new Date().toISOString()
  });
}

// ==========================================
// DOMAIN AUTHORITY GROWTH HEURISTICS CALCULATOR
// ==========================================

export function computeCompositeSEOStrength(da: number, dr: number, trustFlow: number): number {
  return Math.min(100, Math.floor((da * 0.45) + (dr * 0.40) + (trustFlow * 0.15)));
}

export function generateAiInsights(
  siteDa: number,
  siteDr: number,
  backlinks: number,
  referringDomains: number,
  velocity: number
): { overview: string; scoreExplanation: string; correctiveActions: string[] } {
  let overview = "";
  let scoreExplanation = "";
  const correctiveActions: string[] = [];

  if (siteDa < 30) {
    overview = "This domain is established in the emerging sandbox category. Initial trust vectors are forming, but backlink volume remains decentralized.";
    scoreExplanation = "The score reflects low referring brand density. While initial crawl indexing looks healthy, search algorithms require higher citation weight.";
    correctiveActions.push(
      "Participate actively in the RankSyncer Backlink Network to secure high relevance, safe partner link placements.",
      "Publish 2-3 Pillar Content Hubs targeting keywords with under 20% Keyword Difficulty (KD).",
      "Resolve internal page indexing issues using the search console synchronization module."
    );
  } else if (siteDa < 50) {
    overview = `This domain enjoys strong mid-tier resonance. With an active authority velocity of ${velocity} points/month, you are accelerating past local competitors.`;
    scoreExplanation = `Excellent citation balance! Your referring domains count (${referringDomains}) represents high trust, but anchor text is highly concentrated around brand-related words.`;
    correctiveActions.push(
      "Diversify link profile anchors with LSI keywords to ensure maximum contextual indexing safety.",
      "Add 15 key authority milestones to your competitor tracking dashboard for side-by-side gap analysis.",
      "Initiate reciprocal guest-posts on domains with higher DR ratings (DR 50+) inside your niche circle."
    );
  } else {
    overview = "A premier, high-authority powerhouse. Search spiders prioritize crawling your index nodes, ensuring rapid content visibility.";
    scoreExplanation = "Premium SEO Strength is assured. The ratio of backlinks to referring domains indicates deep network value and healthy site trust metrics.";
    correctiveActions.push(
      "Leverage your high Domain Rating (DR) to co-publish collaborative studies with tier-1 webmasters.",
      "Optimize core anchor page architectures to pass link equity vertically into bottom-of-funnel landing pages."
    );
  }

  return {
    overview,
    scoreExplanation,
    correctiveActions
  };
}
