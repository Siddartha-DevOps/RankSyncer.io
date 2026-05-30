import fs from "fs";
import path from "path";
import { 
  AgencyPortalDb, 
  Agency, 
  AgencyMember, 
  AgencyClient, 
  AgencyReport, 
  AgencyActivityLog, 
  AgencyBrandingConfig 
} from "../types";

const DB_PATH = path.join(process.cwd(), "agency_portal_db.json");

const DEFAULT_DB: AgencyPortalDb = {
  agencies: [
    {
      agency_id: "demo-agency",
      owner_user_id: "demo-user",
      name: "Outranked Digital Group",
      branding_config: {
        brandName: "Outranked Portal",
        logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&q=80",
        faviconUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=32&h=32&fit=crop&q=80",
        primaryColor: "indigo",
        customDomain: "portal.outranked.co",
        whiteLabelEnabled: false,
        emailBranding: {
          senderName: "Outranked Digital",
          senderEmail: "reports@outranked.co",
          footerText: "Automated report powered by Outranked White-Label Infrastructure"
        }
      },
      tier: "growth",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  agency_members: [
    {
      user_id: "demo-user",
      agency_id: "demo-agency",
      email: "demo@ranksyncer.co",
      role: "owner",
      name: "Alex Sterling",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      user_id: "specialist-1",
      agency_id: "demo-agency",
      email: "sarah.m@outranked.co",
      role: "specialist",
      name: "Sarah Miller (SEO Specialist)",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      user_id: "writer-1",
      agency_id: "demo-agency",
      email: "david.k@outranked.co",
      role: "content_manager",
      name: "David K. (Content Lead)",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  agency_clients: [
    {
      client_id: "client-1",
      agency_id: "demo-agency",
      name: "E-Commerce Velocity Labs",
      websites: ["velocitylabs.io", "velocity-store.com"],
      status: "active",
      invitedEmail: "founder@velocitylabs.io",
      inviteStatus: "accepted",
      assignedMembers: ["demo-user", "specialist-1"],
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      client_id: "client-2",
      agency_id: "demo-agency",
      name: "Acme Healthcare Partners",
      websites: ["acmehealth.org"],
      status: "active",
      invitedEmail: "cmo@acmehealth.org",
      inviteStatus: "pending",
      assignedMembers: ["specialist-1", "writer-1"],
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      client_id: "client-3",
      agency_id: "demo-agency",
      name: "CoreSaaS Global Inc",
      websites: ["coresaas.io"],
      status: "active",
      invitedEmail: "billing@coresaas.io",
      inviteStatus: "none",
      assignedMembers: ["demo-user"],
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  agency_reports: [
    {
      report_id: "rep-1",
      agency_id: "demo-agency",
      client_id: "client-1",
      clientName: "E-Commerce Velocity Labs",
      title: "Q2 SEO Keyword Velocity Audit",
      type: "seo",
      sections: {
        executiveSummary: "Velocity Labs showed a strong keyword integration trend over the previous month, resulting in a +15% boost in target positions. Site speed remains a minor bottleneck for transactional pages.",
        recommendations: [
          "Enable WebP compression on store catalogues",
          "Acquire 3 high-tier directory backlink submissions this week",
          "Generate 10 structured articles centering 'Headless E-commerce checkout'"
        ]
      },
      metrics: {
        seoScore: 84,
        keywordsCount: 1450,
        organicTraffic: 14500,
        backlinksCount: 180,
        domainRating: 44
      },
      shareable_token: "tok-sec-vel-4081",
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      report_id: "rep-2",
      agency_id: "demo-agency",
      client_id: "client-1",
      clientName: "E-Commerce Velocity Labs",
      title: "May organic ranking progress log",
      type: "ranking",
      sections: {
        executiveSummary: "Rankings have solidified for primary keywords in regional hubs. Highly transactional terms are starting to peer into Top 5 SERP indexes.",
        recommendations: [
          "Interlink newest articles into existing category hubs",
          "Monitor crawling frequency updates from SERP bot logs"
        ]
      },
      metrics: {
        seoScore: 86,
        keywordsCount: 1495,
        organicTraffic: 15300,
        backlinksCount: 185,
        domainRating: 45
      },
      shareable_token: "tok-sec-vel-9541",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  agency_activity_logs: [
    {
      id: "act-1",
      agency_id: "demo-agency",
      client_id: "client-1",
      user_id: "demo-user",
      user_email: "demo@ranksyncer.co",
      action: "Branded Report Generated",
      details: "Created and locked secure report 'Q2 SEO Keyword Velocity Audit' with Outranked Digital branding configurations applied.",
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "act-2",
      agency_id: "demo-agency",
      client_id: "client-2",
      user_id: "demo-user",
      user_email: "demo@ranksyncer.co",
      action: "Client Invited",
      details: "Dispatched client portal invitation email to cmo@acmehealth.org.",
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

export function readAgencyDb(): AgencyPortalDb {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("[AGENCY DB SERVICE] Error reading db: ", e);
    return DEFAULT_DB;
  }
}

export function writeAgencyDb(data: AgencyPortalDb) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("[AGENCY DB SERVICE] Error writing db: ", e);
  }
}

export function getOrCreateAgency(userId: string, email: string): { agency: Agency; member: AgencyMember } {
  const db = readAgencyDb();
  
  // Find agency owned or managed by user
  let member = db.agency_members.find(m => m.user_id === userId);
  let agency = member ? db.agencies.find(a => a.agency_id === member?.agency_id) : undefined;
  
  if (!agency) {
    const agencyId = `agency-${userId.slice(0, 6) || "user"}-${Math.floor(Math.random() * 1000)}`;
    const brandName = `${email.split("@")[0].toUpperCase()} Growth Core`;
    
    agency = {
      agency_id: agencyId,
      owner_user_id: userId,
      name: brandName,
      branding_config: {
        brandName: brandName,
        logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop&q=80",
        faviconUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=32&h=32&fit=crop&q=80",
        primaryColor: "emerald",
        whiteLabelEnabled: false,
        emailBranding: {
          senderName: brandName,
          senderEmail: `reports@${email.split("@")[1] || "ranksyncer.co"}`,
          footerText: `Secured reports compiled by ${brandName} console`
        }
      },
      tier: "starter",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    member = {
      user_id: userId,
      agency_id: agencyId,
      email: email,
      role: "owner",
      name: email.split("@")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.agencies.push(agency);
    db.agency_members.push(member);
    
    // Seed standard dummy client
    const clientId = `client-${Math.floor(Math.random() * 10000)}`;
    const defaultClient: AgencyClient = {
      client_id: clientId,
      agency_id: agencyId,
      name: "Alpha Innovators Corp",
      websites: ["alpha-digital.com"],
      status: "active",
      inviteStatus: "none",
      assignedMembers: [userId],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.agency_clients.push(defaultClient);
    
    writeAgencyDb(db);
  }
  
  return { agency, member: member! };
}

export function logActivity(agencyId: string, userId: string, email: string, action: string, details: string, clientId?: string) {
  const db = readAgencyDb();
  const log: AgencyActivityLog = {
    id: `log-${Math.floor(Math.random() * 100000)}`,
    agency_id: agencyId,
    client_id: clientId,
    user_id: userId,
    user_email: email,
    action: action,
    details: details,
    created_at: new Date().toISOString()
  };
  db.agency_activity_logs.unshift(log);
  if (db.agency_activity_logs.length > 300) {
    db.agency_activity_logs = db.agency_activity_logs.slice(0, 300);
  }
  writeAgencyDb(db);
}
