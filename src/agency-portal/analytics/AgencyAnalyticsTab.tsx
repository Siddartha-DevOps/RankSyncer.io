import React from "react";
import { 
  DollarSign, 
  TrendingUp, 
  UserCheck, 
  Percent, 
  ArrowUpRight, 
  BarChart4, 
  BookOpen, 
  Activity,
  Award,
  Globe2,
  PieChart
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { AgencyClient, AgencyReport } from "../types";

interface AgencyAnalyticsTabProps {
  clients: AgencyClient[];
  reports: AgencyReport[];
}

export default function AgencyAnalyticsTab({
  clients,
  reports
}: AgencyAnalyticsTabProps) {
  
  // Calculate analytics totals
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "active").length;
  const retentionRate = totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 100;
  
  // Base rates for mockup MRR (e.g., $1500 per active client)
  const estMmr = activeClients * 1500;
  const totalLtvEst = activeClients * 9000;

  // Chart data
  const revenueTrendData = [
    { month: "Jan", mrr: 1500, articles: 25, growth: 12 },
    { month: "Feb", mrr: 3000, articles: 48, growth: 18 },
    { month: "Mar", mrr: 3000, articles: 72, growth: 24 },
    { month: "Apr", mrr: 4500, articles: 110, growth: 38 },
    { month: "May", mrr: estMmr, articles: 145, growth: 46 }
  ];

  return (
    <div className="space-y-6" id="agency-analytics-tab">
      
      <div>
        <h2 className="text-base font-black text-slate-800 tracking-tight">Agency Performance & Revenue Analytics</h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">Diagnose administrative contract values, content production yields, and overall customer retention vectors.</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-3xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-indigo-150 group-hover:scale-110 transition-transform">
            <DollarSign className="h-10 w-10 shrink-0" />
          </div>
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Estimated Monthly Revenue</span>
          <p className="text-2xl font-black text-slate-850 mt-1.5">${estMmr.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>+12.4% MoM growth</span>
          </div>
        </div>

        {/* Card 2: LTV */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-3xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-emerald-150 group-hover:scale-110 transition-transform">
            <UserCheck className="h-10 w-10 shrink-0" />
          </div>
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Account Lifetime Value (LTV)</span>
          <p className="text-2xl font-black text-slate-850 mt-1.5">${totalLtvEst.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>Healthy retention index</span>
          </div>
        </div>

        {/* Card 3: Retention */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-3xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-rose-150 group-hover:scale-110 transition-transform">
            <Percent className="h-10 w-10 shrink-0" />
          </div>
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Roster Retention Ratio</span>
          <p className="text-2xl font-black text-slate-850 mt-1.5">{retentionRate}%</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-500 font-bold">
            <Activity className="h-3 w-3" />
            <span>0% churn this billing cycle</span>
          </div>
        </div>

        {/* Card 4: Reports Published */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-3xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-violet-150 group-hover:scale-110 transition-transform">
            <BookOpen className="h-10 w-10 shrink-0" />
          </div>
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Branded Reports Generated</span>
          <p className="text-2xl font-black text-slate-850 mt-1.5">{reports.length} units</p>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-indigo-600 font-bold">
            <TrendingUp className="h-3 w-3" />
            <span>Fully audited parameters</span>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue progress bar chart (BarChart) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <BarChart4 className="h-4.5 w-4.5 text-indigo-505" />
              Sustained Contract Monthly Revenue Trend
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Estimated MRR yield from active contracts ($USD)</p>
          </div>

          <div className="h-64 mt-4 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "white", border: "1px solid #f1f5f9", borderRadius: "12px" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#475569" }}
                />
                <Bar dataKey="mrr" name="Sustained MRR ($)" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Article production & Growth trends (Double line chart) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-emerald-505" />
              Content Outgoings & Keywords Indexed
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Content Planner deliverables correlated to organic position benchmarks</p>
          </div>

          <div className="h-64 mt-4 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "white", border: "1px solid #f1f5f9", borderRadius: "12px" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#475569" }}
                />
                <Line type="monotone" dataKey="articles" name="Articles Written" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="growth" name="SERP Visibility Index (+%)" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
