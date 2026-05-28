import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  ArrowRight,
  Database,
  Link,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Brain,
  Layers,
  Award,
  Zap,
  Trash2,
  FileSpreadsheet
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";

interface DirectorySubmissionDashboardProps {
  projectId: string;
  theme: "light" | "dark";
  activePlan: "free" | "premium";
  siteDomain?: string;
}

export default function DirectorySubmissionDashboard({
  projectId,
  theme,
  activePlan,
  siteDomain = "buycoffees.com"
}: DirectorySubmissionDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [directories, setDirectories] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    submittedCount: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    liveBacklinksCount: 0,
    totalPossibleCount: 0,
    successRate: 0
  });

  // Autofill form state
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [category, setCategory] = useState("SaaS");
  const [founderName, setFounderName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [keywords, setKeywords] = useState("");

  // Filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Notification boxes
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchDashboardInfo();
  }, [projectId]);

  const fetchDashboardInfo = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/directory/dashboard-data?projectId=${projectId}&activePlan=${activePlan}`);
      const data = await res.json();
      if (data.success) {
        setDirectories(data.directories);
        setSubmissions(data.submissions);
        setStatusLogs(data.statusLogs);
        setAnalytics(data.analytics);

        // Populate autofocus configurations
        const p = data.autofillProfile;
        if (p) {
          setCompanyName(p.company_name || "");
          setWebsiteUrl(p.website_url || "");
          setShortDesc(p.description_short || "");
          setLongDesc(p.description_long || "");
          setCategory(p.category || "SaaS");
          setFounderName(p.founder_name || "");
          setContactEmail(p.contact_email || "");
          setTwitterUrl(p.twitter_url || "");
          setLinkedinUrl(p.linkedin_url || "");
          setKeywords(p.keywords_array?.join(", ") || "");
        }
      } else {
        setErrorMessage(data.error || "Failed to load directory submission profiles.");
      }
    } catch (e) {
      setErrorMessage("Network error connecting to Directory Services.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (generateWithAi: boolean) => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload = {
        projectId,
        generateWithAi,
        profileData: {
          company_name: companyName,
          website_url: websiteUrl,
          description_short: shortDesc,
          description_long: longDesc,
          category,
          founder_name: founderName,
          contact_email: contactEmail,
          twitter_url: twitterUrl,
          linkedin_url: linkedinUrl,
          keywords_array: keywords.split(",").map(k => k.trim()).filter(Boolean)
        }
      };

      const res = await fetch("/api/directory/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(
          generateWithAi 
            ? "RankSyncer AI synthesized and optimized description parameters successfully!" 
            : "Directory profiles persistent metadata saved successfully!"
        );
        
        // Update local elements
        if (data.profile) {
          setCompanyName(data.profile.company_name);
          setWebsiteUrl(data.profile.website_url);
          setShortDesc(data.profile.description_short);
          setLongDesc(data.profile.description_long);
          setCategory(data.profile.category);
          setKeywords(data.profile.keywords_array?.join(", ") || "");
        }
        
        fetchDashboardInfo();
      } else {
        setErrorMessage(data.error || "Failed to save profile parameters.");
      }
    } catch (e) {
      setErrorMessage("Network error saving profile setup.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSingleDirectory = async (directoryId: string) => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/directory/submit-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          directoryId,
          activePlan
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message || "Directory submission processed!");
        fetchDashboardInfo();
      } else {
        setErrorMessage(data.error || "Submission trigger failed.");
      }
    } catch (e) {
      setErrorMessage("Could not connect to submission broker.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/directory/submit-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          category: selectedCategoryFilter === "All" ? "" : selectedCategoryFilter,
          activePlan
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`One-Click Bulk Campaign Executed! ${data.processedCount} directories registered successfully.`);
        fetchDashboardInfo();
      } else {
        setErrorMessage(data.error || "Bulk campaign dispatch failed.");
      }
    } catch (e) {
      setErrorMessage("Could not dispatch bulk submission campaign.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyListing = async (submissionId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/directory/verify-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Tracer robot crawler crawl complete. Result: ${data.remarks}`);
        fetchDashboardInfo();
      }
    } catch (e) {
      setErrorMessage("Listing live audit crawler failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveListing = async (submissionId: string) => {
    try {
      const res = await fetch("/api/directory/archive-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId })
      });
      if (res.ok) {
        setSuccessMessage("Listing removed.");
        fetchDashboardInfo();
      }
    } catch (e) {
      setErrorMessage("Could not untrack listing.");
    }
  };

  // List mappings matching filters
  const getSubmissionForDirectory = (dirId: string) => {
    return submissions.find(s => s.directory_id === dirId);
  };

  const filteredDirectories = directories.filter(dir => {
    // Search query matching
    const matchesSearch = 
      dir.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      dir.domain.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category matching
    const matchesCat = selectedCategoryFilter === "All" || dir.category === selectedCategoryFilter;

    // Status matching
    const sub = getSubmissionForDirectory(dir.id);
    let matchesStatus = true;
    if (selectedStatusFilter !== "All") {
      if (selectedStatusFilter === "submitted") {
        matchesStatus = !!sub && sub.submission_status === "submitted";
      } else if (selectedStatusFilter === "approved") {
        matchesStatus = !!sub && sub.approval_status === "approved";
      } else if (selectedStatusFilter === "pending") {
        matchesStatus = !!sub && sub.submission_status === "submitted" && sub.approval_status === "under_review";
      } else if (selectedStatusFilter === "rejected") {
        matchesStatus = !!sub && sub.approval_status === "rejected";
      } else if (selectedStatusFilter === "available") {
        matchesStatus = !sub;
      }
    }

    return matchesSearch && matchesCat && matchesStatus;
  });

  // Category distributions
  const barData = [
    { name: "SaaS", Count: directories.filter(d => d.category === "SaaS").length, fill: "#10b981" },
    { name: "AI Tools", Count: directories.filter(d => d.category === "AI Tools").length, fill: "#6366f1" },
    { name: "Startup", Count: directories.filter(d => d.category === "Startup").length, fill: "#3b82f6" },
    { name: "SEO & Reviews", Count: directories.filter(d => d.category === "SEO & Marketing" || d.category === "Business Review").length, fill: "#eab308" },
    { name: "Local", Count: directories.filter(d => d.category === "Local & General").length, fill: "#6b7280" }
  ];

  return (
    <div className={`p-6 rounded-3xl space-y-8 ${theme === "dark" ? "bg-[#080d0a] text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* SECTION HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-emerald-950/20 dark:border-emerald-500/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              Listing Submitter Engine
            </span>
            {activePlan === "free" ? (
              <span className="px-2.5 py-0.5 rounded text-[9px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                LITE MEMBERSHIP
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                UNLIMITED ENTERPRISE BULK
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight font-sans">
            Automated Directory Submission Service
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xl">
            Register and pitch your website automatically on top SaaS directories, startup directories, and AI listing platforms to bolster backlink crawl frequency, visibility, and Moz domain authority.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboardInfo}
            disabled={loading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer transition-all border border-slate-850"
            title="Scan Directory Status"
          >
            <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleBulkSubmit}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-black rounded-xl text-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
          >
            <Zap className="h-4 w-4 fill-current text-current shrink-0" />
            Launch One-Click Bulk Campaign
          </button>
        </div>
      </div>

      {/* CALLOUT BOXES FOR MESSAGES */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 shrink-0 animate-bounce" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ANALYTICS HIGHLIGHT METRIC ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        
        <div className="p-4 rounded-2xl bg-[#0a0f0d] border border-slate-900">
          <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Total Directories</span>
          <div className="mt-2 text-2xl font-black text-white">{analytics.totalPossibleCount}</div>
          <p className="text-[9.5px] text-slate-500 mt-1">SaaS, AI, & Startups</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f0d] border border-slate-900">
          <span className="text-[10px] text-[#4ade80] uppercase font-bold tracking-wider block">Submitted Sites</span>
          <div className="mt-2 text-2xl font-black text-white">{analytics.submittedCount}</div>
          <p className="text-[9.5px] text-slate-450 mt-1">Pending review boards</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-500/10 to-[#0c1611] border border-emerald-500/15">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-emerald-400 uppercase font-black tracking-wider">Approved Listings</span>
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{analytics.approvedCount}</div>
          <p className="text-[9.5px] text-emerald-400/80 mt-1">Success rate: {analytics.successRate}%</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f0d] border border-slate-900">
          <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Pending Review</span>
          <div className="mt-2 text-2xl font-black text-white">{analytics.pendingCount}</div>
          <p className="text-[9.5px] text-slate-500 mt-1">Awaiting verification</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a0f0d] border border-slate-900 col-span-2 md:col-span-1">
          <span className="text-[10px] text-blue-400 uppercase font-extrabold tracking-wider block">Live Backlinks</span>
          <div className="mt-2 text-2xl font-black text-white">{analytics.liveBacklinksCount}</div>
          <p className="text-[9.5px] text-slate-4.50 mt-1">Crawl bots confirmed</p>
        </div>

      </div>

      {/* CORE WORKFLOW DUAL-PANEL: AUTOFILL METADATA CONFIGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROFILE AUTOFILL FORM WITH AI PITCH GENERATOR */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-900 bg-[#0a0f0d] space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Brain className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold tracking-tight">AI Metadata Profile Auto-Fill</h3>
                <p className="text-[10.5px] text-slate-450">These parameters feed the automatic indexer robot to maximize approval likelihood.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveProfile(true)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-[10px] uppercase rounded-lg text-black transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
              title="Generate with Gemini models"
            >
              <Sparkles className="h-3 w-3" /> Optimize with AI
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Company Name</label>
              <input
                type="text"
                placeholder="My SaaS App"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Website URL</label>
              <input
                type="text"
                placeholder="https://mysite.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-slate-400 font-medium flex justify-between items-center">
                <span>Short Descriptive Pitch (1-line tagline)</span>
                <span className="text-[9px] text-[#4ade80] font-mono">Recommended &lt; 80 chars</span>
              </label>
              <input
                type="text"
                placeholder="AI-powered Rank Tracking and Semantic Link Builder circles."
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-slate-400 font-medium flex justify-between items-center">
                <span>Long Pitch / Company Description</span>
                <span className="text-[9px] text-slate-500 font-mono">Complete textual presentation</span>
              </label>
              <textarea
                placeholder="Explain what your platform is, how it functions, and why users choose it. Include relevant search keywords without spamming styles."
                value={longDesc}
                onChange={(e) => setLongDesc(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Core Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="SaaS">SaaS / Cloud Software</option>
                <option value="AI Tools">AI Developer Tools</option>
                <option value="Startup">Early-stage Startup</option>
                <option value="SEO & Marketing">SEO & Marketing Technology</option>
                <option value="Business Review">Business Listing</option>
                <option value="Local & General">Local / General Catalogue</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Keywords (comma-separated)</label>
              <input
                type="text"
                placeholder="seo, backlinks, rank tracker, blogging"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Finder / founder Name</label>
              <input
                type="text"
                placeholder="Jane Cooper"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Twitter URL</label>
              <input
                type="text"
                placeholder="https://twitter.com/mybrand"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSaveProfile(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl font-bold cursor-pointer transition-all text-xs"
            >
              Verify & Save Metadata Profile
            </button>
          </div>
        </div>

        {/* COMPREHENSIVE DIRECTORIES PROFILE GRAPH */}
        <div className="p-5 rounded-2xl border border-slate-900 bg-[#0a0f0d] flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Catalogs Classification</h3>
            <p className="text-[11px] text-slate-450 mt-1 mb-4">Quantity and target sectors distribution of indexed directories.</p>
            
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={10} width={75} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0a0f0d", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px", color: "white" }}
                  />
                  <Bar dataKey="Count" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-slate-900">
            <span className="text-[10px] font-black text-slate-450 block uppercase tracking-wide">Automatic Index Safeguard</span>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-[10.5px] text-slate-400">
              RankSyncer automatically bypasses duplicates, restricts submissions towards spam link-farms, and validates robots.txt and sitemap nodes daily.
            </div>
          </div>
        </div>

      </div>

      {/* FILTER BUTTON SEGMENTS */}
      <div className="p-4 rounded-2xl bg-[#0a0f0d] border border-slate-900 space-y-3.5">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-450 font-mono pr-2">Sector Category:</span>
            {["All", "SaaS", "AI Tools", "Startup", "SEO & Marketing"].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  selectedCategoryFilter === cat 
                    ? "bg-emerald-500 text-black font-extrabold" 
                    : "bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-850"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="w-full md:w-auto relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search directories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-56 bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

        </div>

        <div className="flex items-center gap-2 border-t border-slate-900 pt-3">
          <span className="text-[11px] text-slate-450 font-mono pr-2">Filter status:</span>
          {["All", "available", "submitted", "approved", "pending", "rejected"].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-[11px] uppercase font-bold cursor-pointer transition-all ${
                selectedStatusFilter === status 
                  ? "bg-slate-100 text-black" 
                  : "bg-slate-950 hover:bg-slate-900 text-slate-450 border border-slate-850"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* DIRECTORIES LISTING GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDirectories.length === 0 ? (
          <div className="col-span-3 text-center py-10 bg-slate-900/35 rounded-2xl p-6 border border-slate-900">
            <FolderOpen className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-300">No matching directories found</h4>
            <p className="text-slate-500 text-xs mt-1">Adjust search metrics or filters parameters above.</p>
          </div>
        ) : (
          filteredDirectories.map(dir => {
            const sub = getSubmissionForDirectory(dir.id);
            const isPremiumAlert = dir.is_premium_only && activePlan === "free";

            return (
              <div 
                key={dir.id} 
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all hover:-translate-y-0.5 ${
                  sub?.approval_status === "approved" 
                    ? "bg-gradient-to-br from-emerald-500/5 to-slate-950 border-emerald-500/20"
                    : "bg-gradient-to-b from-slate-900/40 to-slate-950 border-slate-900"
                }`}
              >
                {/* CARD BODY */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-sm text-white tracking-tight">{dir.name}</h4>
                      <a 
                        href={`https://${dir.domain}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] text-slate-450 hover:text-emerald-400 font-mono inline-flex items-center gap-0.5 mt-0.5"
                      >
                        {dir.domain} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      dir.category === "SaaS" ? "bg-emerald-500/10 text-emerald-400" :
                      dir.category === "AI Tools" ? "bg-indigo-500/10 text-indigo-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      {dir.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10.5px] py-1.5 border-t border-b border-slate-900 text-slate-450 font-mono">
                    <div>
                      <div>Authority Score: <strong className="text-white">{dir.authority_score}</strong></div>
                      <div>Difficulty: <strong className="text-white">{dir.submission_difficulty}</strong></div>
                    </div>
                    <div>
                      <div>Niche Match: <strong className="text-emerald-400">+{dir.niche_relevance}%</strong></div>
                      <div>Appr. Rate: <strong className="text-white">{dir.approval_rate}%</strong></div>
                    </div>
                  </div>

                  {/* DISPLAY SUBMISSION STATE IF TRIGGERED */}
                  {sub ? (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {sub.approval_status === "approved" ? (
                          <div className="flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>APPROVED</span>
                          </div>
                        ) : sub.approval_status === "rejected" ? (
                          <div className="flex items-center gap-1 text-rose-450 font-bold">
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>REJECTED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-400 font-medium whitespace-nowrap animate-pulse">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>PENDING VERIFY</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase">Backlink Verified</span>
                        <span className={`text-[10px] font-mono font-extrabold ${sub.backlink_status === "live" ? "text-emerald-400" : "text-slate-450"}`}>
                          {sub.backlink_status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10.5px] text-slate-450 leading-relaxed">
                      Pitch estimated referral traffic density of <strong className="text-slate-350">{dir.estimated_traffic}</strong>.
                    </p>
                  )}
                </div>

                {/* CARD ACTION BUTTONS */}
                <div className="pt-2 border-t border-slate-950 flex gap-2">
                  {isPremiumAlert ? (
                    <div className="w-full text-center p-2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9.5px] font-mono">
                      ★ Premium Membership Slot
                    </div>
                  ) : sub ? (
                    <>
                      {sub.listing_url ? (
                        <a 
                          href={sub.listing_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-center rounded text-[10.5px] text-slate-300 font-bold flex items-center justify-center gap-1 cursor-pointer border border-slate-850"
                        >
                          View Listing <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <button
                          onClick={() => handleVerifyListing(sub.id)}
                          disabled={loading}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-[10.5px] font-bold cursor-pointer transition-all border border-slate-850"
                        >
                          Crawl Status
                        </button>
                      )}

                      <button
                        onClick={() => handleArchiveListing(sub.id)}
                        className="py-1.5 px-2 bg-slate-900 hover:bg-rose-500/15 rounded text-slate-400 hover:text-rose-400 cursor-pointer border border-slate-850 transition-all"
                        title="Untrack Listing"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSubmitSingleDirectory(dir.id)}
                      disabled={loading}
                      className="w-full py-2 bg-slate-100 hover:bg-white text-black rounded-lg text-xs font-black transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                    >
                      <span>Simulate Auto-Fill & Submit</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* DETAILED AUDITING CRAWLER ROAD-LOGS */}
      <div className="p-5 rounded-2xl bg-[#0a0f0d] border border-slate-900 space-y-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight">Crawl & Indexer Daemon Audits</h3>
          <p className="text-[11px] text-slate-450 leading-relaxed mt-1">Live background submission pipeline reports & status sync loggers.</p>
        </div>

        <div className="space-y-2.5 max-h-48 overflow-y-auto font-mono text-[10px] bg-slate-950 p-3.5 rounded-xl border border-slate-900">
          {statusLogs.length === 0 ? (
            <div className="text-slate-500 text-center py-4">
              [Empty] Submit directories or save autofill parameters to trigger active telemetry events loggers.
            </div>
          ) : (
            statusLogs.map(log => {
              const severityColor = 
                log.severity === "success" ? "text-emerald-400" :
                log.severity === "warn" ? "text-amber-400" :
                "text-slate-400";
              
              return (
                <div key={log.id} className="flex items-start md:items-center justify-between border-b border-slate-900/60 pb-1.5 last:border-0 last:pb-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-1.5">
                    <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-[#4ade80] font-semibold">{log.directory_name}:</span>
                    <span className={`${severityColor}`}>{log.message}</span>
                  </div>
                  <span className="text-[9px] text-slate-600 self-end md:self-auto shrink-0 md:pl-2">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
