import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Activity,
  Award,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Globe,
  PlusCircle,
  X,
  Mail,
  Lock,
  ArrowRight,
  Download,
  Share2,
  ChevronRight,
  Terminal,
  ArrowLeft,
  Sparkles,
  Link2,
  ExternalLink,
  BookOpen,
  LayoutGrid
} from "lucide-react";

interface CompetitorAnalysisToolProps {
  visitorEmail: string;
  visitorUrl: string;
  onLaunchApp: () => void;
  onSaveLead: (email: string, websiteUrl: string) => Promise<any>;
  rateLimit: {
    allowed: boolean;
    remaining: number;
    max: number;
    tier: "anonymous" | "registered" | "paid";
  };
  refreshLimits: () => void;
}

export default function CompetitorAnalysisTool({
  visitorEmail,
  visitorUrl,
  onLaunchApp,
  onSaveLead,
  rateLimit,
  refreshLimits,
}: CompetitorAnalysisToolProps) {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [websiteUrl, setWebsiteUrl] = useState(visitorUrl || "");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitorsList, setCompetitorsList] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState(visitorEmail || "");
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [results, setResults] = useState<any | null>(null);
  
  // Tabs for report viewer
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "seo" | "content" | "keywords" | "topical" | "authority" | "insights">("overview");
  
  // UX triggers
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [localEmail, setLocalEmail] = useState(visitorEmail || "");
  const [isCapturingLeadProgress, setIsCapturingLeadProgress] = useState(false);
  
  // Recent scans history
  const [history, setHistory] = useState<any[]>([]);
  
  // ==========================================
  // VIEW HOOKS
  // ==========================================
  useEffect(() => {
    // Prefix from URL parameter if loaded from shareable link
    const params = new URLSearchParams(window.location.search);
    const sharedReportId = params.get("reportId");
    if (sharedReportId) {
      loadSharedReport(sharedReportId);
    } else {
      fetchHistory();
    }
  }, []);

  useEffect(() => {
    if (visitorEmail) {
      setLocalEmail(visitorEmail);
      setEmailInput(visitorEmail);
    }
  }, [visitorEmail]);

  useEffect(() => {
    if (visitorUrl && !websiteUrl) {
      setWebsiteUrl(visitorUrl);
    }
  }, [visitorUrl]);

  // ==========================================
  // API CONNECTORS
  // ==========================================
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/competitor-analysis/history");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHistory(data.history);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch historical scans:", e);
    }
  };

  const loadSharedReport = async (id: string) => {
    setIsLoading(true);
    setApiError("");
    try {
      const res = await fetch(`/api/competitor-analysis/report/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.report) {
          setResults(data.report);
          setWebsiteUrl(data.report.website_url);
          setCompetitorsList(data.report.all_competitors || [data.report.competitor_url]);
          setActiveSubTab("overview");
        }
      } else {
        setApiError("Shared report could not be located. It might have been cleared or expired.");
      }
    } catch (e) {
      setApiError("Connection failure while querying shareable report database.");
    } finally {
      setIsLoading(false);
    }
  };

  const addCompetitor = () => {
    const clean = competitorInput.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
    if (!clean) return;
    if (competitorsList.includes(clean)) {
      setCompetitorInput("");
      return;
    }
    if (competitorsList.length >= 3) {
      setApiError("Free account is limited to comparing at most 3 competitors simultaneously.");
      return;
    }
    setCompetitorsList([...competitorsList, clean]);
    setCompetitorInput("");
    setApiError("");
  };

  const removeCompetitor = (domain: string) => {
    setCompetitorsList(competitorsList.filter((c) => c !== domain));
  };

  // Prefill Example Tesla vs Porsche study
  const handleLoadExample = () => {
    setWebsiteUrl("tesla.com");
    setCompetitorsList(["porsche.com", "lucidmotors.com"]);
    setCompetitorInput("");
    setApiError("");
  };

  // Generate Competitor analysis report trigger
  const runAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setApiError("");
    
    const cleanWebUrl = websiteUrl.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
    if (!cleanWebUrl) {
      setApiError("Please specify your target website domain name.");
      return;
    }

    if (competitorsList.length === 0 && !competitorInput.trim()) {
      setApiError("Please specify at least one competitor URL to compare.");
      return;
    }

    let finalCompetitors = [...competitorsList];
    if (competitorInput.trim()) {
      const cleanComp = competitorInput.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
      if (!finalCompetitors.includes(cleanComp)) {
        finalCompetitors.push(cleanComp);
        setCompetitorsList(finalCompetitors);
        setCompetitorInput("");
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/competitor-analysis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl: cleanWebUrl,
          competitorUrls: finalCompetitors,
          userId: localStorage.getItem("ranksyncer_free_tools_user_id") || "anonymous",
          email: localEmail || undefined,
          activePlan: "free",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResults(data.report);
        setActiveSubTab("overview");
        refreshLimits();
        fetchHistory();
      } else {
        setApiError(data.error || "An unexpected error occurred during structural crawl simulation.");
      }
    } catch (err: any) {
      setApiError("The crawler server timed out. Check your spelling and network configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  // Capture Lead Inline to unlock premium modules
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      alert("Please provide a valid business email address.");
      return;
    }

    setIsCapturingLeadProgress(true);
    try {
      const res = await onSaveLead(cleanEmail, websiteUrl);
      if (res) {
        setLocalEmail(cleanEmail);
        localStorage.setItem("ranksyncer_free_tools_email", cleanEmail);
        refreshLimits();
      }
    } catch (err) {
      console.error("Lead conversion engine failure:", err);
    } finally {
      setIsCapturingLeadProgress(false);
    }
  };

  // Clipboard copy clipboard helper
  const handleCopyClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Generate shareable report link
  const handleCopyShareableLink = () => {
    if (!results) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?tab=free-tools&tool=seo-competitor-analysis&reportId=${results.analysis_id}`;
    navigator.clipboard.writeText(shareUrl);
    setShowShareSuccess(true);
    setTimeout(() => setShowShareSuccess(false), 3000);
  };

  const invokeBrowserPrint = () => {
    window.print();
  };

  // Helper check if tab is locked for lead capture
  const isTabLocked = (tabName: string) => {
    if (localEmail && localEmail.includes("@")) return false;
    // Let Overview and SEO Gaps be 100% free to show huge immediate value!
    if (tabName === "overview" || tabName === "seo") return false;
    return true;
  };

  return (
    <div id="competitor-tool-workspace" className="flex flex-col gap-6">
      {/* Printable Area Header (Hidden in standard screen) */}
      <div className="hidden print:block pb-6 mb-6 border-b border-gray-300 text-black">
        <h1 className="text-2xl font-black">RANKSYNCER COMPETITIVE AUDIT REPORT</h1>
        <p className="text-sm text-gray-600">Generated on: {results ? new Date(results.generated_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
        <p className="text-sm">Main Site: <strong>{results?.website_url}</strong> vs Competitor: <strong>{results?.competitor_url}</strong></p>
      </div>

      {/* Header Info Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-emerald-950 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              FREE LEAD-GEN MODULE
            </span>
            <span className="text-slate-500 font-mono text-[10px]">CRAWLER ENGINE v3.4</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Public SEO Competitor Analysis Tool</h2>
          <p className="text-slate-400 text-xs max-w-xl">
            Audit indexing strategies, calculate topical keyword gaps, discover authority referring domains and hijack competitors' search rankings instantly.
          </p>
        </div>
        
        {results && (
          <button
            onClick={() => {
              setResults(null); 
              setActiveSubTab("overview");
            }}
            className="text-xs bg-slate-900 border border-emerald-900/35 hover:bg-slate-800 text-emerald-400 hover:text-white px-3.5 py-1.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Start New Scan
          </button>
        )}
      </div>

      {/* Primary Workspace */}
      {!results ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Inputs Section */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-[#030d0a] border border-emerald-950 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-36 w-36 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3 mb-5">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#d0d6d4] flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-450" /> Configure Scope Parameters
                </span>
                <button
                  type="button"
                  onClick={handleLoadExample}
                  className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" /> Load Example (Tesla vs Porsche)
                </button>
              </div>

              <form onSubmit={runAnalysis} className="flex flex-col gap-5">
                
                {/* User Domain */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-350">Your Website URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., yourcompany.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full bg-[#020705] border border-emerald-950 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none placeholder:text-slate-700 transition font-mono"
                    />
                  </div>
                </div>

                {/* Competitors Add Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-350">
                    Competitor Website URLs <span className="text-[10px] text-slate-500 font-normal">(Add up to 3)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <input
                        type="text"
                        placeholder="e.g., competitor.com"
                        value={competitorInput}
                        onChange={(e) => setCompetitorInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCompetitor();
                          }
                        }}
                        className="w-full bg-[#020705] border border-emerald-950 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none placeholder:text-slate-700 transition font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addCompetitor}
                      className="bg-slate-900 border border-emerald-950 text-emerald-400 hover:text-white px-4 rounded-xl text-xs font-bold shrink-0 transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* Competitors List Map tags */}
                  {competitorsList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {competitorsList.map((domain) => (
                        <span
                          key={domain}
                          className="text-[10px] bg-[#0c1c16] border border-emerald-950 text-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono"
                        >
                          {domain}
                          <button
                            type="button"
                            onClick={() => removeCompetitor(domain)}
                            className="hover:text-rose-400 text-slate-500 select-none outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optional Email capture inline */}
                {!localEmail && (
                  <div className="bg-[#051410] border border-emerald-950/60 rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-2.5">
                      <Mail className="h-4.5 w-4.5 text-emerald-450 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">Secure Complete Report Gaps Access (Recommended)</span>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          By specifying your address now, we bypass standard limitations to capture organic traffic volumes and deep backlink profiles instantly.
                        </p>
                      </div>
                    </div>
                    <input
                      type="email"
                      placeholder="e.g., mail@business.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#030907] border border-emerald-950 rounded-lg px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                )}

                {apiError && (
                  <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3.5 flex items-start gap-2 animate-pulse">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span>{apiError}</span>
                  </div>
                )}

                {/* Trigger Buttons */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 text-[#01241c] py-3.5 rounded-xl transition disabled:opacity-50 shadow-lg shadow-emerald-500/10 cursor-pointer text-center"
                >
                  {isLoading ? (
                    <>
                      <RotateCcw className="h-4 w-4 animate-spin text-[#01241c]" /> Deconstructing Target Keyword Silos...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-[#01241c]" /> Analyze SEO Competitors Gaps
                    </>
                  )}
                </button>
              </form>
            </div>
            
            {/* Quick value markers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#040e0c]/40 border border-emerald-950 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-black text-emerald-400 block mb-1">1. Keyword Hijack</span>
                <p className="text-[11px] text-slate-400 leading-normal">Identify exact easy rank keywords with KD &lt; 20% that competitors are dominating.</p>
              </div>
              <div className="bg-[#040e0c]/40 border border-emerald-950 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-black text-emerald-500 block mb-1">2. Authority Audit</span>
                <p className="text-[11px] text-slate-400 leading-normal">Compare actual backlink nodes, referring domains, and isolate immediate partner options.</p>
              </div>
              <div className="bg-[#040e0c]/40 border border-emerald-950 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-black text-emerald-400 block mb-1">3. Content Briefs</span>
                <p className="text-[11px] text-slate-400 leading-normal">Brainstorm high-traffic titles matching competitors' missing semantic coverage topics.</p>
              </div>
            </div>
          </div>

          {/* Quick Explanatory FAQ & History Side panel */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Run Limits Profile Card */}
            <div className="bg-[#030907] border border-emerald-950 rounded-2xl p-5 text-center">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block mb-1">YOUR RATE QUOTA STATUS</span>
              <p className="text-sm font-bold text-slate-200 mb-2">
                Scan Quota: <strong className="text-emerald-400">{rateLimit.remaining}</strong> left today
              </p>
              <div className="h-1 bg-slate-900 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(rateLimit.remaining / rateLimit.max) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Anonymous users receive 3 free daily crawls. Upgrade to Premium to run programmatic audits with unmetered access.
              </p>
            </div>

            {/* Historical Scan Logs */}
            <div className="bg-[#030907]/60 border border-emerald-950 rounded-2xl p-5">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#d0d6d4] block mb-3 pb-1 border-b border-emerald-950/60">
                🕒 Recent Competitive Scans
              </span>
              {history.length === 0 ? (
                <div className="text-[#3b4c47] text-xs py-4 text-center font-mono select-none">
                  NO RECENT LOGS DETECTED
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto">
                  {history.map((h, i) => (
                    <div
                      key={h.analysis_id || i}
                      onClick={() => loadSharedReport(h.analysis_id)}
                      className="bg-[#020604] border border-emerald-950 hover:border-emerald-700/60 transition p-2.5 rounded-lg cursor-pointer flex items-center justify-between gap-2 font-mono text-[10px]"
                    >
                      <div className="flex flex-col truncate">
                        <span className="text-[#96a4a0] font-bold truncate">{h.website_url}</span>
                        <span className="text-[#435e54]">vs {h.competitor_url}</span>
                      </div>
                      <div className="flex items-center gap-1 text-right shrink-0">
                        <span className="text-slate-500">{new Date(h.generated_at).toLocaleDateString()}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Practical FAQ segment */}
            <div className="bg-[#030907]/30 border border-emerald-950 rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest block font-mono">FAQ</span>
              <div className="space-y-2.5">
                <div>
                  <h4 className="text-[11px] text-white font-extrabold">How does RankSyncer estimate the gaps?</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    We simulate programmatic DOM crawler checks and match keyword indices against historical SERP snapshot data.
                  </p>
                </div>
                <div>
                  <h4 className="text-[11px] text-white font-extrabold">Can I analyze multiple competitors?</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Yes, enter domain URLs and hit add. Up to 3 domains are supported in the free lead funnel.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        
        /* ------------------------------------------- */
        /* REPORT VIEWING PORTAL                       */
        /* ------------------------------------------- */
        <div id="results-analytics-portal" className="flex flex-col gap-6">

          {/* Share/Actions Floating Bar */}
          <div className="bg-[#04110d] border border-emerald-950 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl select-none print:hidden">
            <div className="flex items-center gap-2.5 truncate">
              <CheckCircle2 className="h-5 w-5 text-emerald-450 shrink-0" />
              <div className="truncate">
                <span className="text-xs font-bold text-white block">Audit Complete</span>
                <p className="text-[10px] text-slate-400 truncate">
                  Comparing <strong className="text-emerald-400 font-mono">{results.website_url}</strong> against <strong className="text-indigo-400 font-mono">{results.competitor_url}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyShareableLink}
                className="px-4 py-2 bg-[#020705] border border-emerald-950 border-none hover:bg-slate-900 text-slate-300 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer relative"
              >
                {showShareSuccess ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-450" /> Link Copied
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 text-emerald-450" /> Copy Shareable Report Link
                  </>
                )}
              </button>

              <button
                onClick={invokeBrowserPrint}
                className="px-4 py-2 bg-slate-900 border border-[#1b3d32] hover:bg-slate-800 text-[#edfcf8] font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4 text-emerald-400" /> Export PDF Report
              </button>
            </div>
          </div>

          {/* OVERVIEW BENTO METRICS PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Main Score Ring Panel */}
            <div className="md:col-span-2 bg-[#030907] border border-emerald-950 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-1/2 -left-16 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none"></div>
              
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">YOUR SEO PERFORMANCE</span>
              
              <div className="relative h-28 w-28 flex items-center justify-center mb-3">
                {/* SVG SVG Ring */}
                <svg className="w-full h-full -rotate-90">
                  <circle cx="56" cy="56" r="48" className="stroke-slate-900 fill-none" strokeWidth="10" />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    className="stroke-emerald-500 fill-none transition-all duration-1000"
                    strokeWidth="10"
                    strokeDasharray="301.6"
                    strokeDashoffset={301.6 - (301.6 * (results.seo_score || 70)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center select-none">
                  <span className="text-3xl font-black text-white">{results.seo_score}</span>
                  <span className="text-[9px] text-[#425d53] font-bold">OUT OF 100</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2 leading-relaxed">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span>
                <span>Lacks core Schema, has LCP latency.</span>
              </div>
            </div>

            {/* Quick Gaps stats Grid */}
            <div className="md:col-span-3 grid grid-cols-2 gap-4">
              
              <div className="bg-[#030907] border border-emerald-950 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">COMPETITOR AVG HEALTH</span>
                <div>
                  <h4 className="text-3xl font-extrabold text-blue-400 tracking-tight leading-none mb-1">{results.competitor_score}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Avg organic health rating across targets: <span className="text-indigo-400 font-mono">{results.competitor_url}</span>
                  </p>
                </div>
              </div>

              <div className="bg-[#030907] border border-emerald-950 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider font-mono text-[#ecd084]">OPPORTUNITY SCORE</span>
                <div>
                  <h4 className="text-3xl font-extrabold text-amber-350 tracking-tight leading-none mb-1">{results.opportunity_score}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal font-sans">
                    Keyword, link, and structure options to hijack. Easiest path to growth.
                  </p>
                </div>
              </div>

              <div className="bg-[#030907] border border-emerald-950 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">CONTENT GAP VALUE</span>
                <div>
                  <h4 className="text-3xl font-extrabold text-[#c0e6ce] tracking-tight leading-none mb-1">{results.content_gap_score}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Coverage index on missing semantic topic clusters.
                  </p>
                </div>
              </div>

              <div className="bg-[#030907] border border-emerald-950 rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-[9px] font-black text-slate-500 uppercase block tracking-wider">AUTHORITY LINK GAP</span>
                <div>
                  <h4 className="text-3xl font-extrabold text-teal-400 tracking-tight leading-none mb-1">{results.authority_gap_score}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Difference metric matching total quality inbound referral links.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 flex-wrap border-b border-emerald-950 pb-0.5 print:hidden select-none">
            <button
              onClick={() => setActiveSubTab("overview")}
              className={`px-3.5 py-2 text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "overview"
                  ? "border-b-2 border-emerald-500 text-emerald-400 font-black"
                  : "text-slate-450 hover:text-white"
              }`}
            >
              <LayoutGrid className="h-4 w-4" /> Summary
            </button>
            <button
              onClick={() => setActiveSubTab("seo")}
              className={`px-3.5 py-2 text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "seo"
                  ? "border-b-2 border-emerald-500 text-emerald-400 font-black"
                  : "text-slate-450 hover:text-white"
              }`}
            >
              🛠️ SEO Gaps
            </button>
            <button
              onClick={() => setActiveSubTab("content")}
              className={`px-3.5 py-2 text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "content"
                  ? "border-b-2 border-emerald-500 text-emerald-400 font-black"
                  : "text-slate-450 hover:text-white"
              }`}
            >
              📝 Content Gaps
            </button>
            <button
              onClick={() => setActiveSubTab("keywords")}
              className={`px-3.5 py-2 text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "keywords"
                  ? "border-b-2 border-emerald-500 text-emerald-400 font-black"
                  : "text-slate-450 hover:text-white"
              }`}
            >
              🔑 Keyword Gaps {isTabLocked("keywords") && <Lock className="h-3 w-3 text-amber-500" />}
            </button>
            <button
              onClick={() => setActiveSubTab("topical")}
              className={`px-3.5 py-2 text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "topical"
                  ? "border-b-2 border-emerald-500 text-emerald-400 font-black"
                  : "text-slate-450 hover:text-white"
              }`}
            >
              📈 Topical Authority {isTabLocked("topical") && <Lock className="h-3 w-3 text-amber-500" />}
            </button>
            <button
              onClick={() => setActiveSubTab("authority")}
              className={`px-3.5 py-2 text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "authority"
                  ? "border-b-2 border-emerald-500 text-emerald-400 font-black"
                  : "text-slate-450 hover:text-white"
              }`}
            >
              🔗 Backlinks Audits {isTabLocked("authority") && <Lock className="h-3 w-3 text-amber-500" />}
            </button>
            <button
              onClick={() => setActiveSubTab("insights")}
              className={`px-3.5 py-2 text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "insights"
                  ? "border-b-2 border-emerald-500 text-emerald-400 font-black"
                  : "text-slate-450 hover:text-white"
              }`}
            >
              ✨ AI Action Plan {isTabLocked("insights") && <Lock className="h-3 w-3 text-amber-500" />}
            </button>
          </div>

          {/* TAB DETAILED PANELS */}
          <div className="bg-[#030907] border border-emerald-950 rounded-2xl p-6 shadow-2xl min-h-[300px] relative">
            
            {/* GLOBAL LOCK WATERCOOLER OVERLAY CARD */}
            {isTabLocked(activeSubTab) && (
              <div className="absolute inset-0 bg-[#020604]/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-8 text-center z-20 animate-[fade-in_0.3s_ease]">
                <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-4 text-amber-400 animate-bounce">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2">Secure Business Competitor Intelligence</h3>
                <p className="text-slate-400 text-xs max-w-md leading-relaxed mb-6">
                  Unlock high-precision semantic search volume indices, referral site listings, and customized AI article recommendations for <span className="text-emerald-400 font-bold">{results.website_url}</span> and <span className="text-indigo-400 font-bold">{results.competitor_url}</span>. 
                </p>

                <form onSubmit={handleLeadSubmit} className="w-full max-w-sm flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-450 uppercase font-mono">BUSINESS EMAIL ADDRESS</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g., brand-manager@company.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#030d0a] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCapturingLeadProgress}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-[#01221a] font-extrabold text-xs rounded-xl shadow-lg hover:from-emerald-450 cursor-pointer transition disabled:opacity-50"
                  >
                    {isCapturingLeadProgress ? "Validating Enterprise Domain..." : "Unlock Full Audit Report (100% Free)"}
                  </button>
                  <span className="text-[9px] text-slate-500">Includes 15 daily bonus AI generations on RankSyncer catalog.</span>
                </form>
              </div>
            )}

            {/* Print Layout: Always print all sub-tabs instead of just active (handled by styling in sections) */}

            {/* TAB 1: OVERVIEW SUMMARY */}
            {(activeSubTab === "overview" || window.matchMedia("(max-width: 1000px)").matches) && (
              <div className="flex flex-col gap-6 animate-[fade-in_0.3s_ease]">
                <div className="flex flex-col gap-2">
                  <h3 className="font-extrabold text-white text-sm">Strategic Organic Overview</h3>
                  <p className="text-slate-450 text-xs leading-relaxed">{results.ai_insights?.plain_language_summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#020604] border border-emerald-950 p-4 rounded-xl">
                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider mb-2.5">🚨 Critical Weaknesses Outpaced</h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-350 text-xs">
                      {results.weaknesses?.slice(0, 3).map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#020604] border border-emerald-950 p-4 rounded-xl">
                    <h4 className="text-xs font-black text-indigo-400 tracking-wider mb-2.5">⚡ Core Opportunities & Hijacks</h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-350 text-xs">
                      {results.quick_wins?.slice(0, 3).map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-[#04140f] p-4 rounded-xl border border-emerald-950 flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Scale programmatically in our Workspace</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Immediately generate articles for your missing gaps with our unmetered Premium CMS modules.</p>
                  </div>
                  <button
                    onClick={onLaunchApp}
                    className="text-xs font-extrabold text-[#022a20] bg-emerald-450 hover:bg-emerald-400 px-4 py-2 rounded-xl shrink-0 transition"
                  >
                    Open Workspace
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: SEO GAPS */}
            {activeSubTab === "seo" && (
              <div className="flex flex-col gap-4 animate-[fade-in_0.3s_ease]">
                <h3 className="font-extrabold text-white text-sm block mb-1">Index Core & Technical Gaps</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-400 border-collapse">
                    <thead>
                      <tr className="border-b border-emerald-950 text-slate-500 font-mono text-[10px] tracking-wider uppercase">
                        <th className="py-2">Item</th>
                        <th className="py-2">Status ({results.website_url})</th>
                        <th className="py-2">Competitor ({results.competitor_url})</th>
                        <th className="py-2 text-right">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950/40">
                      {results.seo_gaps.map((gap: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-900/10">
                          <td className="py-3 font-semibold text-white">
                            {gap.item}
                            <span className="block text-[10px] text-slate-500 font-normal font-sans mt-0.5">{gap.description}</span>
                          </td>
                          <td className="py-3 text-rose-300 font-mono">{gap.your_status}</td>
                          <td className="py-3 text-emerald-400 font-mono">{gap.competitor_status}</td>
                          <td className="py-3 text-right">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              gap.impact === "high" ? "bg-rose-500/10 border border-rose-500/20 text-rose-450" : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {gap.impact}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: CONTENT GAPS */}
            {activeSubTab === "content" && (
              <div className="flex flex-col gap-6 animate-[fade-in_0.3s_ease]">
                <div>
                  <h3 className="font-extrabold text-white text-sm">Topical Content Gap Index</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-mono block mt-0.5">High authority clusters covered by competition but missing from your registry</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {results.content_gaps.map((item: any, i: number) => (
                    <div key={i} className="bg-[#020604] border border-emerald-950 p-4 rounded-xl flex flex-col gap-2 relative">
                      <span className={`absolute top-4 right-4 text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        item.importance === "High" ? "bg-rose-500/10 text-rose-450" : "bg-slate-900 text-slate-400"
                      }`}>
                        {item.importance} Priority
                      </span>

                      <span className="text-slate-500 text-[10px] font-mono">MISSING SILO TOPIC</span>
                      <h4 className="text-xs font-bold text-white pr-20">{item.missing_topic}</h4>
                      <p className="text-[11px] text-slate-400 leading-normal">{item.content_depth_difference}</p>
                      
                      <div className="border-t border-emerald-950/60 pt-2.5 mt-1.5">
                        <span className="text-[9px] text-[#425d53] block font-bold mb-1 uppercase">Recommended Supporting Blogs to Hijack</span>
                        {item.supporting_ideas?.map((idea: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300 py-1 font-sans">
                            <PlusCircle className="h-3.5 w-3.5 text-emerald-450 shrink-0" />
                            <span>{idea}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: KEYWORD GAPS */}
            {activeSubTab === "keywords" && (
              <div className="flex flex-col gap-4 animate-[fade-in_0.3s_ease]">
                <h3 className="font-extrabold text-white text-xs">Isolate Easy Target Keyword Infiltrates</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-400 border-collapse">
                    <thead>
                      <tr className="border-b border-emerald-950 text-slate-500 font-mono text-[9px] tracking-wider uppercase">
                        <th className="py-2">Search Keyword Target</th>
                        <th className="py-2">Volume</th>
                        <th className="py-2">Competitor Rank</th>
                        <th className="py-2">Your Rank</th>
                        <th className="py-2">Difficulty (KD)</th>
                        <th className="py-2 text-right">Expansion Action Option</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950/40">
                      {results.keyword_gaps.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-900/10 font-mono">
                          <td className="py-3 font-semibold text-white font-sans">{row.keyword}</td>
                          <td className="py-3 text-slate-300">{row.search_volume}</td>
                          <td className="py-3 text-blue-400 font-bold">#{row.competitor_rank}</td>
                          <td className="py-3 text-rose-300 font-bold">{row.your_rank}</td>
                          <td className="py-3 text-emerald-400 font-bold">{row.keyword_difficulty}</td>
                          <td className="py-3 text-right font-sans text-[11px] text-[#93a6a0] max-w-xs truncate">{row.expansion_idea}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: TOPICAL AUTHORITY */}
            {activeSubTab === "topical" && (
              <div className="flex flex-col gap-5 animate-[fade-in_0.3s_ease]">
                <h3 className="font-extrabold text-white text-xs">Topical authority depth matches comparisons</h3>
                <p className="text-slate-400 text-xs leading-normal">
                  Google rewards semantic completeness. If your profile coverage is low compared to competitive sites, they are favored.
                </p>

                <div className="flex flex-col gap-4.5 mt-3">
                  {results.topical_authority.map((item: any, i: number) => (
                    <div key={i} className="bg-[#020604] border border-emerald-950 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{item.cluster}</span>
                        <span className="text-[10px] text-amber-300 font-mono font-bold uppercase">{item.gap_status}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-xs">
                        {/* You Profile bar */}
                        <div>
                          <div className="flex justify-between text-[11px] text-[#425d53] mb-1">
                            <span>{results.website_url} (You)</span>
                            <span>{item.your_coverage_score}% Coverage</span>
                          </div>
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-400" style={{ width: `${item.your_coverage_score}%` }}></div>
                          </div>
                        </div>

                        {/* Competitor Profile bar */}
                        <div>
                          <div className="flex justify-between text-[11px] text-[#425d53] mb-1">
                            <span>{results.competitor_url}</span>
                            <span>{item.competitor_coverage_score}% Coverage</span>
                          </div>
                          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400" style={{ width: `${item.competitor_coverage_score}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: BACKLINKS */}
            {activeSubTab === "authority" && (
              <div className="flex flex-col gap-6 animate-[fade-in_0.3s_ease]">
                <div className="flex flex-col gap-2">
                  <h3 className="font-extrabold text-white text-xs uppercase tracking-widest font-mono">Domain trust compare & links benchmarks</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-400 border-collapse">
                      <thead>
                        <tr className="border-b border-emerald-950 text-slate-500 font-mono text-[9px] uppercase">
                          <th className="py-2">Domain Target URL</th>
                          <th className="py-2">Authority Score (0-100)</th>
                          <th className="py-2">Estimated Backlinks</th>
                          <th className="py-2">Referring Domains</th>
                          <th className="py-2 text-right">Growth Index</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/40">
                        {results.domain_authority_comparison?.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-900/10 font-mono font-bold">
                            <td className="py-3 text-white font-sans">{row.domain}</td>
                            <td className="py-3 text-amber-300">{row.domain_authority}</td>
                            <td className="py-3 text-slate-300">{row.backlinks_total?.toLocaleString()}</td>
                            <td className="py-3 text-slate-300">{row.referring_domains?.toLocaleString()}</td>
                            <td className="py-3 text-right text-emerald-400">{row.growth_potential}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <span className="text-[10px] font-black text-[#5a766c] uppercase font-mono">🚨 Highest Value Isolate Link Pitch Targets</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                    {results.backlink_opportunities?.map((opp: any, i: number) => (
                      <div key={i} className="bg-[#020604] border border-emerald-950 p-3 rounded-lg flex flex-col gap-1.5 group relative hover:border-emerald-700/60 transition">
                        <span className="font-mono text-white text-xs block font-bold truncate">{opp.source_domain}</span>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Domain Rank: <strong>{opp.authority_score}</strong></span>
                          <span>Traffic: {opp.estimated_traffic}</span>
                        </div>
                        <span className="text-[10px] text-indigo-400 font-semibold">{opp.opportunity_type}</span>
                        <span className="text-[9px] bg-slate-950 self-start px-2 py-0.5 border border-emerald-950/60 rounded text-slate-400 mt-1">Difficulty: {opp.action_difficulty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: AI ACTION INSIGHTS */}
            {activeSubTab === "insights" && (
              <div className="flex flex-col gap-5 animate-[fade-in_0.3s_ease]">
                <div className="border-b border-emerald-950 pb-2 flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-xs">Strategic SEO Expansion Blueprint</h3>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950 px-2 py-0.5 rounded">CUSTOM EXPERT SUITE</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 font-mono tracking-wider block mb-1">Immediate Prioritized Opportunities</span>
                    <ul className="list-inside list-disc space-y-2 text-slate-300 text-xs">
                      {results.ai_insights?.prioritized_opportunities?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 font-mono tracking-wider block mb-1">Easiest High-Traffic Winning Terms</span>
                    <ul className="list-inside list-disc space-y-2 text-slate-300 text-xs">
                      {results.ai_insights?.easy_ranking_wins?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 font-mono tracking-wider block mb-1">AI Proposed Content Expansions Checklist</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans mt-2">
                      {results.content_expansions?.map((opp: any, i: number) => (
                        <div key={i} className="bg-[#020604] border border-emerald-950 p-3 rounded-lg flex flex-col gap-1">
                          <span className="text-[10px] text-emerald-450 uppercase font-bold tracking-tight block">{opp.niche_cluster}</span>
                          <span className="text-white text-xs font-extrabold leading-tight block">{opp.suggested_title}</span>
                          <span className="text-[10px] text-slate-400 mt-1">Target Keyword: <strong className="text-indigo-400 font-mono">{opp.target_keyword}</strong></span>
                          <div className="flex justify-between items-center text-[10px] text-[#425d53] border-t border-emerald-950/60 pt-1.5 mt-2.5">
                            <span>Priority: <strong>{opp.priority}</strong></span>
                            <span>Clicks Est: <strong className="text-white">{opp.estimated_monthly_clicks}</strong>/mo</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* PRINT MEDIA ONLY FOOTER DATA */}
          <div className="hidden print:block text-slate-500 text-[10px] mt-12 pt-6 border-t border-gray-300 font-mono">
            Analyzed by RankSyncer Premium SEO Competitor Insights Suite. Build unmetered custom dashboards inside ranksyncer.com
          </div>

        </div>
      )}
    </div>
  );
}
