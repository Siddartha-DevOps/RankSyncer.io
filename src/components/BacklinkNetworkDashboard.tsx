import React, { useState, useEffect } from "react";
import {
  Link2,
  Globe2,
  TrendingUp,
  Plus,
  Search,
  AlertCircle,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Sliders,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Send,
  Check,
  X,
  Radio,
  Share2,
  ShieldAlert,
  Info,
  Layers,
  Zap,
  CheckSquare,
  Loader2
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface BacklinkNetworkDashboardProps {
  projectId: string;
  theme: "light" | "dark";
  activePlan: "free" | "premium";
  onLogAdded?: (log: any) => void;
}

export const BacklinkNetworkDashboard: React.FC<BacklinkNetworkDashboardProps> = ({
  projectId,
  theme,
  activePlan,
  onLogAdded
}) => {
  // DB & State Loading
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Registration Form States
  const [isRegistering, setIsRegistering] = useState(false);
  const [formDomain, setFormDomain] = useState("");
  const [formNiche, setFormNiche] = useState("SaaS & AI Tools");
  const [formLanguage, setFormLanguage] = useState("en");
  const [formCountry, setFormCountry] = useState("US");
  const [formCategories, setFormCategories] = useState("");

  // Sub Tab Navigation
  const [tab, setTab] = useState<"matches" | "incoming" | "sent" | "active" | "history">("matches");

  // Interaction States
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // AI Recommendation Drawer/Modal
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [aiAnchor, setAiAnchor] = useState("");
  const [aiTargetUrl, setAiTargetUrl] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Manual input fields inside Request Drawer
  const [customPlacement, setCustomPlacement] = useState("");

  const niches = [
    "SaaS & AI Tools",
    "Technology & Software",
    "E-Commerce",
    "Health & Fitness",
    "Finance & Investing",
    "Travel & Hospitality",
    "Marketing & Agency",
    "Education & Career"
  ];

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backlink/dashboard-data?projectId=${projectId}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        if (payload.registered && payload.mySite) {
          setFormDomain(payload.mySite.domain);
          setFormNiche(payload.mySite.niche);
        }
      }
    } catch (err) {
      console.error("Failed to load backlink dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadDashboard();
    }
  }, [projectId]);

  // Handle Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDomain) {
      setFeedback({ type: "error", text: "Please enter your domain URL" });
      return;
    }

    setIsRegistering(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/backlink/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          domain: formDomain,
          niche: formNiche,
          language: formLanguage,
          country: formCountry,
          categories: formCategories.split(",").map(c => c.trim()).filter(Boolean)
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to join exchange network");
      }

      setFeedback({ type: "success", text: resData.message || "Welcome to the high-authority backlink circle!" });
      
      if (onLogAdded) {
        onLogAdded({
          id: `backlink-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "success",
          message: `Enrolled site [${formDomain}] in Private Backlink Exchange Circle; matching active.`,
          module: "BACKLINK_CHECK"
        });
      }

      await loadDashboard();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Registration refused" });
    } finally {
      setIsRegistering(false);
    }
  };

  // Open Co-Pilot helper to generate context proposals
  const openCoPilot = async (match: any) => {
    setSelectedMatch(match);
    setAiLoading(true);
    try {
      const res = await fetch(
        `/api/backlink/ai-recommend?senderDomain=${data.mySite.domain}&receiverDomain=${match.domain}&niche=${match.niche}`
      );
      if (res.ok) {
        const payload = await res.json();
        if (payload.success && payload.recommendation) {
          setAiAnchor(payload.recommendation.anchor_text);
          setAiTargetUrl(payload.recommendation.placement_suggestion);
          setAiContext(payload.recommendation.context_snippet);
          setCustomPlacement(`https://${match.domain}/resources-hub`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Request high authority link exchange
  const handleSendRequest = async () => {
    if (!selectedMatch || !aiAnchor || !aiTargetUrl) {
      setFeedback({ type: "error", text: "Required link settings are missing" });
      return;
    }

    setAiLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/backlink/request-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderSiteId: data.mySite.id,
          receiverSiteId: selectedMatch.id,
          targetUrl: aiTargetUrl,
          anchorText: aiAnchor,
          placementSuggestion: customPlacement,
          contextSnippet: aiContext,
          activePlan
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Exchange request rejected.");
      }

      setFeedback({ type: "success", text: "Proposal dispatched to " + selectedMatch.domain + " successfully!" });
      setSelectedMatch(null);
      await loadDashboard();
      setTab("sent");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed dispatching link request" });
    } finally {
      setAiLoading(false);
    }
  };

  // Handle incoming request (Approve or Reject)
  const handleRequestAction = async (requestId: string, action: "approve" | "reject") => {
    setActionLoading(requestId);
    setFeedback(null);
    try {
      const res = await fetch("/api/backlink/handle-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Action couldn't complete");
      }
      setFeedback({
        type: "success",
        text: action === "approve" ? "Co-placement confirmed! Reciprocal backlink initialized." : "Request declined"
      });
      await loadDashboard();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Verification failed" });
    } finally {
      setActionLoading(null);
    }
  };

  // Run SEO verification crawl on active link
  const verifyLinkNode = async (exchangeId: string) => {
    setActionLoading(exchangeId);
    setFeedback(null);
    try {
      const res = await fetch("/api/backlink/verify-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchangeId })
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Crawler offline");
      }
      setFeedback({
        type: resData.verification.link_found ? "success" : "error",
        text: resData.verification.remarks
      });
      await loadDashboard();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Crawler failure" });
    } finally {
      setActionLoading(null);
    }
  };

  // Report low-quality / duplicate link-farms to anti-spam firewall
  const reportAbuseNode = async (siteId: string) => {
    setActionLoading(siteId);
    setFeedback(null);
    try {
      const res = await fetch("/api/backlink/report-abuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, reason: "Spam behavior detected" })
      });
      const resData = await res.json();
      if (res.ok) {
        setFeedback({
          type: "success",
          text: "Malicious site reported! Firewall updated and spam penalization activated."
        });
        await loadDashboard();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Retrieving Secure Network Nodes...</span>
      </div>
    );
  }

  const isDarkMode = theme === "dark";

  return (
    <div className={`space-y-6 font-sans ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4 border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="h-6 w-6 text-emerald-500 animate-pulse" />
            Authority Link Exchange Network
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Exchange contextual backlink assets with verified RankSyncer peer domains. Safe, auto-audited backlinks to boost organic traffic without search engine penalties.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadDashboard}
            className="p-1 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh Circle Nodes
          </button>
          
          {activePlan === "free" ? (
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] uppercase font-black px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500 animate-bounce" />
              Demo Limits
            </span>
          ) : (
            <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 text-[10px] uppercase font-black px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-indigo-500 animate-pulse" />
              Priority Placement Network
            </span>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 transition-opacity ${
          feedback.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
            : "bg-rose-50 text-rose-800 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-500" />}
          <div className="flex-1">{feedback.text}</div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* RENDER REGISTATION FLOW IF NOT JOINED */}
      {!data?.registered ? (
        <div className="bg-radial from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-slate-900 border border-emerald-150/50 dark:border-emerald-900/30 p-8 rounded-3xl text-center max-w-2xl mx-auto space-y-6 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold shadow-xs">
            <Link2 className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black text-slate-900 dark:text-white">Join RankSyncer's Contextual Backlink Circle</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
              Your project website is not yet indexed in our co-operative authority network. Joining takes seconds, calculates your SEO authority rating, and matches you with niche-related host sites ready to build active links.
            </p>
          </div>

          <form onSubmit={handleRegister} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-4 max-w-md mx-auto shadow-sm">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Your Target Domain Name</label>
              <input
                type="text"
                placeholder="e.g. startup-growth.com"
                value={formDomain}
                onChange={(e) => setFormDomain(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/50 focus:bg-white dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 w-full font-mono text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Topical Niche</label>
                <select
                  value={formNiche}
                  onChange={(e) => setFormNiche(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-xl block w-full focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                >
                  {niches.map((n, idx) => (
                    <option key={idx} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Target Region Country</label>
                <select
                  value={formCountry}
                  onChange={(e) => setFormCountry(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-xl block w-full focus:ring-emerald-550 text-slate-800 dark:text-slate-200"
                >
                  <option value="US">United States (US)</option>
                  <option value="UK">United Kingdom (UK)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="AU">Australia (AU)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="IN">India (IN)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Primary Language</label>
                <select
                  value={formLanguage}
                  onChange={(e) => setFormLanguage(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-xl block w-full focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                >
                  <option value="en">English (EN)</option>
                  <option value="es">Spanish (ES)</option>
                  <option value="de">German (DE)</option>
                  <option value="fr">French (FR)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Interlinked Tags</label>
                <input
                  type="text"
                  placeholder="e.g. b2b saas, marketing, blog"
                  value={formCategories}
                  onChange={(e) => setFormCategories(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-xl block w-full text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full mt-2 py-3 bg-slate-950 dark:bg-emerald-600 hover:bg-slate-900 dark:hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="animate-spin h-3.5 w-3.5 text-white" />
                  <span>Computing Semantic Graph...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-amber-300" />
                  <span>Calculate Domain Authority & Enroll</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            Currently {data?.allNetworkSitesCount || 7} sites active inside the global cooperative pool. Joining represents absolutely safe SEO interlinking.
          </p>
        </div>
      ) : (
        /* REGISTERED CONTENT FLOW */
        <div className="space-y-6">
          
          {/* Top KPI Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">My Domain Registered</span>
                <Globe2 className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-sm font-black text-slate-850 dark:text-white mt-1 block truncate font-mono">{data.mySite.domain}</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold block mt-0.5 uppercase tracking-wider">
                Niche: {data.mySite.niche}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Domain Authority Score</span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{data.mySite.authority_score}</span>
                <span className="text-[10px] font-bold text-slate-400">/ 100</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 gap-1">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${data.mySite.authority_score}%` }} 
                />
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Live Exchanges Active</span>
                <Link2 className="h-4 w-4 text-indigo-500" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white block mt-1 font-mono">{data.liveBacklinksCount}</span>
              <span className="text-[10px] text-emerald-500 font-black flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3 w-3" /> All audits verified
              </span>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Profile Safety Shield</span>
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                  {data.mySite.backlink_profile_health}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Spam Score: {data.mySite.spam_score}%</span>
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                Protected by RankSyncer Anti-Spam firewall limits.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Interactive Workspaces */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Inner Tab Controller */}
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 pb-0.5 gap-2.5 overflow-x-auto">
                {[
                  { id: "matches", label: "Recommended Matches", count: data.recommendedMatches?.length || 0 },
                  { id: "incoming", label: "Incoming Requests", count: data.incomingRequests?.length || 0 },
                  { id: "sent", label: "Sent Requests", count: data.sentRequests?.length || 0 },
                  { id: "active", label: "My Exchanges", count: data.approvedExchanges?.length || 0 }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTab(t.id as any);
                      setFeedback(null);
                    }}
                    className={`py-2 px-1 text-xs font-black transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      tab === t.id
                        ? "text-emerald-600 border-emerald-500 dark:text-emerald-400"
                        : "text-slate-450 border-transparent hover:text-slate-600 dark:hover:text-slate-350"
                    }`}
                  >
                    <span>{t.label}</span>
                    {t.count > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.1 font-bold rounded-full ${
                        tab === t.id 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* RECOMMENDED MATCHES TAB */}
              {tab === "matches" && (
                <div className="space-y-4">
                  {(!data.recommendedMatches || data.recommendedMatches.length === 0) ? (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl text-slate-400 font-medium text-xs">
                      No matching partners discovered. Check back later as more sites enroll!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.recommendedMatches.map((match: any) => (
                        <div 
                          key={match.id} 
                          className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 flex flex-col justify-between space-y-4 shadow-3xs"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <span className="text-xs font-black text-slate-850 dark:text-white truncate font-mono select-all">
                                {match.domain}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                match.relevance_score >= 80 
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                                  : "bg-indigo-50 text-indigo-800 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30"
                              }`}>
                                Relevance: {match.relevance_score}%
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-1 rounded-lg">
                              <Sparkles className="h-3 w-3" />
                              <span>Exchange Match: {match.exchange_potential} Potential</span>
                            </div>

                            <div className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                              {match.explanation}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[8.5px] px-1.5 rounded font-bold uppercase">
                                Niche: {match.niche}
                              </span>
                              <span className="bg-slate-105 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[8.5px] px-1.5 rounded font-semibold font-mono">
                                Lang: {match.language.toUpperCase()} ({match.country})
                              </span>
                              <span className="bg-slate-105 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[8.5px] px-1.5 rounded font-normal font-mono">
                                DA: {match.authority_score}
                              </span>
                              <span className={`text-[8.5px] px-1.5 rounded font-black ${
                                match.spam_score > 10 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                              }`}>
                                Spam Index: {match.spam_score}%
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                            <button
                              onClick={() => openCoPilot(match)}
                              className="flex-1 py-1 px-3 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Request Exchange
                            </button>
                            
                            <a
                              href={`https://${match.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 px-2.5 hover:bg-slate-150 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-800 border rounded-lg text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1 transition"
                            >
                              <span>View</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* INCOMING REQUESTS TAB */}
              {tab === "incoming" && (
                <div className="space-y-4">
                  {(!data.incomingRequests || data.incomingRequests.length === 0) ? (
                    <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl text-slate-400 font-medium text-xs">
                      No pending incoming requests waiting. You can trigger outreach on Recommended Matches above!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-150 dark:divide-slate-850 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 p-4">
                      {data.incomingRequests.map((req: any) => (
                        <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between md:items-start gap-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-white font-mono select-all">
                                {req.sender_site_name}
                              </span>
                              <span className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450 text-[8.5px] px-1.5 rounded font-black font-mono">
                                DA: {req.sender_authority}
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 text-[8.5px] px-1.5 rounded font-bold uppercase">
                                {req.sender_niche}
                              </span>
                            </div>

                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              Target Page Proposed: <a href={req.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline truncate select-all">{req.target_url}</a>
                            </p>

                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              Proposed Anchor: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold select-all">"{req.anchor_text}"</strong>
                            </p>

                            <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border text-[11px] italic leading-relaxed text-slate-600 dark:text-slate-350">
                              "{req.context_snippet}"
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end">
                            <button
                              disabled={actionLoading === req.id}
                              onClick={() => handleRequestAction(req.id, "approve")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg cursor-pointer flex items-center gap-1 transition"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Accept Exchange
                            </button>

                            <button
                              disabled={actionLoading === req.id}
                              onClick={() => handleRequestAction(req.id, "reject")}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer transition"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SENT REQUESTS TAB */}
              {tab === "sent" && (
                <div className="space-y-4">
                  {(!data.sentRequests || data.sentRequests.length === 0) ? (
                    <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl text-slate-400 font-medium text-xs">
                      You haven't sent any link outreach proposals yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-150 dark:divide-slate-850 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 p-4">
                      {data.sentRequests.map((req: any) => (
                        <div key={req.id} className="py-3 flex sm:items-center justify-between gap-4 first:pt-0 last:pb-0 font-sans">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-850 dark:text-white truncate font-mono select-all">
                                {req.receiver_site_name}
                              </span>
                              <span className="bg-slate-100 dark:bg-slate-900 text-slate-605 text-[8.5px] px-1.5 rounded font-bold uppercase">
                                {req.receiver_niche}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md truncate">
                              Anchor Suggestion: <strong className="text-emerald-600 dark:text-emerald-400 select-all">"{req.anchor_text}"</strong> pointing to {req.target_url}
                            </p>
                            <p className="text-[9px] text-slate-400">
                              Dispatched: {new Date(req.created_at).toLocaleString()}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              req.status === "pending" ? "bg-amber-100 text-amber-800" :
                              req.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                              "bg-rose-100 text-rose-800"
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MY EXCHANGES TAB & MONITORS */}
              {tab === "active" && (
                <div className="space-y-4">
                  {(!data.approvedExchanges || data.approvedExchanges.length === 0) ? (
                    <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl text-slate-400 font-medium text-xs">
                      No active exchanges recorded. Incoming acceptances and sent requested approvals will display here automatically.
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 p-4 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-105 pb-2">
                        <span>Link Interlock Details</span>
                        <span>Safety Control Scanner</span>
                      </div>

                      {data.approvedExchanges.map((ex: any) => {
                        const isPrimarySender = ex.sender_site_id === data.mySite.id;
                        return (
                          <div key={ex.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-1 min-w-0">
                              <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-white select-all">
                                <span className={`h-2.5 w-2.5 rounded-full ${ex.exchange_status === "live" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                                {isPrimarySender ? ex.receiver_domain : ex.sender_domain}
                              </span>

                              <div className="flex flex-wrap gap-1.5">
                                <span className="bg-slate-105 text-slate-600 text-[8.5px] px-1 rounded uppercase font-bold">
                                  {ex.partner_niche}
                                </span>
                                <span className="bg-indigo-50 text-indigo-700 text-[8.5px] px-1 rounded font-black font-mono">
                                  DA: {ex.partner_authority}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Host URL (Where link sits): <a href={ex.backlink_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline select-all">{ex.backlink_url}</a>
                              </p>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Link Destination: <a href={ex.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline select-all">{ex.target_url}</a>
                              </p>

                              <p className="text-[11px] text-slate-600 dark:text-slate-350">
                                Anchor Verified: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold select-all">"{ex.anchor_text}"</strong>
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 w-full md:w-auto shrink-0 select-none">
                              <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
                                <span className={`text-[9px] font-black uppercase text-center px-2 py-0.5 rounded tracking-wider ${
                                  ex.exchange_status === "live" ? "bg-emerald-100 text-emerald-805" :
                                  ex.exchange_status === "broken" ? "bg-rose-100 text-rose-805" :
                                  "bg-amber-100 text-amber-805"
                                }`}>
                                  Status: {ex.exchange_status}
                                </span>

                                <span className="text-[9px] text-slate-400 leading-none">
                                  Scanned: Yes
                                </span>
                              </div>

                              <div className="flex gap-1.5 w-full select-none">
                                <button
                                  disabled={actionLoading === ex.id}
                                  onClick={() => verifyLinkNode(ex.id)}
                                  className="flex-1 sm:flex-none p-1.5 px-3 bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-[10px] font-black rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition"
                                >
                                  {actionLoading === ex.id ? <Loader2 className="h-3 w-3 animate-spin text-white" /> : <Layers className="h-3.5 w-3.5 text-white" />}
                                  <span>Track Backlink</span>
                                </button>

                                <button
                                  onClick={() => reportAbuseNode(isPrimarySender ? ex.receiver_site_id : ex.sender_site_id)}
                                  className="p-1.5 px-2 hover:bg-rose-50 text-slate-450 hover:text-rose-600 rounded-lg transition cursor-pointer flex items-center justify-center"
                                  title="Report Spam Link Placement"
                                >
                                  <ShieldAlert className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Columns: Charts & Logs */}
            <div className="space-y-4">
              
              {/* Domain Authority Graph */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-205"}`}>
                <h4 className="text-xs font-black uppercase tracking-widest text-[#0c1612] dark:text-white flex items-center gap-1.5 mb-4">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Network Authority Over Time
                </h4>

                <div className="h-[160px] w-full font-sans -ml-4 select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.authorityHistory}>
                      <CartesianGrid strokeDasharray="3 3" opacity={isDarkMode ? 0.05 : 0.15} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke={isDarkMode ? "#64748b" : "#94a3b8"} />
                      <YAxis domain={['dataMin - 10', 100]} tick={{ fontSize: 9 }} stroke={isDarkMode ? "#64748b" : "#94a3b8"} />
                      <Tooltip contentStyle={{ background: isDarkMode ? "#0c1612" : "#ffffff", borderColor: "#10b981", fontSize: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        name="Domain Authority Score"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#10b981" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Network Action Logs */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-205"}`}>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5 mb-3 border-b border-slate-100 pb-2">
                  <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
                  Real-Time Exchange Signals
                </h4>

                {(!data.healthLogs || data.healthLogs.length === 0) ? (
                  <div className="py-8 text-center text-slate-400 text-[11px] font-medium">
                    No active interlink telemetry on record.
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
                    {data.healthLogs.map((log: any) => (
                      <div key={log.id} className="relative pl-4 space-y-0.5">
                        <span className={`absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full ${
                          log.severity === "success" ? "bg-emerald-500" :
                          log.severity === "error" ? "bg-rose-500 animate-ping" :
                          log.severity === "warn" ? "bg-amber-500" : "bg-blue-500"
                        }`} />
                        <p className="text-[11px] leading-relaxed font-semibold text-slate-800 dark:text-slate-350">
                          {log.message}
                        </p>
                        <span className="block text-[9px] text-slate-405 font-medium font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI OUTREACH DRAWER (PORTAL MODAL OVERLAY) */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-slate-950/45 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white dark:bg-slate-950 w-full max-w-lg h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200 dark:border-slate-850 animate-slide-in">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center font-bold">
                    AI
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Co-Pilot Outreach Planner</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Interlink Request Node: {selectedMatch.domain}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {aiLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" strokeWidth={3} />
                  <p className="text-xs font-bold text-slate-500 text-center animate-pulse">
                    AI analysis modeling matching niches, topical keywords, and semantic anchor points...
                  </p>
                </div>
              ) : (
                <div className="space-y-4 font-sans text-left">
                  
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500 animate-bounce" />
                    <div>
                      <span className="block text-xs font-black text-indigo-950 dark:text-indigo-400">Contextual Backlink Co-Pilot</span>
                      <p className="text-[10px] text-slate-500 leading-none mt-0.5">RankSyncer AI predicted appropriate natural placement below.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Proposed Anchor Text</label>
                      <input
                        type="text"
                        value={aiAnchor}
                        onChange={(e) => setAiAnchor(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-lg w-full font-bold text-emerald-600 focus:ring-emerald-500 select-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Suggest Recipient Target Page (Points to yours)</label>
                      <input
                        type="text"
                        value={aiTargetUrl}
                        onChange={(e) => setAiTargetUrl(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-lg w-full font-mono text-slate-650 focus:ring-emerald-555 select-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Target Page URL (On their site)</label>
                      <input
                        type="text"
                        value={customPlacement}
                        onChange={(e) => setCustomPlacement(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-lg w-full font-mono text-slate-650 focus:ring-emerald-550 select-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">AI Context Rich Snippet Sentence</label>
                      <textarea
                        rows={3}
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs p-2.5 rounded-lg w-full italic leading-relaxed text-slate-700 dark:text-slate-200"
                      />
                    </div>
                  </div>

                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-850 pt-3 mt-4">
              <button
                disabled={aiLoading}
                onClick={handleSendRequest}
                className="flex-1 py-2.5 bg-slate-950 dark:bg-emerald-600 hover:bg-slate-900 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="h-4 w-4" />
                <span>Dispatch Exchange Proposal</span>
              </button>

              <button
                onClick={() => setSelectedMatch(null)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
