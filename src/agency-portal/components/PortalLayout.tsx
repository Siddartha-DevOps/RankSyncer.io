import React, { useEffect, useState } from "react";
import { 
  Building2, 
  Layers, 
  Users, 
  FileText, 
  Palette, 
  BarChart3, 
  CreditCard, 
  Briefcase,
  Sliders,
  AlertTriangle,
  Loader2,
  Lock,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { 
  Agency, 
  AgencyClient, 
  AgencyReport, 
  AgencyMember, 
  AgencyActivityLog, 
  AgencyBrandingConfig 
} from "../types";
import { agencyHttpService } from "../services/agencyHttpService";
import DashboardTab from "../dashboard/DashboardTab";
import ClientManagementTab from "../clients/ClientManagementTab";
import BrandedReportsTab from "../reports/BrandedReportsTab";
import WhiteLabelBrandingTab from "../branding/WhiteLabelBrandingTab";
import TeamPermissionsTab from "../permissions/TeamPermissionsTab";
import AgencyAnalyticsTab from "../analytics/AgencyAnalyticsTab";
import AgencyBillingTab from "../billing/AgencyBillingTab";
import SharedReportView from "./SharedReportView";

interface PortalLayoutProps {
  userId?: string;
  email?: string;
  theme?: "light" | "dark";
  onGlobalBrandingChange?: (brandName: string, logoUrl?: string, enabled?: boolean) => void;
}

export default function PortalLayout({
  userId = "demo-user",
  email = "demo@ranksyncer.co",
  theme = "light",
  onGlobalBrandingChange
}: PortalLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Roster States
  const [agency, setAgency] = useState<Agency | null>(null);
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [reports, setReports] = useState<AgencyReport[]>([]);
  const [team, setTeam] = useState<AgencyMember[]>([]);
  const [logs, setLogs] = useState<AgencyActivityLog[]>([]);
  
  // Navigation
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, clients, reports, branding, permissions, analytics, billing
  const [focusedToken, setFocusedToken] = useState<string | null>(null);

  const fetchRosterData = async () => {
    try {
      setError("");
      const payload = await agencyHttpService.init(userId, email);
      if (payload.success) {
        setAgency(payload.agency);
        setClients(payload.clients);
        setReports(payload.reports);
        setTeam(payload.teamMembers);
        setLogs(payload.activityLogs);
        
        // Notify parent workspace regarding branding override state
        if (onGlobalBrandingChange && payload.agency) {
          const cfg = payload.agency.branding_config;
          onGlobalBrandingChange(cfg.brandName, cfg.logoUrl, cfg.whiteLabelEnabled);
        }
      } else {
        setError("Invalid response from server agency handshake");
      }
    } catch (err: any) {
      console.error("[AGENCY ACCESS DENIED]:", err);
      setError(`Critical database connection timeout. details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRosterData();
    
    // Check if the URL has direct token query
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setFocusedToken(tokenParam);
    }
  }, [userId, email]);

  // Actions
  const handleUpdateBranding = async (config: AgencyBrandingConfig) => {
    if (!agency) return;
    const body = await agencyHttpService.updateBranding(agency.agency_id, config);
    if (body.success) {
      setAgency(body.agency);
      
      // Save locally & synchronize parent wrapper
      if (onGlobalBrandingChange) {
        onGlobalBrandingChange(config.brandName, config.logoUrl, config.whiteLabelEnabled);
      }
      
      await fetchRosterData();
    }
  };

  const handleAddClient = async (payload: { name: string; websites: string[]; assignedMembers: string[]; invitedEmail?: string }) => {
    if (!agency) return;
    const body = await agencyHttpService.createClient(agency.agency_id, payload);
    if (body.success) {
      await fetchRosterData();
    }
  };

  const handleUpdateClient = async (clientId: string, payload: Partial<AgencyClient>) => {
    if (!agency) return;
    const body = await agencyHttpService.updateClient(agency.agency_id, clientId, payload);
    if (body.success) {
      await fetchRosterData();
    }
  };

  const handleArchiveClient = async (clientId: string) => {
    if (!agency) return;
    const body = await agencyHttpService.archiveClient(agency.agency_id, clientId);
    if (body.success) {
      await fetchRosterData();
    }
  };

  const handleInviteClient = async (clientId: string, emailStr: string) => {
    if (!agency) return;
    const body = await agencyHttpService.inviteClient(agency.agency_id, clientId, emailStr);
    if (body.success) {
      await fetchRosterData();
    }
  };

  const handleAddTeamMember = async (payload: { name: string; email: string; role: string }) => {
    if (!agency) return;
    const body = await agencyHttpService.addTeamMember(agency.agency_id, payload);
    if (body.success) {
      await fetchRosterData();
    }
  };

  const handleUpdateTeamRole = async (targetUserId: string, role: string) => {
    if (!agency) return;
    const body = await agencyHttpService.updateTeamRole(agency.agency_id, targetUserId, role);
    if (body.success) {
      await fetchRosterData();
    }
  };

  const handleGenerateReport = async (payload: { clientId: string; title: string; type: string; summary: string; recommendations: string[] }) => {
    if (!agency) return;
    const body = await agencyHttpService.generateReport(agency.agency_id, payload);
    if (body.success) {
      await fetchRosterData();
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!agency) return;
    const body = await agencyHttpService.deleteReport(agency.agency_id, reportId);
    if (body.success) {
      await fetchRosterData();
    }
  };

  const handleUpdateTierStateMockValue = async (tier: "starter" | "growth" | "enterprise") => {
    if (!agency) return;
    setAgency(prev => prev ? { ...prev, tier } : null);
  };

  // If focused token is present, we render the public shared report view completely isolated from UI wrapper tabs!
  if (focusedToken) {
    return <SharedReportView token={focusedToken} onClose={() => setFocusedToken(null)} />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-12 text-slate-700 bg-white rounded-2xl border border-slate-100 shadow-2xs">
        <Loader2 className="h-8 w-8 text-indigo-650 animate-spin mb-3.5" />
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Restructuring multi-tenant variables...</p>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="bg-white border border-rose-100 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4 shadow-sm text-slate-800">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-black uppercase text-slate-850">Agency Database Locked</h3>
        <p className="text-xs text-slate-500 leading-relaxed font-semibold">{error || "Authentication or storage timeout"}</p>
        <button 
          onClick={fetchRosterData}
          className="bg-slate-850 hover:bg-slate-950 text-white font-black text-xs px-4.5 py-2.5 rounded-xl cursor-pointer"
        >
          Retry Connection Handshake
        </button>
      </div>
    );
  }

  const subtabs = [
    { id: "dashboard", label: "Agency Dashboard", icon: Building2 },
    { id: "clients", label: "Client Portals", icon: Briefcase },
    { id: "reports", label: "Branded Reports", icon: FileText },
    { id: "branding", label: "White-Label Specs", icon: Palette },
    { id: "permissions", label: "Staff Credentials", icon: Users },
    { id: "analytics", label: "Revenue Analytics", icon: BarChart3 },
    { id: "billing", label: "Billing & Plans", icon: CreditCard }
  ];

  return (
    <div className="space-y-6" id="agency-portal-layout">
      
      {/* Sub-navigation pill list */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-150 relative">
        {subtabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-slate-900 text-white shadow-3xs'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render selected subtab content */}
      <div className="transition-all duration-300" id={`agency-tab-content-${activeTab}`}>
        {activeTab === "dashboard" && (
          <DashboardTab 
            agency={agency}
            clients={clients}
            reports={reports}
            team={team}
            logs={logs}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "clients" && (
          <ClientManagementTab 
            clients={clients}
            team={team}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onArchiveClient={handleArchiveClient}
            onInviteClient={handleInviteClient}
          />
        )}

        {activeTab === "reports" && (
          <BrandedReportsTab 
            clients={clients}
            reports={reports}
            team={team}
            onGenerateReport={handleGenerateReport}
            onDeleteReport={handleDeleteReport}
          />
        )}

        {activeTab === "branding" && (
          <WhiteLabelBrandingTab 
            agency={agency}
            onUpdateBranding={handleUpdateBranding}
          />
        )}

        {activeTab === "permissions" && (
          <TeamPermissionsTab 
            team={team}
            onAddMember={handleAddTeamMember}
            onUpdateRole={handleUpdateTeamRole}
          />
        )}

        {activeTab === "analytics" && (
          <AgencyAnalyticsTab 
            clients={clients}
            reports={reports}
          />
        )}

        {activeTab === "billing" && (
          <AgencyBillingTab 
            agency={agency}
            onUpdateTier={handleUpdateTierStateMockValue}
          />
        )}
      </div>

    </div>
  );
}
