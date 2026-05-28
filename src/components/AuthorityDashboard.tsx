import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Users,
  Link,
  ShieldCheck,
  Plus,
  Trash2,
  Brain,
  AlertTriangle,
  Sparkles,
  Info,
  ChevronRight,
  FileCheck2,
  RefreshCw,
  Bell,
  Eye,
  Settings,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from "recharts";

interface AuthorityDashboardProps {
  projectId: string;
  theme: "light" | "dark";
  activePlan: "free" | "premium";
  siteDomain?: string;
}

export default function AuthorityDashboard({
  projectId,
  theme,
  activePlan,
  siteDomain = "buycoffees.com"
}: AuthorityDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [gains, setGains] = useState<any>({
    drGrowth: 0,
    daGrowth: 0,
    backlinksGrowth: 0,
    seoStrengthScore: 0,
    linkedExchangesCount: 0
  });
  const [aiInsights, setAiInsights] = useState<any>(null);

  // Form states
  const [newCompDomain, setNewCompDomain] = useState("");
  const [newCompName, setNewCompName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [chartMetric, setChartMetric] = useState<"da_dr" | "backlinks">("da_dr");

  useEffect(() => {
    fetchDashboardData();
  }, [projectId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/authority/dashboard?projectId=${projectId}&activePlan=${activePlan}`);
      const data = await res.json();
      if (data.success) {
        setSnapshots(data.snapshots);
        setLatestSnapshot(data.latestSnapshot);
        setCompetitors(data.competitors);
        setAlerts(data.alerts);
        setReports(data.reports);
        setGains(data.gains);
        setAiInsights(data.aiInsights);
      } else {
        setErrorMessage(data.error || "Failed to load authority parameters.");
      }
    } catch (err) {
      setErrorMessage("Network error occurred while fetching authority parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackDomainSnapshot = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/authority/track-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          domain: siteDomain,
          activePlan
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Dynamic SEO scan completed! Captured latest authority snapshot successfully.`);
        fetchDashboardData();
      } else {
        setErrorMessage(data.error || "Could not retrieve authority metrics.");
      }
    } catch (err) {
      setErrorMessage("Service is temporarily unreachable. Try again in a minute.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!newCompDomain || !newCompName) {
      setErrorMessage("Please fill all competitor parameters.");
      return;
    }

    try {
      const res = await fetch("/api/authority/add-competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          domain: newCompDomain,
          competitorName: newCompName,
          activePlan
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Competitor "${newCompName}" successfully registered to comparison matrix.`);
        setNewCompDomain("");
        setNewCompName("");
        fetchDashboardData();
      } else {
        setErrorMessage(data.error || "Could not add competitor.");
      }
    } catch (err) {
      setErrorMessage("Failed to add competitor. Check network.");
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    try {
      const res = await fetch("/api/authority/delete-competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorId: id })
      });
      if (res.ok) {
        setSuccessMessage("Competitor unlinked successfully.");
        fetchDashboardData();
      }
    } catch (err) {
      setErrorMessage("Could not unlink competitor.");
    }
  };

  const handleDismissAlerts = async (alertId?: string) => {
    try {
      await fetch("/api/authority/dismiss-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, alertId })
      });
      fetchDashboardData();
    } catch (err) {
      console.log("Dismiss error", err);
    }
  };

  const handleGenerateReport = async (reportType: "weekly" | "monthly") => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/authority/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, reportType })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`${reportType.toUpperCase()} Authority Digest successfully compiled!`);
        fetchDashboardData();
      } else {
        setErrorMessage(data.error || "Failed to generate report.");
      }
    } catch (err) {
      setErrorMessage("Report synthesis failed.");
    } finally {
      setLoading(false);
    }
  };

  // Setup formatted chart data
  const formattedChartData = snapshots.map((s, index) => {
    const d = new Date(s.snapshot_date);
    return {
      name: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      DA: s.current_da,
      DR: s.current_dr,
      "Referring Domains": s.referring_domains,
      Backlinks: s.backlinks,
      "Trust Flow": s.trust_flow
    };
  });

  const activeAlerts = alerts.filter(a => !a.is_read);

  return (
    <div className={`p-6 rounded-3xl space-y-8 ${theme === "dark" ? "bg-[#080d0a] text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-950/20 dark:border-emerald-500/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Authority Intelligence
            </span>
            {activePlan === "free" ? (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Sandbox Mode (Free)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">
                Premium Core Suite
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight font-sans">
            Domain Authority & Rating Control
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xl">
            Track Domain Rating (DR), Domain Authority (DA), backlink gains, competitor score drift, and automate strategic SEO growth decisions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className={`p-2.5 rounded-xl border cursor-pointer border-slate-700/50 hover:bg-slate-800/45 text-slate-300 transition-all ${loading ? "animate-spin" : ""}`}
            title="Refresh Scans"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleTrackDomainSnapshot}
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-bold rounded-xl text-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            {loading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <ShieldCheck className="h-4.5 w-4.5" />}
            Trigger Live Crawler Refresh
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUSES */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 animate-bounce" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ALERT CENTER */}
      {activeAlerts.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-200 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400 animate-pulse" />
              <span className="font-bold tracking-tight">Active Authority Events ({activeAlerts.length})</span>
            </div>
            <button
              onClick={() => handleDismissAlerts()}
              className="text-[10px] uppercase font-bold text-slate-400 hover:text-white underline cursor-pointer"
            >
              Clear All Alerts
            </button>
          </div>
          <div className="space-y-2">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="flex items-start justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                <div className="space-y-0.5">
                  <span className="font-semibold text-white block">{alert.title}</span>
                  <span className="text-slate-400">{alert.message}</span>
                </div>
                <button
                  onClick={() => handleDismissAlerts(alert.id)}
                  className="text-slate-400 hover:text-rose-400 font-bold ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN METRIC ROW HERO */}
      {latestSnapshot && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-900/20 border border-slate-800">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">Domain Rating (DR)</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Award className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight">{latestSnapshot.current_dr}</span>
              <span className={`text-[10px] font-bold ${gains.drGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {gains.drGrowth >= 0 ? "+" : ""}{gains.drGrowth} pts
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-450 flex justify-between">
              <span>Velocity: {latestSnapshot.velocity}/mo</span>
              <span className="text-[#4ade80] font-bold">Standard Ahrefs style</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-900/20 border border-slate-800">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">Domain Authority (DA)</span>
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight">{latestSnapshot.current_da}</span>
              <span className={`text-[10px] font-bold ${gains.daGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {gains.daGrowth >= 0 ? "+" : ""}{gains.daGrowth} pts
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-450 flex justify-between">
              <span>Comparing last 30d</span>
              <span className="text-blue-400 font-bold">Standard Moz style</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-900/20 border border-slate-800">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">Referring Domains</span>
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight">{latestSnapshot.referring_domains}</span>
              <span className="text-[10px] text-slate-450">Active sources</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-450 flex justify-between">
              <span>Backlinks: {latestSnapshot.backlinks}</span>
              <span className="text-indigo-400 font-bold">Safe citations</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-[#0e1713] border border-emerald-500/15">
            <div className="flex justify-between items-start">
              <span className="text-xs text-slate-350 font-bold uppercase tracking-wider">SEO STRENGTH SCORE</span>
              <span className="p-1 px-2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold animate-pulse">
                Composite
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#4ade80] tracking-tight">{gains.seoStrengthScore}%</span>
              <span className="text-[10px] text-slate-450">Trust index</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              Correlated with {gains.linkedExchangesCount} active private exchange link contracts.
            </div>
          </div>

        </div>
      )}

      {/* CORE HISTORICAL GROWTH VISUALIZATIONS */}
      {snapshots.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-800 bg-[#0a0f0d] space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold tracking-tight">Authority & Ranking Growth Curve</h3>
                <p className="text-[11px] text-slate-450">Historical tracking of Moz DA, Ahrefs DR, or backlink density over the last 90 days.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartMetric("da_dr")}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    chartMetric === "da_dr" ? "bg-emerald-500 text-black" : "bg-slate-900 border border-slate-800 text-slate-400"
                  }`}
                >
                  Moz DA / Ahrefs DR
                </button>
                <button
                  onClick={() => setChartMetric("backlinks")}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    chartMetric === "backlinks" ? "bg-emerald-500 text-black" : "bg-slate-900 border border-slate-800 text-slate-400"
                  }`}
                >
                  Referring Domains / Backlinks
                </button>
              </div>
            </div>

            <div className="h-68">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedChartData}>
                  <defs>
                    <linearGradient id="colorDA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#16221c" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0a0f0d', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fafafa'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  {chartMetric === "da_dr" ? (
                    <>
                      <Area type="monotone" dataKey="DA" stroke="#4ade80" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDA)" name="Domain Authority (DA)" />
                      <Area type="monotone" dataKey="DR" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDR)" name="Domain Rating (DR)" />
                    </>
                  ) : (
                    <>
                      <Area type="monotone" dataKey="Referring Domains" stroke="#818cf8" strokeWidth={2} fillOpacity={0.05} fill="#818cf8" name="Referring Domains" />
                      <Area type="monotone" dataKey="Backlinks" stroke="#ec4899" strokeWidth={2} fillOpacity={0.05} fill="#ec4899" name="Indexed Backlinks" />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SIDE-PANEL: VELOCITY BENCHMARKS */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0a0f0d] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                <Info className="h-3.5 w-3.5" />
                <span className="font-bold tracking-tight">Trust Flow Vectors</span>
              </div>
              <h3 className="text-sm font-bold tracking-tight">Citations & Authority Velocity</h3>
              <p className="text-[11px] text-slate-450 mt-1 mb-4">Majestic-aligned authority parameters for {siteDomain}.</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Trust Flow (TF)</span>
                    <span className="font-bold">{latestSnapshot?.trust_flow || 28} / 100</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${latestSnapshot?.trust_flow || 28}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Citation Flow (CF)</span>
                    <span className="font-bold">{latestSnapshot?.citation_flow || 33} / 100</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-400 h-full rounded-full" style={{ width: `${latestSnapshot?.citation_flow || 33}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide">Historical Timeline Growth</span>
                  <div className="text-[11px] text-slate-350 leading-relaxed">
                    Detected organic authority growth velocity is currently resting at <strong className="text-white">+{latestSnapshot?.velocity || 1.4} points/mo</strong>. 
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-[10px] text-slate-450 block mb-2 font-black">ACTIVE PLAN RETENTION LIMIT</span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white">{activePlan === "free" ? "Up to 10 snapshots saved" : "Unlimited history storage"}</span>
                {activePlan === "free" && (
                  <span className="text-[10px] text-amber-405 font-bold underline cursor-pointer">Upgrade Level</span>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MATRIX AND AI RECOMMENDATIONS LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* AI INSIGHTS BLOCK */}
        {aiInsights && (
          <div className="p-5 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-950/10 via-slate-950/40 to-slate-950/10 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold tracking-tight text-emerald-300">AI Authority & Backlink Diagnosis</h3>
                <p className="text-[10px] text-slate-450">Real-time analysis based on indexed crawl history.</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Overview Synthesis</span>
                <p className="text-slate-300 leading-relaxed">{aiInsights.overview}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-450 font-bold uppercase">Citation Health Details</span>
                <p className="text-slate-400 leading-relaxed">{aiInsights.scoreExplanation}</p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Recommended Actions to Boost Authority</span>
                <div className="space-y-1.5">
                  {aiInsights.correctiveActions?.map((act: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-slate-300">
                      <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPARATIVE BENCHMARKS CARDS */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-[#0a0f0d] space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold tracking-tight">Competitor Authority Comparison</h3>
              <p className="text-[11px] text-slate-450">Track rating differences against top niche targets.</p>
            </div>
            <span className="text-[10.5px] px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-semibold text-slate-400">
              Gap Tracker
            </span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {competitors.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-900/30 text-slate-500 text-xs text-mono">
                No competitor domains added yet. Enter domain coordinates below to register gap tracks.
              </div>
            ) : (
              competitors.map(comp => {
                const gapSign = comp.authority_gap >= 0 ? "+" : "";
                const absoluteGap = Math.abs(comp.authority_gap);
                const projectIsBehind = comp.authority_gap > 0;

                return (
                  <div key={comp.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-850 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{comp.competitor_name}</span>
                        <span className="text-slate-450 text-[10px]">({comp.domain})</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10.5px] text-slate-450">
                        <span>DR: <strong className="text-white">{comp.current_dr}</strong></span>
                        <span>DA: <strong className="text-white">{comp.current_da}</strong></span>
                        <span>Backlinks: <strong className="text-white">{comp.backlinks}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[9px] text-slate-450 block uppercase font-bold">Authority Gap</span>
                        <span className={`text-xs font-black font-mono ${projectIsBehind ? "text-rose-400" : "text-emerald-450"}`}>
                          {projectIsBehind ? `Behind by ${absoluteGap}` : `Leading by ${absoluteGap}`} pts
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteCompetitor(comp.id)}
                        className="p-1 text-slate-500 hover:text-rose-450 rounded hover:bg-slate-800/50 cursor-pointer transition-all"
                        title="Remove Target"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* REGISTER COMPETITOR WORKSPACE FORM */}
          <form onSubmit={handleAddCompetitor} className="pt-3 border-t border-slate-900 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Competitor Name (e.g. MozHQ)"
              value={newCompName}
              onChange={(e) => setNewCompName(e.target.value)}
              className="flex-1 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Competitor Domain (e.g. competitor.com)"
              value={newCompDomain}
              onChange={(e) => setNewCompDomain(e.target.value)}
              className="flex-1 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black rounded-lg text-[11.5px] font-bold cursor-pointer shrink-0"
            >
              Add Domain Tracker
            </button>
          </form>
          {activePlan === "free" && (
            <p className="text-[10px] text-amber-500 font-mono">
              ★ Free Sandbox permits 1 tracked competitor slot. Upgrade for up to 5 parallel gap matrices.
            </p>
          )}

        </div>

      </div>

      {/* EXECUTIVE REPORTS MODULE GENERATOR */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-[#0a0f0d] space-y-4">
        <div className="flex justify-between items-center sm:items-start flex-col sm:flex-row gap-3">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Executive Authority Diagnostics Reports</h3>
            <p className="text-[11px] text-slate-450">Assemble custom PDF/Executive diagnostics comparing start and end rating matrices.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleGenerateReport("weekly")}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-[10.5px] text-slate-350 cursor-pointer font-bold flex items-center gap-1.5"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-blue-400" />
              Compile Weekly Digest
            </button>
            <button
              onClick={() => handleGenerateReport("monthly")}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-emerald-500/10 rounded-lg text-[10.5px] text-emerald-400 cursor-pointer font-bold flex items-center gap-1.5"
            >
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              Compile Monthly Digest
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto pr-1">
          {reports.length === 0 ? (
            <div className="md:col-span-3 p-6 text-center text-slate-500 font-mono text-xs">
              No executive digests synthesized yet. Select "Compile Digest" to generate authority snapshots summaries.
            </div>
          ) : (
            reports.map(report => (
              <div key={report.id} className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-[#4ade80]">
                    {report.report_type} Diagnostic
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <h4 className="font-bold text-xs text-white tracking-tight">{report.duration_label}</h4>
                
                <div className="grid grid-cols-2 gap-2 text-[10.5px] bg-slate-900 p-2 rounded-lg text-slate-450 border border-slate-850">
                  <div>
                    <span>DA Shift: </span>
                    <strong className="text-white">{report.start_da} ➜ {report.end_da}</strong>
                  </div>
                  <div>
                    <span>DR Shift: </span>
                    <strong className="text-white">{report.start_dr} ➜ {report.end_dr}</strong>
                  </div>
                  <div className="col-span-2 text-emerald-400">
                    <span>Backlink Gain: </span>
                    <strong className="font-extrabold">+{report.backlink_gains} listings</strong>
                  </div>
                </div>

                <p className="text-[10.5px] text-slate-400 italic leading-relaxed">
                  "{report.summary}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
