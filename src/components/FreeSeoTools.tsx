import React, { useState, useEffect } from "react";
import CompetitorAnalysisTool from "./CompetitorAnalysisTool";
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  Users,
  Terminal,
  FileText,
  Search,
  Check,
  Copy,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  Mail,
  Globe,
  Lock,
  Link,
  PlusCircle,
  HelpCircle,
  MessageSquare,
  Hash,
  Activity,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

// ==========================================
// CORE TYPES & CONFIGURATION
// ==========================================

interface ToolConfig {
  slug: string;
  name: string;
  description: string;
  category: "all" | "metadata" | "content" | "keyword";
  iconName: string;
  popularityScore: number;
}

const FREE_TOOLS: ToolConfig[] = [
  {
    slug: "title-generator",
    name: "SEO Title Generator",
    description: "Generate highly optimized, magnetic headlines and click-bait titles tested to raise click-through rates.",
    category: "metadata",
    iconName: "Hash",
    popularityScore: 92,
  },
  {
    slug: "meta-generator",
    name: "Meta Description Generator",
    description: "Draft compelling search snippets that include strategic keywords and clear psychological Call-To-Actions.",
    category: "metadata",
    iconName: "FileText",
    popularityScore: 88,
  },
  {
    slug: "keyword-generator",
    name: "Keyword Generator & Research",
    description: "Extract direct semantic clusters, volume metrics, competition levels, CPC targets and search intent guides.",
    category: "keyword",
    iconName: "Search",
    popularityScore: 95,
  },
  {
    slug: "outline-generator",
    name: "Blog Outline Generator",
    description: "Structure fully structured, hierarchical outlines (H2, H3 tags) containing targeted semantic talking points.",
    category: "content",
    iconName: "BookOpen",
    popularityScore: 81,
  },
  {
    slug: "topic-generator",
    name: "Blog Topic Idea Generator",
    description: "Brainstorm high-traffic, trending topic angles categorized by listicles, definitive guides, and case studies.",
    category: "content",
    iconName: "Sparkles",
    popularityScore: 78,
  },
  {
    slug: "faq-generator",
    name: "FAQ Block Generator",
    description: "Generate natural frequently asked questions along with informative, structured Schema-ready organic answers.",
    category: "content",
    iconName: "HelpCircle",
    popularityScore: 71,
  },
  {
    slug: "slug-generator",
    name: "SEO Friendly Slug Maker",
    description: "Convert verbose visual post headlines into short, clean, crawl-optimized kebab-case URL slugs.",
    category: "metadata",
    iconName: "Link",
    popularityScore: 65,
  },
  {
    slug: "content-brief-generator",
    name: "AI Content Brief Generator",
    description: "Compile exhaustive directives for bloggers, listing LSI targeting, competitors density, and formatting rules.",
    category: "keyword",
    iconName: "Terminal",
    popularityScore: 90,
  },
  {
    slug: "seo-competitor-analysis",
    name: "SEO Competitor Analysis Tool",
    description: "Compare your website against competitors and discover SEO gaps, keyword opportunities, content gaps, and backlinks.",
    category: "keyword",
    iconName: "TrendingUp",
    popularityScore: 97,
  },
];

interface FreeSeoToolsProps {
  onBackToLanding: () => void;
  onPricingClick: () => void;
  onLaunchApp: () => void;
}

export default function FreeSeoTools({
  onBackToLanding,
  onPricingClick,
  onLaunchApp,
}: FreeSeoToolsProps) {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "metadata" | "content" | "keyword">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Rate limits state
  const [userId, setUserId] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorUrl, setVisitorUrl] = useState("");
  const [registered, setRegistered] = useState(false);
  const [rateLimit, setRateLimit] = useState<{
    allowed: boolean;
    remaining: number;
    max: number;
    tier: "anonymous" | "registered" | "paid";
  }>({
    allowed: true,
    remaining: 3,
    max: 3,
    tier: "anonymous",
  });

  // Modal triggering states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [modalEmail, setModalEmail] = useState("");
  const [modalWebsite, setModalWebsite] = useState("");
  const [modalSuccess, setModalSuccess] = useState(false);

  // Community live analytics
  const [communityAnalytics, setCommunityAnalytics] = useState({
    total_runs: 384,
    total_leads: 104,
    conversion_rate_percentage: 27.1,
    by_tool: {} as Record<string, number>,
  });

  // Active Tool state
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // ==========================================
  // INITS & LOADERS
  // ==========================================
  useEffect(() => {
    // Generate or fetch client-side identifier to prevent limit abuse
    let storedId = localStorage.getItem("ranksyncer_free_tools_user_id");
    if (!storedId) {
      storedId = `anon-ft-${Math.floor(Math.random() * 10000000)}-${Date.now().toString(36)}`;
      localStorage.setItem("ranksyncer_free_tools_user_id", storedId);
    }
    setUserId(storedId);

    // Fetch registered info
    const savedEmail = localStorage.getItem("ranksyncer_free_tools_email");
    const savedUrl = localStorage.getItem("ranksyncer_free_tools_website");
    if (savedEmail) {
      setVisitorEmail(savedEmail);
      setModalEmail(savedEmail);
      setRegistered(true);
    }
    if (savedUrl) {
      setVisitorUrl(savedUrl);
      setModalWebsite(savedUrl);
    }

    // Load initial analytics
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchLimits();
    }
  }, [userId, visitorEmail]);

  // Handle active tool reset: clears fields to keep UX clean & fast
  const selectTool = (slug: string | null) => {
    setActiveTool(slug);
    setResults(null);
    setApiError("");
    setInputs({});
    setCopiedIndex(null);
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/free-tools/analytics");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCommunityAnalytics(data.analytics);
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve community analytics metrics:", e);
    }
  };

  const fetchLimits = async () => {
    try {
      const url = `/api/free-tools/check-limit?userId=${userId}&email=${visitorEmail || ""}&activePlan=free`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRateLimit({
            allowed: data.allowed,
            remaining: data.remaining,
            max: data.max,
            tier: data.tier,
          });
        }
      }
    } catch (e) {
      console.warn("Limit loader failed:", e);
    }
  };

  // ==========================================
  // FORM SUBMISSION & ENGINE CORE
  // ==========================================
  const executeGeneration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setApiError("");
    setIsLoading(true);

    // 1. Guard Rate Limits locally
    if (rateLimit.remaining <= 0 && rateLimit.tier !== "paid") {
      setIsLoading(false);
      setShowLeadModal(true);
      return;
    }

    try {
      const res = await fetch("/api/free-tools/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolName: activeTool,
          inputData: inputs,
          userId,
          email: visitorEmail || undefined,
          websiteUrl: visitorUrl || undefined,
          activePlan: "free",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResults(data.output);
        setRateLimit((prev) => ({
          ...prev,
          remaining: data.remaining,
          max: data.max,
          tier: data.tier,
        }));
        
        // Refresh community numbers
        fetchAnalytics();
      } else {
        if (res.status === 429) {
          setShowLeadModal(true);
        }
        setApiError(data.error || "An unexpected error occurred during AI synthesis.");
      }
    } catch (err: any) {
      setApiError("The server timed out. Please verify your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Convert lead / email entry
  const handleCaptureLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail || !modalEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    try {
      const res = await fetch("/api/free-tools/save-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: modalEmail,
          websiteUrl: modalWebsite || undefined,
          toolName: activeTool || "general",
        }),
      });

      if (res.ok) {
        localStorage.setItem("ranksyncer_free_tools_email", modalEmail);
        if (modalWebsite) {
          localStorage.setItem("ranksyncer_free_tools_website", modalWebsite);
        }
        setVisitorEmail(modalEmail);
        setVisitorUrl(modalWebsite);
        setRegistered(true);
        setModalSuccess(true);
        
        // Refresh rate limits which elevates the tier to 'registered' (15 limit!)
        setTimeout(() => {
          setShowLeadModal(false);
          setModalSuccess(false);
          fetchLimits();
        }, 1800);
      }
    } catch (e) {
      console.error("Lead retention handler crashed:", e);
    }
  };

  const handleCopyClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(identifier);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filter free tools Catalog list
  const filteredTools = FREE_TOOLS.filter((t) => {
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Resolve Lucide icons dynamically to keep style clean and consistent
  const renderToolIcon = (name: string, classes: string = "h-6 w-6 text-emerald-450") => {
    switch (name) {
      case "Hash":
        return <Hash className={classes} />;
      case "FileText":
        return <FileText className={classes} />;
      case "Search":
        return <Search className={classes} />;
      case "BookOpen":
        return <BookOpen className={classes} />;
      case "Sparkles":
        return <Sparkles className={classes} />;
      case "HelpCircle":
        return <HelpCircle className={classes} />;
      case "Link":
        return <Link className={classes} />;
      case "Terminal":
        return <Terminal className={classes} />;
      case "TrendingUp":
        return <TrendingUp className={classes} />;
      default:
        return <Sparkles className={classes} />;
    }
  };

  return (
    <div
      id="ranksyncer-free-tools-env"
      className="min-h-screen bg-[#040a08] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/25 selection:text-emerald-300"
    >
      {/* ==========================================
          HEADER SUITE
          ========================================== */}
      <header className="border-b border-emerald-950/40 bg-[#040a08]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="ft-back-btn"
            onClick={onBackToLanding}
            className="flex items-center justify-center p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/40 transition-all duration-200"
            title="Go to main homepage"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-550/10">
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-[15px] tracking-tight text-white flex items-center gap-1.5">
                RankSyncer <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-350">Free Tier</span>
              </span>
              <p className="text-[10px] text-slate-450 font-medium">Lead Acquisition & Keyword Engine</p>
            </div>
          </div>
        </div>

        {/* Dynamic rate limiter HUD indicators */}
        <div className="hidden md:flex items-center gap-5">
          <div className="flex items-center gap-3 bg-emerald-950/20 border border-emerald-900/20 rounded-full px-4 py-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-450" />
            <div className="text-xs">
              <span className="text-slate-400 font-medium">Daily Quota:</span>{" "}
              <strong className="text-emerald-350 font-bold">{rateLimit.remaining}</strong>{" "}
              <span className="text-slate-500">/ {rateLimit.max} left</span>
            </div>
            <div className="h-2 w-16 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${(rateLimit.remaining / rateLimit.max) * 100}%` }}
              ></div>
            </div>
            <span className="text-[9px] uppercase tracking-widest font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {rateLimit.tier}
            </span>
          </div>

          <button
            id="ft-pricing-link"
            onClick={onPricingClick}
            className="text-xs font-semibold text-slate-350 hover:text-white transition"
          >
            Pricing Plans
          </button>

          <button
            id="ft-app-direct-btn"
            onClick={onLaunchApp}
            className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#022c22] px-4 py-2 rounded-lg transition-all duration-300 shadow-md shadow-emerald-500/10"
          >
            Launch Core Platform <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Small screen simplified limits marker */}
        <div className="flex md:hidden items-center gap-3">
          <div className="text-xs bg-emerald-950/30 border border-emerald-900/40 rounded px-2.5 py-1">
            <span className="text-emerald-350 font-extrabold">{rateLimit.remaining} Runs</span>
          </div>
          <button
            onClick={() => setShowLeadModal(true)}
            className="text-[11px] font-extrabold bg-emerald-500/20 text-emerald-350 border border-emerald-500/30 px-3 py-1 rounded"
          >
            Boost Quota
          </button>
        </div>
      </header>

      {/* ==========================================
          MAIN CHASSIS
          ========================================== */}
      <main className="flex-1 flex flex-col">
        {!activeTool ? (
          /* ==========================================
             TOOLBOX CATALOG VISIONS
             ========================================== */
          <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col gap-10">
            {/* Hero pitch banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-emerald-950/30 pb-10">
              <div className="max-w-2xl flex flex-col gap-3">
                <span className="text-xs font-extrabold tracking-widest uppercase text-emerald-400 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  RankSyncer Lead Generation Suite
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Free SEO Tools Ecosystem
                </h1>
                <p className="text-slate-400 text-sm md:text-[15px] leading-relaxed">
                  Generate SEO titles, keyword ideas, nested outlines, metadata profiles, and
                  technical content briefs instantly using our autonomous AI engines.
                </p>
              </div>

              {/* Real-time stats meter panel to establish authority */}
              <div className="bg-gradient-to-br from-[#0c1f18] to-[#040f0c] border border-emerald-900/40 rounded-2xl p-5 md:min-w-[320px] flex flex-col gap-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-emerald-950/40 pb-2.5">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Community Usage & Funnel Status</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-base md:text-lg font-black text-rose-450 block">
                      {communityAnalytics.total_runs}
                    </span>
                    <span className="text-[9px] font-medium text-slate-450 uppercase block">Total Solves</span>
                  </div>
                  <div className="border-x border-emerald-950/40">
                    <span className="text-base md:text-lg font-black text-emerald-400 block">
                      {communityAnalytics.total_leads}
                    </span>
                    <span className="text-[9px] font-medium text-slate-450 uppercase block">Leads Enrolled</span>
                  </div>
                  <div>
                    <span className="text-base md:text-lg font-black text-indigo-400 block">
                      {communityAnalytics.conversion_rate_percentage}%
                    </span>
                    <span className="text-[9px] font-medium text-slate-450 uppercase block">Conversion Rate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Catalog searcher & filter bars */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-emerald-950/20 border border-emerald-900/20 self-start">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === "all"
                      ? "bg-emerald-500 text-[#022c22] shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All Tools Catalog
                </button>
                <button
                  onClick={() => setSelectedCategory("metadata")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === "metadata"
                      ? "bg-emerald-500 text-[#022c22] shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Titles & Meta
                </button>
                <button
                  onClick={() => setSelectedCategory("keyword")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === "keyword"
                      ? "bg-emerald-500 text-[#022c22] shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Keywords & Briefs
                </button>
                <button
                  onClick={() => setSelectedCategory("content")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === "content"
                      ? "bg-emerald-500 text-[#022c22] shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Outlines & Topics
                </button>
              </div>

              {/* Live search input */}
              <div className="relative md:max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search 8 AI engines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#05130f] border border-emerald-900/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-550 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Bento style Grid catalog displaying 8 premium cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTools.map((tool) => (
                <div
                  key={tool.slug}
                  id={`tool-card-${tool.slug}`}
                  onClick={() => selectTool(tool.slug)}
                  className="group relative bg-gradient-to-b from-[#0c1c16] to-[#040c0a] border border-emerald-950/80 hover:border-emerald-700/60 rounded-2xl p-6 flex flex-col gap-5 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-emerald-950/20"
                >
                  {/* Glowing hover visual background accent */}
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-xl bg-emerald-950/50 border border-emerald-900/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow">
                      {renderToolIcon(tool.iconName, "h-5 w-5 text-emerald-400")}
                    </div>
                    <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/45">
                      Popularity {tool.popularityScore}%
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5">
                    <h3 className="text-[15px] font-bold text-white tracking-tight group-hover:text-emerald-350 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-450 group-hover:text-emerald-350 pt-2 border-t border-emerald-950/30 mt-2">
                    Launch Tool <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {/* Zero state searching results */}
            {filteredTools.length === 0 && (
              <div className="text-center py-20 border border-dashed border-emerald-950/40 rounded-2xl bg-emerald-950/5">
                <AlertCircle className="h-12 w-12 text-slate-650 mx-auto mb-4" />
                <h3 className="text-slate-300 font-bold mb-1">No matches found for "{searchQuery}"</h3>
                <p className="text-slate-500 text-xs">Try selecting a different tool category above.</p>
              </div>
            )}

            {/* Trust badge footer footer block */}
            <div className="mt-16 bg-gradient-to-r from-emerald-950/10 to-indigo-950/10 border border-emerald-900/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1.5 max-w-xl">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-400" />
                  Complete Search Domain Suite
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Ready to go past individual page generations? Import these outputs directly into the core RankSyncer dashboard to sync with Google Search Console, build programmatic topical networks, track competitor link signals, and write entire outranking sites automatically.
                </p>
              </div>
              <button
                id="ft-upgrade-cta"
                onClick={onPricingClick}
                className="whitespace-nowrap px-6 py-3 rounded-xl bg-emerald-500 text-[#022c22] font-black text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/10"
              >
                Claim Premium Account
              </button>
            </div>
          </div>
        ) : activeTool === "seo-competitor-analysis" ? (
          <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 flex flex-col gap-6">
            <div className="flex items-center gap-2 select-none">
              <button
                onClick={() => selectTool(null)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                &larr; Catalog Overview
              </button>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-slate-450 font-medium">
                SEO Competitor Gaps Analysis
              </span>
            </div>
            <CompetitorAnalysisTool
              visitorEmail={visitorEmail}
              visitorUrl={visitorUrl}
              onLaunchApp={onLaunchApp}
              onSaveLead={async (email, websiteUrl) => {
                try {
                  const res = await fetch("/api/competitor-analysis/save-lead", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, websiteUrl }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                      localStorage.setItem("ranksyncer_free_tools_email", email);
                      localStorage.setItem("ranksyncer_free_tools_website", websiteUrl);
                      setVisitorEmail(email);
                      setVisitorUrl(websiteUrl);
                      setRegistered(true);
                      fetchLimits();
                      fetchAnalytics();
                      return data.lead;
                    }
                  }
                } catch (e) {
                  console.error("Failed to capture lead details in Free Tools frame", e);
                }
                return null;
              }}
              rateLimit={rateLimit}
              refreshLimits={fetchLimits}
            />
          </div>
        ) : (
          /* ==========================================
             DEDICATED RUN ACTIONS PANEL (INDIVIDUAL TOOLS)
             ========================================== */
          <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 flex flex-col gap-6">
            {/* Back indicator breadcrumb path */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => selectTool(null)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                &larr; Catalog Overview
              </button>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-slate-450 font-medium">
                {FREE_TOOLS.find((t) => t.slug === activeTool)?.name}
              </span>
            </div>

            {/* Split layout: Inputs Form vs AI outcome showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              {/* Form segment */}
              <div className="lg:col-span-2 bg-[#061410] border border-emerald-950/60 rounded-2xl p-6 flex flex-col gap-6 shadow-xl sticky top-24">
                <div className="flex items-center gap-3 border-b border-emerald-950/40 pb-4">
                  <div className="h-9 w-9 rounded-lg bg-emerald-950 flex items-center justify-center border border-emerald-900/35">
                    {renderToolIcon(FREE_TOOLS.find((t) => t.slug === activeTool)?.iconName || "", "h-5 w-5 text-emerald-450")}
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-white tracking-tight">
                      {FREE_TOOLS.find((t) => t.slug === activeTool)?.name}
                    </h2>
                    <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">AI Optimizer Engine</p>
                  </div>
                </div>

                {/* Compile appropriate parameters based on the active tool */}
                <form onSubmit={executeGeneration} className="flex flex-col gap-4">
                  {/* Tool 1: SEO Title Generator */}
                  {activeTool === "title-generator" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Product Topic / Primary Keyword</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., modern coffee grinders, cold email software"
                          value={inputs.keyword || ""}
                          onChange={(e) => setInputs({ ...inputs, keyword: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Target Audience Profile</label>
                        <input
                          type="text"
                          placeholder="e.g., home baristas, SaaS startup executives, college students"
                          value={inputs.audience || ""}
                          onChange={(e) => setInputs({ ...inputs, audience: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Tone of Headline</label>
                        <select
                          value={inputs.tone || "Professional"}
                          onChange={(e) => setInputs({ ...inputs, tone: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        >
                          <option value="Confident">Confident & Decisive</option>
                          <option value="Professional">Professional Editorial</option>
                          <option value="Urgent">Urgent (FOMO Focus)</option>
                          <option value="Witty">Witty & Creative</option>
                          <option value="Educational">Simple Educational</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Tool 2: Meta Generator */}
                  {activeTool === "meta-generator" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Target Content Keyword</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., affordable local HVAC repair"
                          value={inputs.keyword || ""}
                          onChange={(e) => setInputs({ ...inputs, keyword: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Brand Domain / Name</label>
                        <input
                          type="text"
                          placeholder="e.g., BreezeFixed Inc., ranksyncer.io"
                          value={inputs.brand || ""}
                          onChange={(e) => setInputs({ ...inputs, brand: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">What is the Page Concept?</label>
                        <input
                          type="text"
                          placeholder="e.g., landing page, service pricing directory, expert guides list"
                          value={inputs.topic || ""}
                          onChange={(e) => setInputs({ ...inputs, topic: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Core Value Proposition / Offer</label>
                        <input
                          type="text"
                          placeholder="e.g., 20% discount on first crawl, certified technicians available"
                          value={inputs.valueProp || ""}
                          onChange={(e) => setInputs({ ...inputs, valueProp: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Tool 3: Keyword Generator */}
                  {activeTool === "keyword-generator" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Seed Term or Concept</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., headless CMS, vegan leather shoes"
                          value={inputs.keyword || ""}
                          onChange={(e) => setInputs({ ...inputs, keyword: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Business Industry Niche</label>
                        <input
                          type="text"
                          placeholder="e.g., digital marketing, ecommerce, medical tech"
                          value={inputs.niche || ""}
                          onChange={(e) => setInputs({ ...inputs, niche: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Target Search Intent</label>
                        <select
                          value={inputs.intent || "All"}
                          onChange={(e) => setInputs({ ...inputs, intent: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        >
                          <option value="All">All intents mixed</option>
                          <option value="Informational">Informational (Guides, answers)</option>
                          <option value="Commercial">Commercial / Transactional (Buying intent)</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Target Location</label>
                        <input
                          type="text"
                          placeholder="e.g., Global, United States, United Kingdom"
                          value={inputs.location || ""}
                          onChange={(e) => setInputs({ ...inputs, location: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Tool 4: Outline Generator */}
                  {activeTool === "outline-generator" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Goal Blog Post Topic</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., The future of autonomous AI code assistants"
                          value={inputs.topic || ""}
                          onChange={(e) => setInputs({ ...inputs, topic: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Primary Keyword to Target</label>
                        <input
                          type="text"
                          placeholder="e.g., ai coding assistant"
                          value={inputs.keyword || ""}
                          onChange={(e) => setInputs({ ...inputs, keyword: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Writing Tone of Voice</label>
                        <select
                          value={inputs.tone || "Informative"}
                          onChange={(e) => setInputs({ ...inputs, tone: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        >
                          <option value="Informational">Informative & Comprehensive</option>
                          <option value="Authority">Strong Authority & Opinionated</option>
                          <option value="Casual">Casual & Accessible</option>
                          <option value="Instructional">Instructional Step-By-Step</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Tool 5: Topic generator */}
                  {activeTool === "topic-generator" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Subject Category / Niche</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., gluten free baking, corporate cybersecurity"
                          value={inputs.subject || ""}
                          onChange={(e) => setInputs({ ...inputs, subject: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Target Reader & Blogging Goal</label>
                        <input
                          type="text"
                          placeholder="e.g., busy parents wanting quick meals, security directors scaling tech"
                          value={inputs.nicheAndAudience || ""}
                          onChange={(e) => setInputs({ ...inputs, nicheAndAudience: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Tool 6: FAQ Generator */}
                  {activeTool === "faq-generator" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Core Topic or Product Service</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., RankSyncer SEO Software, Organic link building networks"
                          value={inputs.topic || ""}
                          onChange={(e) => setInputs({ ...inputs, topic: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Core Specifications & Crucial Details</label>
                        <textarea
                          placeholder="e.g., utilizes server-side gemini api, secure Firestore database records, daily limit rate control tiers"
                          value={inputs.specs || ""}
                          onChange={(e) => setInputs({ ...inputs, specs: e.target.value })}
                          className="w-full min-h-[90px] bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Tool 7: Slug Maker */}
                  {activeTool === "slug-generator" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Draft Article Headline</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., 25 Crazy Strategies to Instantly Rank Organic Sites on Google First Page!"
                          value={inputs.title || ""}
                          onChange={(e) => setInputs({ ...inputs, title: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Target Focus Keyword</label>
                        <input
                          type="text"
                          placeholder="e.g., rank organic sites"
                          value={inputs.keyword || ""}
                          onChange={(e) => setInputs({ ...inputs, keyword: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Tool 8: Content Brief Generator */}
                  {activeTool === "content-brief-generator" && (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Core Topic or Main Search Term</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., how to build structured schema Organization markup"
                          value={inputs.keyword || ""}
                          onChange={(e) => setInputs({ ...inputs, keyword: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Top Competitor URLs (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g., backlinko.com/schema-guide, moz.com/rich-snippets"
                          value={inputs.competitors || ""}
                          onChange={(e) => setInputs({ ...inputs, competitors: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350">Target Word Count Length</label>
                        <select
                          value={inputs.wordCount || "1500"}
                          onChange={(e) => setInputs({ ...inputs, wordCount: e.target.value })}
                          className="w-full bg-[#030b08] border border-emerald-950 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 outline-none"
                        >
                          <option value="800">Short Summary (500 - 1,000 words)</option>
                          <option value="1500">Standard Editorial (1,000 - 1,800 words)</option>
                          <option value="2500">Deep Topical Resource (2,000 - 3,500 words)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {apiError && (
                    <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{apiError}</span>
                    </div>
                  )}

                  {/* Submission triggers */}
                  <button
                    type="submit"
                    id="submit-generate-tool"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-emerald-600 border-none hover:from-emerald-450 text-[#022c22] py-3 rounded-xl transition disabled:opacity-50 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RotateCcw className="h-4 w-4 animate-spin text-[#022c22]" /> Synthesizing SEO Target Data...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" /> Synthesize Free SEO Draft
                      </>
                    )}
                  </button>
                </form>

                {/* Quota warning inside form segment */}
                <div className="text-center bg-slate-950/40 rounded-xl p-3 border border-emerald-950/30">
                  <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">YOUR FREE ACCOUNT STATUS</span>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Remaining Runs: <strong className="text-emerald-350">{rateLimit.remaining}</strong> today
                  </p>
                  {rateLimit.tier === "anonymous" && (
                    <button
                      onClick={() => setShowLeadModal(true)}
                      className="text-[10px] font-bold text-emerald-400 hover:underline"
                    >
                      ✉️ Enter Email to secure 15 more generations
                    </button>
                  )}
                </div>
              </div>

              {/* Outcome Segment */}
              <div className="lg:col-span-3 min-h-[400px] flex flex-col">
                {!results && !isLoading && (
                  <div className="flex-1 border border-dashed border-emerald-900/20 rounded-2xl bg-emerald-950/5 flex flex-col items-center justify-center text-center p-8">
                    <Terminal className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-300 mb-1">Awaiting Technical Inputs</h3>
                    <p className="text-slate-500 text-xs max-w-sm">
                      Provide focus parameters, key metrics, and specs in the form panel and click "Synthesize" to generate custom optimized metadata structures.
                    </p>
                  </div>
                )}

                {isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#05100d] border border-emerald-950/40 rounded-2xl">
                    <Activity className="h-10 w-10 text-emerald-400 animate-bounce mb-3" />
                    <h3 className="text-sm font-bold text-white mb-2">Engaging Core SEO Models</h3>
                    <p className="text-slate-400 text-xs max-w-md mb-4 leading-relaxed">
                      Compiling crawler guidelines, keyword alignment standards, intent indexes and generating optimized outputs...
                    </p>
                    <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full animate-[loading-bar_1.5s_infinite]"></div>
                    </div>
                  </div>
                )}

                {results && !isLoading && (
                  <div className="flex-1 flex flex-col gap-6 animate-[fade-in-slide-up_0.3s_ease]">
                    {/* Header bar */}
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-450" />
                        <span className="text-xs font-extrabold uppercase tracking-widest text-[#a8afad]">Crawl Optimized Output Detected</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Model: gemini-3.5-flash (JSON)</span>
                    </div>

                    {/* Render matching outcome profiles based on the active tool */}
                    <div className="flex flex-col gap-4">
                      {/* 1. SEC Title Generator Results */}
                      {activeTool === "title-generator" && results.titles && (
                        <div className="flex flex-col gap-4">
                          {results.titles.map((title: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-br from-[#071913] to-[#040e0b] border border-emerald-950/60 rounded-xl p-4 flex flex-col gap-3 relative"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <span className="font-extrabold text-[13px] md:text-sm text-white select-all">
                                  {title.value}
                                </span>
                                <button
                                  onClick={() => handleCopyClipboard(title.value, `title-${idx}`)}
                                  className="text-slate-400 hover:text-white p-1 hover:bg-emerald-950 rounded transition"
                                  title="Copy headline"
                                >
                                  {copiedIndex === `title-${idx}` ? (
                                    <Check className="h-4 w-4 text-emerald-450" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-450 border-t border-emerald-950/40 pt-2 font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-slate-900">
                                  Length: {title.length} chars
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-350 font-bold">
                                  CTR Strength: {title.ctr}%
                                </span>
                                <span className="text-slate-400 font-sans italic">{title.reason}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 2. Meta Generator Results */}
                      {activeTool === "meta-generator" && results.meta_descriptions && (
                        <div className="flex flex-col gap-4">
                          {results.meta_descriptions.map((meta: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-br from-[#071913] to-[#040e0b] border border-emerald-950/60 rounded-xl p-4 flex flex-col gap-3 relative"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <p className="text-slate-300 text-xs leading-relaxed select-all">
                                  {meta.value}
                                </p>
                                <button
                                  onClick={() => handleCopyClipboard(meta.value, `meta-${idx}`)}
                                  className="text-slate-400 hover:text-white p-1 hover:bg-emerald-950 rounded transition"
                                >
                                  {copiedIndex === `meta-${idx}` ? (
                                    <Check className="h-4 w-4 text-emerald-450" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-450 border-t border-emerald-950/40 pt-2 font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-emerald-950/20">
                                  Length: {meta.length} chars
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-emerald-950/20 text-indigo-405">
                                  Angle: {meta.angle}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 3. Keyword Generator Results */}
                      {activeTool === "keyword-generator" && results.keywords && (
                        <div className="bg-[#05120e] border border-emerald-950 rounded-xl overflow-hidden shadow-xl">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#0b211a] border-b border-emerald-950 text-slate-350 font-bold">
                                <th className="p-3">Semantic Keyword Option</th>
                                <th className="p-3">Estd. Volume</th>
                                <th className="p-3">Difficulty %</th>
                                <th className="p-3">Search Intent</th>
                                <th className="p-3">CPC (USD)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#071c15]">
                              {results.keywords.map((term: any, idx: number) => (
                                <tr key={idx} className="hover:bg-emerald-950/20 transition">
                                  <td className="p-3 font-semibold text-white flex items-center justify-between gap-2">
                                    <span className="select-all">{term.value}</span>
                                    <button
                                      onClick={() => handleCopyClipboard(term.value, `kw-${idx}`)}
                                      className="text-slate-500 hover:text-white p-0.5"
                                    >
                                      {copiedIndex === `kw-${idx}` ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-450" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="p-3 text-slate-350 font-mono">{term.volume}</td>
                                  <td className="p-3 font-mono">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        term.difficulty.toLowerCase().includes("easy") || 
                                        term.difficulty.toLowerCase().includes("1") || 
                                        term.difficulty.toLowerCase().includes("2")
                                          ? "bg-emerald-950 text-emerald-400"
                                          : term.difficulty.toLowerCase().includes("medium") || 
                                            term.difficulty.toLowerCase().includes("3")
                                          ? "bg-yellow-950 text-yellow-400"
                                          : "bg-red-950 text-red-400"
                                      }`}
                                    >
                                      {term.difficulty}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-350">{term.intent}</td>
                                  <td className="p-3 text-emerald-450 font-mono">{term.CPC}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* 4. Blog Outline Generator Results */}
                      {activeTool === "outline-generator" && results.sections && (
                        <div className="bg-[#05110d] border border-emerald-950 rounded-xl p-5 flex flex-col gap-4">
                          <div className="flex items-center justify-between border-b border-emerald-950 pb-3">
                            <h3 className="font-extrabold text-sm text-white select-all">
                              {results.outline_title}
                            </h3>
                            <button
                              onClick={() => {
                                const fullOutline = results.sections
                                  .map((s: any) => `${s.tag}: ${s.heading}\n- ${s.talking_points.join("\n- ")}`)
                                  .join("\n\n");
                                handleCopyClipboard(fullOutline, "outline-full");
                              }}
                              className="text-emerald-400 font-extrabold hover:underline text-[10px] uppercase tracking-wider flex items-center gap-1"
                            >
                              {copiedIndex === "outline-full" ? (
                                <>
                                  <Check className="h-3 w-3" /> Fully Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" /> Copy Full Outline
                                </>
                              )}
                            </button>
                          </div>
                          
                          <div className="flex flex-col gap-4 mt-2">
                            {results.sections.map((section: any, idx: number) => (
                              <div key={idx} className="border-l-2 border-emerald-800/40 pl-4 py-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[9px] uppercase font-black px-1 rounded bg-[#0b261d] text-emerald-400 font-mono">
                                    {section.tag}
                                  </span>
                                  <h4 className="font-bold text-xs text-white">{section.heading}</h4>
                                  <span className="text-[10px] text-slate-500 italic font-mono ml-auto">
                                    Target: {section.recommended_word_count}
                                  </span>
                                </div>
                                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 pl-1">
                                  {section.talking_points.map((point: string, i: number) => (
                                    <li key={i}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 5. Topic Generator Results */}
                      {activeTool === "topic-generator" && results.topics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {results.topics.map((topic: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-br from-[#071913] to-[#040e0b] border border-emerald-950/60 rounded-xl p-4 flex flex-col gap-3 justify-between"
                            >
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] tracking-wide font-extrabold text-indigo-400 uppercase">
                                  💡 {topic.category}
                                </span>
                                <h4 className="font-bold text-xs text-white select-all leading-snug">
                                  {topic.title}
                                </h4>
                              </div>
                              <div className="border-t border-[#092019] pt-2 mt-2 flex items-center justify-between">
                                <span className="text-[10px] text-slate-450 font-mono">
                                  Difficulty: {topic.difficulty_rating}
                                </span>
                                <button
                                  onClick={() => handleCopyClipboard(topic.title, `topic-${idx}`)}
                                  className="text-slate-400 hover:text-white p-1 hover:bg-emerald-950 rounded transition"
                                >
                                  {copiedIndex === `topic-${idx}` ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-450" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 6. FAQ Block Generator Results */}
                      {activeTool === "faq-generator" && results.faqs && (
                        <div className="flex flex-col gap-4">
                          {results.faqs.map((faq: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-gradient-to-br from-[#071913] to-[#040e0b] border border-emerald-950/60 rounded-xl p-4 flex flex-col gap-2 relative"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <h4 className="font-bold text-xs text-white select-all">
                                  Q: {faq.question}
                                </h4>
                                <button
                                  onClick={() => handleCopyClipboard(`Q: ${faq.question}\nA: ${faq.answer}`, `faq-${idx}`)}
                                  className="text-slate-400 hover:text-white p-1 hover:bg-emerald-950 rounded transition"
                                >
                                  {copiedIndex === `faq-${idx}` ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-450" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                              <p className="text-slate-450 text-xs leading-relaxed">
                                A: {faq.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 7. SEO Slug Maker Results */}
                      {activeTool === "slug-generator" && results.slugs && (
                        <div className="flex flex-col gap-3">
                          {results.slugs.map((slug: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-[#05110d] border border-emerald-950 rounded-xl px-4 py-3.5 flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] uppercase font-black text-emerald-400 font-mono px-1 rounded bg-[#0c241b]">
                                  /{slug.length}c
                                </span>
                                <span className="font-mono text-xs text-white select-all tracking-tight font-bold bg-[#030907] px-2.5 py-1 rounded border border-emerald-950">
                                  {slug.value}
                                </span>
                                <span className="hidden md:inline-block text-[11px] text-slate-500">
                                  ({slug.explanation})
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopyClipboard(slug.value, `slug-${idx}`)}
                                className="text-slate-400 hover:text-white p-1 hover:bg-emerald-950 rounded transition"
                              >
                                {copiedIndex === `slug-${idx}` ? (
                                  <Check className="h-4 w-4 text-emerald-450" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 8. AI Content Brief Results */}
                      {activeTool === "content-brief-generator" && results.target_keywords && (
                        <div className="bg-[#05110d] border border-emerald-950 rounded-xl p-6 flex flex-col gap-5">
                          <div className="flex items-start justify-between border-b border-emerald-950 pb-3">
                            <div>
                              <h3 className="font-extrabold text-[#fff] text-sm tracking-tight">AI Generated Content Writer Brief</h3>
                              <span className="text-[10px] text-slate-500 font-mono uppercase block mt-1">Ready for copy layout creation</span>
                            </div>
                            <button
                              onClick={() => {
                                const fullBrief = `DOCUMENT OVERVIEW:\n${results.document_overview}\n\nINTENT ANALYSIS:\n${results.intent_analysis}\n\nTARGET WORD COUNT:\n${results.word_count_target}\n\nPRIMARY KEYWORD:\n${results.target_keywords.primary}\n\nSECONDARY KEYWORDS:\n${results.target_keywords.secondary.join(", ")}\n\nPROPOSED OUTLINE:\n${results.structured_headers.join("\n")}\n\nWRITING GUIDELINES:\n${results.writing_guidelines}`;
                                handleCopyClipboard(fullBrief, "brief-full");
                              }}
                              className="text-emerald-400 font-extrabold hover:underline text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0"
                            >
                              {copiedIndex === "brief-full" ? (
                                <>
                                  <Check className="h-3 w-3" /> Brief Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" /> Copy Full Brief
                                </>
                              )}
                            </button>
                          </div>

                          <div className="flex flex-col gap-4 text-xs">
                            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-emerald-950/20">
                              <span className="font-bold text-white block mb-1">Target Keyword Profile</span>
                              <p className="text-slate-400 leading-relaxed mb-2">
                                <strong className="text-emerald-400">Primary Keyword:</strong> {results.target_keywords.primary}
                              </p>
                              <p className="text-slate-400 leading-relaxed">
                                <strong className="text-indigo-400">Secondary / LSI targets:</strong>{" "}
                                {results.target_keywords.secondary.join(", ")}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="font-black text-slate-350 block mb-1 font-sans uppercase text-[10px] tracking-wider">Search Intent Strategy</span>
                                <p className="text-slate-400 leading-relaxed bg-[#030907] p-2 rounded border border-emerald-950">{results.intent_analysis}</p>
                              </div>
                              <div>
                                <span className="font-black text-slate-350 block mb-1 font-sans uppercase text-[10px] tracking-wider">Target Article Length</span>
                                <p className="text-slate-400 leading-relaxed bg-[#030907] p-2 rounded border border-emerald-950">{results.word_count_target}</p>
                              </div>
                            </div>

                            <div>
                              <span className="font-black text-slate-350 block mb-1 font-sans uppercase text-[10px] tracking-wider">Proposed Article Outline (HEADING STRUCTURE)</span>
                              <div className="bg-[#030907] p-3.5 rounded border border-emerald-950 space-y-1.5">
                                {results.structured_headers.map((hdr: string, i: number) => (
                                  <div key={i} className="font-mono text-slate-300">
                                    {hdr}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="font-black text-slate-350 block mb-1 font-sans uppercase text-[10px] tracking-wider">Strategic Writing Suggestions</span>
                              <p className="text-slate-400 leading-relaxed bg-[#030907] p-3 rounded border border-emerald-950">{results.writing_guidelines}</p>
                            </div>

                            <div>
                              <span className="font-black text-slate-350 block mb-1 font-sans uppercase text-[10px] tracking-wider">Internal Linking Context Recommendations</span>
                              <ul className="list-disc list-inside bg-[#030907] p-3 rounded border border-emerald-950 text-slate-400 space-y-1">
                                {results.internal_link_targets.map((tgt: string, i: number) => (
                                  <li key={i}>{tgt}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Funnel CTAs connecting back into other RankSyncer tools */}
                    <div className="bg-[#051410] border border-emerald-950/60 rounded-2xl p-6 mt-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                      {/* Decorative glowing gradient circle */}
                      <div className="absolute top-1/2 -left-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl -translate-y-1/2 pointer-events-none"></div>
                      
                      <div className="flex flex-col gap-1.5 max-w-lg relative z-10">
                        <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded self-start">
                          ⚡ Continuous RankSyncer integration loop
                        </span>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          Import your output into our Professional Workspace
                        </h4>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Secure your unmetered premium account. Immediately open this content in the advanced AI blog editor, create structured topical semantic clusters, launch competitor link audit trackers and sync live indexing credentials.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 whitespace-nowrap">
                        <button
                          id="import-editor-action-btn"
                          onClick={onLaunchApp}
                          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs border border-emerald-950 hover:bg-slate-800 transition shadow"
                        >
                          📝 Open in AI Editor
                        </button>
                        <button
                          id="free-tools-claim-premium-btn"
                          onClick={onPricingClick}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 text-[#022c22] font-black text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/10 animate-pulse"
                        >
                          Claim 14-Day Free Trial
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          LEAD CAPTURE / LIMIT UPGRADE MODAL VIEW
          ========================================== */}
      {showLeadModal && (
        <div
          id="ft-lead-capture-modal-shade"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-[fade-in_0.25s_ease]"
        >
          <div
            id="ft-lead-capture-card-container"
            className="w-full max-w-md bg-gradient-to-b from-[#0b1f19] to-[#040d0a] border border-emerald-900/60 rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative shadow-2xl animate-[scale-up_0.3s_ease]"
          >
            <button
              onClick={() => setShowLeadModal(false)}
              className="absolute right-4 top-4 text-slate-550 hover:text-white p-1 rounded-full hover:bg-slate-900 transition"
              title="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Glowing background halo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>

            {!modalSuccess ? (
              <>
                <div className="text-center flex flex-col gap-2 relative z-10 pt-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 flex items-center justify-center mx-auto mb-2 shadow animate-bounce">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    Upgrade Your Free Usage Tier
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed px-2">
                    You've reached the daily benchmark for anonymous visitors. Register your free credentials below to unlock:
                  </p>
                </div>

                <div className="bg-[#030a08] border border-emerald-950/60 rounded-2xl p-4 flex flex-col gap-3 relative z-10 mb-2">
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">✔️</span>
                    <div>
                      <strong>15 Daily Generations</strong> instead of 3
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">✔️</span>
                    <div>
                      <strong>Standard 14-Day Free Trial</strong> on core platform
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <span className="text-emerald-400 font-bold">✔️</span>
                    <div>
                      <strong>Full access to 8 AI Engines</strong> with zero throttling
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCaptureLead} className="flex flex-col gap-4 relative z-10">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Your Work Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-550" />
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={modalEmail}
                        onChange={(e) => setModalEmail(e.target.value)}
                        className="w-full bg-[#030b08] border border-emerald-950 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Website URL target (Optional)</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-550" />
                      <input
                        type="text"
                        placeholder="company.com"
                        value={modalWebsite}
                        onChange={(e) => setModalWebsite(e.target.value)}
                        className="w-full bg-[#030b08] border border-emerald-950 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-600 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="submit-lead-capture-form"
                    className="w-full py-3.5 bg-emerald-500 text-[#022c22] font-black text-xs hover:bg-emerald-400 rounded-xl transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    Unlock 15 Daily Runs + Free Trial
                  </button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={onPricingClick}
                      className="text-[10px] font-bold text-slate-500 hover:text-white hover:underline uppercase tracking-wider"
                    >
                      Or skip directly to paid plans &rarr;
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-8 flex flex-col items-center justify-center gap-4 relative z-10 animate-[fade-in_0.2s_ease]">
                <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 rounded-3xl flex items-center justify-center mb-2 shadow shadow-emerald-500/10 animate-bounce">
                  <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">Credentials Dispatched Successfully!</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Your 15 daily generations are active! Your standard 14-day premium RankSyncer login credentials have been dispatched to <strong>{modalEmail}</strong>.
                </p>
                <div className="h-1.5 w-24 bg-slate-900 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-emerald-500 rounded-full animate-[loading-bar_1.8s_linear]"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer footer */}
      <footer className="border-t border-emerald-950/40 py-6 px-6 bg-[#030806] text-center text-[11px] text-slate-550 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© 2026 RankSyncer Inc. All rights reserved. Built on Gemini-3.5 models.</span>
        <div className="flex items-center gap-4">
          <button onClick={onBackToLanding} className="hover:text-slate-300">Outrank Landing</button>
          <button onClick={onPricingClick} className="hover:text-slate-300">Pricing Matrix</button>
          <button onClick={onLaunchApp} className="hover:text-slate-300">Integrations Workspace</button>
        </div>
      </footer>
    </div>
  );
}
