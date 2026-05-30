import React from "react";
import { 
  Building, 
  Layers, 
  Flame, 
  Award, 
  TrendingUp, 
  Users, 
  Globe2, 
  Briefcase, 
  FileText,
  Clock,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Agency, AgencyClient, AgencyReport, AgencyActivityLog, AgencyMember } from "../types";

interface DashboardTabProps {
  agency: Agency;
  clients: AgencyClient[];
  reports: AgencyReport[];
  team: AgencyMember[];
  logs: AgencyActivityLog[];
  onNavigateToTab: (tabId: string) => void;
  onSimulateMetricUpgrade?: () => void;
}

export default function DashboardTab({
  agency,
  clients,
  reports,
  team,
  logs,
  onNavigateToTab
}: DashboardTabProps) {
  const activeClients = clients.filter(c => c.status === "active");
  const totalWebsitesCount = activeClients.reduce((acc, c) => acc + c.websites.length, 0);
  
  // Calculate agency score aggregates
  const avgSeoScore = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + (r.metrics.seoScore || 80), 0) / reports.length) 
    : 88;

  const totalKeywords = reports.reduce((acc, r) => acc + (r.metrics.keywordsCount || 0), 0) || 4540;
  const totalOrganicTraffic = reports.reduce((acc, r) => acc + (r.metrics.organicTraffic || 0), 0) || 52100;
  const totalBacklinks = reports.reduce((acc, r) => acc + (r.metrics.backlinksCount || 0), 0) || 720;

  // Chart data representing growth
  const clientGrowthData = [
    { month: "Jan", clients: 1, traffic: 12000, backlinks: 120, keywords: 1500 },
    { month: "Feb", clients: 2, traffic: 18500, backlinks: 210, keywords: 2100 },
    { month: "Mar", clients: 2, traffic: 29000, backlinks: 340, keywords: 3400 },
    { month: "Apr", clients: 3, traffic: 41000, backlinks: 510, keywords: 3900 },
    { month: "May", clients: clients.length, traffic: totalOrganicTraffic, backlinks: totalBacklinks, keywords: totalKeywords }
  ];

  return (
    <div className="space-y-6" id="agency-dashboard-tab">
      
      {/* Upper Branded Hello Shield */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">
              Agency & Growth Engine Live
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-3 text-slate-100">
              {agency.name} White-Label Suite
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xl font-medium">
              Oversee multi-client website parameters, design responsive portal views, and generate branded SEO reports fully isolated from RankSyncer's public namespaces.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-700/60 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-450 block tracking-wider">Subscription Suite</span>
              <span className="text-sm font-black text-indigo-400 uppercase tracking-widest block mt-0.5">
                {agency.tier} Tier
              </span>
            </div>
            <button 
              onClick={() => onNavigateToTab("branding")}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4.5 py-3 text-xs font-black rounded-xl cursor-pointer transition-all flex items-center gap-2 hover:shadow-lg shadow-emerald-500/10"
              id="btn-goto-branding"
            >
              Configure White-Label
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-3xs hover:shadow-2xs transition-all relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-r" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Clients</span>
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{clients.length}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">+{clients.length - 1} New</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Active client rosters</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-3xs hover:shadow-2xs transition-all relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-r" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Active Websites</span>
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
              <Globe2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{totalWebsitesCount}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">Live Track</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">SERP parameters monitored</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-3xs hover:shadow-2xs transition-all relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-r" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">SEO Client Avg Score</span>
            <div className="bg-amber-50 p-2 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{avgSeoScore}%</span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">Excellent</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Across compiled audits</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-3xs hover:shadow-2xs transition-all relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500 rounded-r" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Subdomain Backlinks</span>
            <div className="bg-violet-50 p-2 rounded-xl text-violet-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{totalBacklinks}</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">+9.2% MoM</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Acquired guest referrals</p>
        </div>

      </div>

      {/* Main Grid: Chart and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart Column (8 cols) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-800">Operational Agency Analytics</h2>
              <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5">Aggregate Client Growth & Content Yield Trends</p>
            </div>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                Audited Traffic index
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                Backlink Acquisition Target
              </span>
            </div>
          </div>

          <div className="h-64 mt-4 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={clientGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBacklinks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white", 
                    border: "1px solid #f1f5f9", 
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }} 
                  labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#475569" }}
                />
                <Area type="monotone" dataKey="traffic" name="Organic Traffic" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTraffic)" />
                <Area type="monotone" dataKey="backlinks" name="Guest Referral Posts" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBacklinks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity & Staff Column (4 cols) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs space-y-4 lg:col-span-4 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-indigo-500" />
                <h3 className="text-sm font-black tracking-tight text-slate-800">Isolation Activity Log</h3>
              </div>
              <span className="text-[10px] font-black uppercase text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                Audit Trail Secured
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-76 pr-1 divide-y divide-slate-50">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Flame className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                  <p className="text-xs font-black uppercase">No activity logged</p>
                  <p className="text-[10px] text-slate-400">Actions made in client consoles spawn logs here.</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="pt-3 first:pt-0 space-y-1">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-extrabold text-slate-800 break-words max-w-[70%]">
                        {log.action}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-1.5 text-[9px] text-indigo-500 font-black">
                      <Users className="h-2.5 w-2.5" />
                      {log.user_email}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase">Team Member Load</span>
                <p className="text-xs font-bold text-slate-700 mt-0.5">{team.length} users active</p>
              </div>
              <button
                onClick={() => onNavigateToTab("permissions")}
                className="text-[10px] font-black text-indigo-650 hover:text-indigo-800 uppercase flex items-center gap-1.5 cursor-pointer"
              >
                Configure Staff
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
