import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";

const directoryDbPath = path.join(process.cwd(), "directory_submission_db.json");

// ==========================================
// DATA ENTITIES AND STRUCTS
// ==========================================

export interface DirectoryNode {
  id: string;
  name: string;
  domain: string;
  category: "SaaS" | "AI Tools" | "Startup" | "SEO & Marketing" | "Business Review" | "Local & General";
  authority_score: number; // 0-100
  trust_score: number;     // 0-100
  niche_relevance: number; // calculated relative to project
  submission_difficulty: "Easy" | "Medium" | "High";
  approval_rate: number;   // 0-100
  is_premium_only: boolean;
  estimated_traffic: string;
  submission_url: string;
  created_at: string;
}

export interface DirectorySubmission {
  id: string;
  user_id: string;
  project_id: string;
  directory_id: string;
  directory_name: string;
  submission_status: "pending" | "processing" | "submitted" | "approved" | "rejected" | "retrying";
  approval_status: "under_review" | "approved" | "rejected" | "stale";
  listing_url?: string;
  backlink_status: "not_detected" | "live" | "no_follow" | "broken" | "removed";
  authority_score: number;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface DirectoryStatusLog {
  id: string;
  project_id: string;
  directory_name: string;
  log_type: "submitted" | "approved" | "rejected" | "backlink_found" | "scan_failed";
  severity: "info" | "success" | "warn" | "error";
  message: string;
  timestamp: string;
}

export interface AutoFillProfile {
  id: string;
  project_id: string;
  company_name: string;
  website_url: string;
  description_short: string;
  description_long: string;
  category: string;
  founder_name: string;
  logo_url: string;
  contact_email: string;
  twitter_url: string;
  linkedin_url: string;
  keywords_array: string[];
}

export interface DirectoryDbSchema {
  directories: DirectoryNode[];
  directory_submissions: DirectorySubmission[];
  directory_status_logs: DirectoryStatusLog[];
  autofill_profiles: AutoFillProfile[];
}

// ==========================================
// PERSISTENT ACCESS METHODS
// ==========================================

export function readDirectoryDb(): DirectoryDbSchema {
  try {
    if (!fs.existsSync(directoryDbPath)) {
      const initialDb: DirectoryDbSchema = {
        directories: [],
        directory_submissions: [],
        directory_status_logs: [],
        autofill_profiles: []
      };
      
      // Seed default high-grade web directories
      seedDirectories(initialDb);
      fs.writeFileSync(directoryDbPath, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const data = fs.readFileSync(directoryDbPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("[DIRECTORY DB READ ERROR]:", err);
    return {
      directories: [],
      directory_submissions: [],
      directory_status_logs: [],
      autofill_profiles: []
    };
  }
}

export function writeDirectoryDb(db: DirectoryDbSchema): void {
  try {
    fs.writeFileSync(directoryDbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[DIRECTORY DB WRITE ERROR]:", err);
  }
}

// ==========================================
// SEED PREMIUM WEB DIRECTORIES
// ==========================================

function seedDirectories(db: DirectoryDbSchema) {
  const seedList: DirectoryNode[] = [
    {
      id: "dir-1",
      name: "ProductHunt",
      domain: "producthunt.com",
      category: "SaaS",
      authority_score: 91,
      trust_score: 89,
      niche_relevance: 95,
      submission_difficulty: "High",
      approval_rate: 82,
      is_premium_only: false,
      estimated_traffic: "3.5M/mo",
      submission_url: "https://www.producthunt.com/posts/new",
      created_at: new Date().toISOString()
    },
    {
      id: "dir-2",
      name: "There's an AI for That (TAAFT)",
      domain: "theresanaiforthat.com",
      category: "AI Tools",
      authority_score: 84,
      trust_score: 80,
      niche_relevance: 98,
      submission_difficulty: "Medium",
      approval_rate: 76,
      is_premium_only: false,
      estimated_traffic: "4.2M/mo",
      submission_url: "https://theresanaiforthat.com/submit/",
      created_at: new Date().toISOString()
    },
    {
      id: "dir-3",
      name: "AlternativeTo",
      domain: "alternativeto.net",
      category: "SaaS",
      authority_score: 88,
      trust_score: 85,
      niche_relevance: 90,
      submission_difficulty: "High",
      approval_rate: 68,
      is_premium_only: false,
      estimated_traffic: "2.1M/mo",
      submission_url: "https://alternativeto.net/software/create/",
      created_at: new Date().toISOString()
    },
    {
      id: "dir-4",
      name: "BetaList",
      domain: "betalist.com",
      category: "Startup",
      authority_score: 75,
      trust_score: 70,
      niche_relevance: 88,
      submission_difficulty: "Easy",
      approval_rate: 90,
      is_premium_only: false,
      estimated_traffic: "450K/mo",
      submission_url: "https://betalist.com/submit",
      created_at: new Date().toISOString()
    },
    {
      id: "dir-5",
      name: "Crunchbase Registry",
      domain: "crunchbase.com",
      category: "Startup",
      authority_score: 92,
      trust_score: 91,
      niche_relevance: 85,
      submission_difficulty: "Medium",
      approval_rate: 80,
      is_premium_only: false,
      estimated_traffic: "12M/mo",
      submission_url: "https://www.crunchbase.com/add-organization",
      created_at: new Date().toISOString()
    },
    {
      id: "dir-6",
      name: "Futurepedia",
      domain: "futurepedia.io",
      category: "AI Tools",
      authority_score: 78,
      trust_score: 74,
      niche_relevance: 92,
      submission_difficulty: "Medium",
      approval_rate: 87,
      is_premium_only: true, // Premium directory submission bypass
      estimated_traffic: "1.8M/mo",
      submission_url: "https://www.futurepedia.io/submit-tool",
      created_at: new Date().toISOString()
    },
    {
      id: "dir-7",
      name: "SaaS Hub",
      domain: "saashub.com",
      category: "SaaS",
      authority_score: 72,
      trust_score: 68,
      niche_relevance: 86,
      submission_difficulty: "Easy",
      approval_rate: 95,
      is_premium_only: false,
      estimated_traffic: "600K/mo",
      submission_url: "https://www.saashub.com/submit",
      created_at: new Date().toISOString()
    },
    {
      id: "dir-8",
      name: "Startup Pitch",
      domain: "startuppitch.com",
      category: "Startup",
      authority_score: 55,
      trust_score: 52,
      niche_relevance: 70,
      submission_difficulty: "Easy",
      approval_rate: 98,
      is_premium_only: false,
      estimated_traffic: "40K/mo",
      submission_url: "https://startuppitch.com/submit-pitch/",
      created_at: new Date().toISOString()
    },
    {
      id: "dir-9",
      name: "Moose SEO Directory",
      domain: "moosesodir.org",
      category: "SEO & Marketing",
      authority_score: 60,
      trust_score: 55,
      niche_relevance: 72,
      submission_difficulty: "Easy",
      approval_rate: 94,
      is_premium_only: false,
      estimated_traffic: "25K/mo",
      submission_url: "https://moosesodir.org/add-site",
      created_at: new Date().toISOString()
    },
    {
      id: "dir-10",
      name: "AppSumo Launchpad",
      domain: "appsumo.com",
      category: "SaaS",
      authority_score: 90,
      trust_score: 88,
      niche_relevance: 92,
      submission_difficulty: "High",
      approval_rate: 65,
      is_premium_only: true,
      estimated_traffic: "5.5M/mo",
      submission_url: "https://appsumo.com/partners/apply",
      created_at: new Date().toISOString()
    }
  ];

  db.directories.push(...seedList);
}

// ==========================================
// AI PLACEMENT ENHANCEMENT ENGINE
// ==========================================

export function generateAiDescriptionProposal(
  companyName: string,
  niche: string,
  keywordsString: string
): { shortDesc: string; longDesc: string } {
  const shortDesc = `A state-of-the-art ${niche} framework designed to accelerate operations, streamline key parameters, and optimize search-grade ranking visibility.`;
  const longDesc = `Introducing ${companyName}, a modern ${niche} platform built explicitly for high-growth digital teams. Leveraging natural semantic matching, interlinked assets, and real-time indexing models, it transforms how engineers approach optimization. Secure, robust, and aligned with modern SEO standards, ${companyName} integrates critical workflow components to minimize overhead while maximizing long-term authority growth. Compatible keywords include: ${keywordsString || niche.toLowerCase()}.`;

  return { shortDesc, longDesc };
}

// ==========================================
// CRAWLER & CRAWL DAEMON VERIFICATIONS
// ==========================================

export function simulateDirectoryVerification(submission: DirectorySubmission): {
  success: boolean;
  approval_status: "approved" | "rejected" | "under_review";
  backlink_status: "live" | "no_follow" | "not_detected";
  listing_url: string;
  remarks: string;
} {
  // Let's create realistic success ratios
  const rand = Math.random();

  // If already rejected or submitted, let's run the crawl audit simulator
  if (rand < 0.85) {
    return {
      success: true,
      approval_status: "approved",
      backlink_status: "live",
      listing_url: `https://www.${submission.directory_name.toLowerCase().replace(/\s+/g, "")}.com/listing/project-nodes`,
      remarks: `Auditor Robot confirmed active catalog index record. Dynamic backlink is active in high-weight thematic blocks.`
    };
  } else if (rand < 0.95) {
    return {
      success: true,
      approval_status: "under_review",
      backlink_status: "not_detected",
      listing_url: "",
      remarks: "Site listing registered to index queue, pending manual verification by directory moderator boards."
    };
  } else {
    return {
      success: false,
      approval_status: "rejected",
      backlink_status: "not_detected",
      listing_url: "",
      remarks: "Submission flagged for categorization misfit or lacking sufficient secondary brand metadata blocks."
    };
  }
}
