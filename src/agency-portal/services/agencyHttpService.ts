import { 
  Agency, 
  AgencyMember, 
  AgencyClient, 
  AgencyReport, 
  AgencyActivityLog, 
  AgencyBrandingConfig 
} from "../types";

export interface AgencyInitPayload {
  success: boolean;
  agency: Agency;
  member: AgencyMember;
  clients: AgencyClient[];
  reports: AgencyReport[];
  teamMembers: AgencyMember[];
  activityLogs: AgencyActivityLog[];
}

export const agencyHttpService = {
  async init(userId: string, email: string): Promise<AgencyInitPayload> {
    const res = await fetch(`/api/agency/init?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error("Failed to initialize Agency profile");
    return res.json();
  },

  async updateBranding(agencyId: string, config: AgencyBrandingConfig): Promise<{ success: boolean; agency: Agency }> {
    const res = await fetch(`/api/agency/branding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, config })
    });
    if (!res.ok) throw new Error("Failed to update branding config");
    return res.json();
  },

  async createClient(agencyId: string, payload: { name: string; websites: string[]; assignedMembers: string[]; invitedEmail?: string }): Promise<{ success: boolean; client: AgencyClient }> {
    const res = await fetch(`/api/agency/clients/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, ...payload })
    });
    if (!res.ok) throw new Error("Failed to register new client portal");
    return res.json();
  },

  async updateClient(agencyId: string, clientId: string, payload: Partial<AgencyClient>): Promise<{ success: boolean; client: AgencyClient }> {
    const res = await fetch(`/api/agency/clients/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, clientId, ...payload })
    });
    if (!res.ok) throw new Error("Failed to update client details");
    return res.json();
  },

  async archiveClient(agencyId: string, clientId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/agency/clients/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, clientId })
    });
    if (!res.ok) throw new Error("Failed to archive client");
    return res.json();
  },

  async inviteClient(agencyId: string, clientId: string, email: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/agency/clients/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, clientId, email })
    });
    if (!res.ok) throw new Error("Failed to invite client viewer");
    return res.json();
  },

  async updateTeamRole(agencyId: string, targetUserId: string, role: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/agency/team/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, targetUserId, role })
    });
    if (!res.ok) throw new Error("Failed to update member permission role");
    return res.json();
  },

  async addTeamMember(agencyId: string, payload: { name: string; email: string; role: string }): Promise<{ success: boolean; member: AgencyMember }> {
    const res = await fetch(`/api/agency/team/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, ...payload })
    });
    if (!res.ok) throw new Error("Failed to append team affiliate partner/manager");
    return res.json();
  },

  async generateReport(agencyId: string, payload: { clientId: string; title: string; type: string; summary: string; recommendations: string[] }): Promise<{ success: boolean; report: AgencyReport }> {
    const res = await fetch(`/api/agency/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, ...payload })
    });
    if (!res.ok) throw new Error("Failed to generate custom branded report");
    return res.json();
  },

  async deleteReport(agencyId: string, reportId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/agency/reports/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId, reportId })
    });
    if (!res.ok) throw new Error("Failed to delete report from record index");
    return res.json();
  },

  async getPublicReport(token: string): Promise<{ success: boolean; report: AgencyReport; agency: Agency }> {
    const res = await fetch(`/api/agency/reports/public?token=${encodeURIComponent(token)}`);
    if (!res.ok) throw new Error("Failed to lookup shareable report URL");
    return res.json();
  }
};
