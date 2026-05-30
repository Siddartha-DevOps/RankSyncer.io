export interface AgencyBrandingConfig {
  logoUrl?: string;
  brandName: string;
  faviconUrl?: string;
  primaryColor: string; // Tailwind tint (e.g. "emerald", "indigo", "violet", "sky", "crimson")
  emailBranding?: {
    senderName: string;
    senderEmail: string;
    footerText: string;
  };
  customDomain?: string;
  whiteLabelEnabled: boolean;
}

export interface Agency {
  agency_id: string; // Unique ID / matching org ID
  owner_user_id: string;
  name: string;
  branding_config: AgencyBrandingConfig;
  tier: 'starter' | 'growth' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface AgencyMember {
  user_id: string;
  agency_id: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'specialist' | 'content_manager' | 'viewer';
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AgencyClient {
  client_id: string;
  agency_id: string;
  name: string;
  websites: string[]; // Domains monitored
  status: 'active' | 'archived';
  invitedEmail?: string;
  inviteStatus?: 'none' | 'pending' | 'accepted';
  assignedMembers: string[]; // user_ids assigned from team
  created_at: string;
  updated_at: string;
}

export interface AgencyReport {
  report_id: string;
  agency_id: string;
  client_id: string;
  clientName?: string;
  title: string;
  type: 'seo' | 'ranking' | 'backlink' | 'content' | 'growth';
  sections: {
    executiveSummary: string;
    recommendations: string[];
  };
  metrics: {
    seoScore?: number;
    keywordsCount?: number;
    organicTraffic?: number;
    backlinksCount?: number;
    domainRating?: number;
  };
  shareable_token: string;
  created_at: string;
  updated_at: string;
}

export interface AgencyActivityLog {
  id: string;
  agency_id: string;
  client_id?: string;
  user_id: string;
  user_email: string;
  action: string;
  details: string;
  created_at: string;
}

export interface AgencyPortalDb {
  agencies: Agency[];
  agency_members: AgencyMember[];
  agency_clients: AgencyClient[];
  agency_reports: AgencyReport[];
  agency_activity_logs: AgencyActivityLog[];
}
