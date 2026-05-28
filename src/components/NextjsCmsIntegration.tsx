import React, { useState, useEffect } from "react";
import { 
  Github, 
  GitBranch, 
  FolderGit2, 
  Globe, 
  Lock, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  FileCode, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  BarChart3, 
  Settings, 
  Link2, 
  Send,
  Eye,
  Info
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface NextjsCmsIntegrationProps {
  projectId: string;
  userId?: string;
  activePlan: "free" | "premium";
  onLogAdded?: (log: any) => void;
}

interface NextjsIntegration {
  id: string;
  repository_name: string;
  repository_id: string;
  target_branch: string;
  content_folder: string;
  output_format: "markdown" | "mdx";
  routing_style: "app" | "pages";
  vercel_webhook_url?: string;
  blog_site_url?: string;
  created_at: string;
  is_active: boolean;
}

interface NextjsPublishLog {
  id: string;
  article_id: string;
  repository_name: string;
  commit_sha?: string;
  publish_status: "success" | "failed";
  deployment_status: "pending" | "deploying" | "built" | "failed";
  publish_error?: string;
  latency_ms: number;
  published_url?: string;
  commit_message?: string;
  created_at: string;
}

interface NextjsPublishQueueItem {
  id: string;
  article_id: string;
  repository_name: string;
  scheduled_publish_time: string;
  publish_status: "pending" | "processing" | "success" | "failed";
  deployment_status: "pending" | "deploying" | "built" | "failed";
  publish_error?: string;
  attempt_count: number;
  created_at: string;
}

interface GitHubRepo {
  id: string;
  name: string;
  default_branch: string;
}

interface GitHubBranch {
  name: string;
}

export const NextjsCmsIntegration: React.FC<NextjsCmsIntegrationProps> = ({ 
  projectId, 
  userId = "anonymous", 
  activePlan,
  onLogAdded
}) => {
  // Connection Configuration Input States
  const [githubToken, setGithubToken] = useState("");
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("main");
  const [contentFolder, setContentFolder] = useState("posts");
  const [outputFormat, setOutputFormat] = useState<"markdown" | "mdx">("mdx");
  const [routingStyle, setRoutingStyle] = useState<"app" | "pages">("app");
  const [vercelWebhookUrl, setVercelWebhookUrl] = useState("");
  const [blogSiteUrl, setBlogSiteUrl] = useState("");
  
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Loaded integrations state
  const [integrations, setIntegrations] = useState<NextjsIntegration[]>([]);
  const [publishLogs, setPublishLogs] = useState<NextjsPublishLog[]>([]);
  const [publishQueue, setPublishQueue] = useState<NextjsPublishQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic GitHub listings
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [isLoadingRepos, setIsLoadingLoadingRepos] = useState(false);
  const [isLoadingBranches, setIsLoadingLoadingBranches] = useState(false);

  // Analytics Stats
  const [stats, setStats] = useState({
    totalPublishes: 0,
    successfulPublishes: 0,
    failedPublishes: 0,
    scheduledPublishes: 0,
    connectionHealth: 0,
    activeBlogsCount: 0
  });
  const [chartData, setChartData] = useState<{ day: string; Publishes: number }[]>([]);

  // Toggle Advanced settings form drawer
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load Integration Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Integrations
      const resInteg = await fetch(`/api/cms/nextjs/integrations?projectId=${projectId}`);
      if (resInteg.ok) {
        const data = await resInteg.json();
        setIntegrations(data.integrations || []);
      }

      // 2. Fetch logs
      const resLogs = await fetch(`/api/cms/nextjs/logs?projectId=${projectId}`);
      if (resLogs.ok) {
        const data = await resLogs.json();
        setPublishLogs(data.logs || []);
      }

      // 3. Fetch queue
      const resQueue = await fetch(`/api/cms/nextjs/queue?projectId=${projectId}`);
      if (resQueue.ok) {
        const data = await resQueue.json();
        setPublishQueue(data.queue || []);
      }

      // 4. Fetch Analytics
      const resAnalytics = await fetch(`/api/cms/nextjs/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setStats(data.stats || stats);
        setChartData(data.chartData || []);
      }

    } catch (err) {
      console.error("Failed loading Nextjs CMS datasets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Load GitHub Repos dynamically on Token input (PAT token or sandbox mock override)
  const fetchGithubRepos = async (tokenValue: string, sandbox: boolean) => {
    if (!sandbox && tokenValue.length < 15) return;
    setIsLoadingLoadingRepos(true);
    try {
      const response = await fetch("/api/cms/nextjs/github-repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubToken: tokenValue, isSandbox: sandbox })
      });
      if (response.ok) {
        const data = await response.json();
        setRepos(data.repos || []);
      }
    } catch (err) {
      console.error("Failed fetching GitHub repositories list:", err);
    } finally {
      setIsLoadingLoadingRepos(false);
    }
  };

  // Load Branches list dynamically once selectedRepo changes
  const fetchGithubBranches = async (repoName: string) => {
    if (!repoName) return;
    setIsLoadingLoadingBranches(true);
    try {
      const response = await fetch("/api/cms/nextjs/github-branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          githubToken: isSandboxMode ? "mock-github-token" : githubToken, 
          repositoryName: repoName, 
          isSandbox: isSandboxMode 
        })
      });
      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
        if (data.branches && data.branches.length > 0) {
          // Auto select first branch
          setSelectedBranch(data.branches[0].name);
        }
      }
    } catch (err) {
      console.error("Failed fetching GitHub branches list:", err);
    } finally {
      setIsLoadingLoadingBranches(false);
    }
  };

  // Connect Next.js repository
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo) {
      setMessage({ type: "error", text: "Please select a target GitHub repository first." });
      return;
    }
    if (!isSandboxMode && !githubToken) {
      setMessage({ type: "error", text: "Please enter your private GitHub Personal Access Token first." });
      return;
    }

    setIsConnecting(true);
    setMessage(null);

    try {
      // Free limit enforcement
      if (activePlan === "free" && integrations.length >= 1) {
        throw new Error("RankSyncer Free Plan is restricted to 1 connected Next.js blog. Upgrade to Pro Premium for multi-repository sync targets!");
      }

      const payload = {
        projectId,
        userId,
        githubToken: isSandboxMode ? "mock-github-token" : githubToken,
        repositoryName: selectedRepo,
        targetBranch: selectedBranch,
        contentFolder: contentFolder,
        outputFormat: outputFormat,
        routingStyle: routingStyle,
        vercelWebhookUrl: vercelWebhookUrl || undefined,
        blogSiteUrl: blogSiteUrl || undefined,
        isSandbox: isSandboxMode
      };

      const response = await fetch("/api/cms/nextjs/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed linking repository credentials.");
      }

      setMessage({ type: "success", text: data.message || "Connected Next.js repo starter code base successfully!" });
      setGithubToken("");
      setSelectedRepo("");
      loadData();

      if (onLogAdded) {
        onLogAdded({
          id: `nx-con-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "success",
          message: `Connected Next.js Headless CMS: Linked Git target ${payload.repositoryName} (${payload.targetBranch}) for content synchronization.`,
          module: "CMS_NEXTJS"
        });
      }

    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Coordinate authentication pipeline rejected request." });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect repository
  const handleDisconnect = async (repoName: string) => {
    try {
      const response = await fetch("/api/cms/nextjs/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, repositoryName: repoName })
      });
      if (response.ok) {
        loadData();
        setMessage({ type: "success", text: `Repository ${repoName} disconnected successfully.` });
      }
    } catch (err) {
      console.error("Disconnect rejected:", err);
    }
  };

  // Cancel scheduled post
  const handleCancelScheduled = async (itemId: string) => {
    try {
      const response = await fetch("/api/cms/nextjs/cancel-scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId })
      });
      if (response.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Failed canceling scheduler job:", err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title section styling */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Github className="h-5 w-5 text-slate-800 animate-pulse" />
            Next.js Blog Starter Sync Hub
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Publish, schedule, and continuously auto-sync SEO content straight into your Next.js starter repository as Markdown or MDX flat-files.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activePlan === "free" ? (
            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-655" />
              Free Plan (1 Repo limit)
            </span>
          ) : (
            <span className="bg-blue-100 text-blue-800 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-blue-600" />
              Enterprise Unlimited
            </span>
          )}
          <button 
            type="button" 
            onClick={loadData}
            className="p-1 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 text-[11px] font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics KPI section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
          <span className="block text-[10px] font-bold uppercase text-slate-400">Total Publications</span>
          <span className="block text-2xl font-black text-slate-800">{stats.totalPublishes}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
          <span className="block text-[10px] font-bold uppercase text-slate-400">Successful Syncs</span>
          <span className="block text-2xl font-black text-emerald-600">{stats.successfulPublishes}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
          <span className="block text-[10px] font-bold uppercase text-slate-400">Pending Schedules</span>
          <span className="block text-2xl font-black text-amber-600">{stats.scheduledPublishes}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
          <span className="block text-[10px] font-bold uppercase text-slate-400">Connection Health</span>
          <span className="block text-2xl font-black text-slate-800 flex items-center gap-1.5">
            <span className={`h-3.5 w-3.5 rounded-full inline-block ${stats.connectionHealth > 80 ? "bg-emerald-500 animate-pulse" : stats.connectionHealth > 30 ? "bg-yellow-500" : "bg-slate-300"}`} />
            {stats.connectionHealth}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Connection Form (1 Col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Next.js Git Link Terminal
              </h4>
              <p className="text-slate-400 text-[10px] mt-0.5 leading-normal">
                Symmetrically encrypted keys store on database servers to automate headless publishing.
              </p>
            </div>

            <form onSubmit={handleConnect} className="space-y-3.5">
              {/* Optional Sandbox Selector Toggle */}
              <div className="bg-slate-50/75 p-3 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                    Interactive Sandbox
                  </span>
                  <span className="block text-[9.5px] text-slate-400">Perform direct mock pushes for demo</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={isSandboxMode} 
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsSandboxMode(checked);
                    if (checked) {
                      setGithubToken("ghp_mock_personal_access_token_ranksyncer_placeholder");
                      fetchGithubRepos("ghp_mock_personal_access_token_ranksyncer_placeholder", true);
                    } else {
                      setGithubToken("");
                      setRepos([]);
                      setSelectedRepo("");
                    }
                  }} 
                  className="rounded border-slate-200 cursor-pointer h-4 w-4 text-slate-900 focus:ring-slate-900" 
                />
              </div>

              {/* GitHub PAT Access token input block */}
              {!isSandboxMode && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center justify-between">
                    <span>GitHub Personal Access Token (PAT)</span>
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5">
                      Get Token
                      <ExternalLink className="h-2 w-2" />
                    </a>
                  </label>
                  <input 
                    type="password" 
                    placeholder="e.g. ghp_Lz0p62... (Requires repo write permission)" 
                    value={githubToken}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGithubToken(val);
                      fetchGithubRepos(val, false);
                    }}
                    className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-slate-500 w-full font-mono text-[11px]"
                  />
                </div>
              )}

              {/* Repos selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <span>Target GitHub Repository</span>
                  {isLoadingRepos && <span className="animate-spin h-3 w-3 border border-slate-400 border-t-transparent rounded-full" />}
                </label>
                <select 
                  value={selectedRepo}
                  onChange={(e) => {
                    setSelectedRepo(e.target.value);
                    fetchGithubBranches(e.target.value);
                  }}
                  className="bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-slate-500 w-full font-extrabold text-slate-800 cursor-pointer"
                >
                  <option value="">-- Choose Repository --</option>
                  {repos.map(r => (
                    <option key={r.id} value={r.name}>{r.name} (default: {r.default_branch})</option>
                  ))}
                </select>
                {repos.length === 0 && (
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    {isSandboxMode ? "Initializing default repositories..." : "Provide active repository write token above to query codebase projects."}
                  </p>
                )}
              </div>

              {/* Branch Selector */}
              {selectedRepo && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1">
                    <span>Target Deployment Branch</span>
                    {isLoadingBranches && <span className="animate-spin h-3 w-3 border border-slate-400 border-t-transparent rounded-full" />}
                  </label>
                  <select 
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-slate-500 w-full font-extrabold text-slate-800 cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Primary file configs toggle */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 font-sans">
                <span className="block text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Sync Directory parameters</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8.5px] font-black uppercase text-slate-400">Content Directory</label>
                    <input 
                      type="text"
                      value={contentFolder}
                      onChange={(e) => setContentFolder(e.target.value)}
                      placeholder="e.g. posts"
                      className="bg-white border border-slate-200 text-[11px] p-2 rounded-lg outline-none w-full font-mono text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[8.5px] font-black uppercase text-slate-400">File Output Format</label>
                    <select
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value as any)}
                      className="bg-white border border-slate-200 text-[11px] p-2 rounded-lg outline-none w-full font-bold text-slate-755 cursor-pointer"
                    >
                      <option value="mdx">MDX Content</option>
                      <option value="markdown">Markdown (.md)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8.5px] font-black uppercase text-slate-400">Blog Routing style</label>
                    <select
                      value={routingStyle}
                      onChange={(e) => setRoutingStyle(e.target.value as any)}
                      className="bg-white border border-slate-200 text-[11px] p-2 rounded-lg outline-none w-full font-bold text-slate-755 cursor-pointer"
                    >
                      <option value="app">App Router (posts/)</option>
                      <option value="pages">Pages Router (blog/)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Advanced vercel / redeployment Webhook toggler */}
              <div className="border-t border-slate-100 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-black text-slate-650 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5" />
                  {showAdvanced ? "Hide" : "Show"} Production Server Webhooks ID
                </button>

                {showAdvanced && (
                  <div className="mt-3 space-y-2.5 animate-slide-up bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Vercel Deploy Webhook URL (Redeploy triggers)</label>
                      <input 
                        type="text" 
                        placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                        value={vercelWebhookUrl}
                        onChange={(e) => setVercelWebhookUrl(e.target.value)}
                        className="bg-white border border-slate-200 text-xs p-2 rounded-lg outline-none focus:ring-1 focus:ring-slate-500 w-full font-mono text-[10px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Blog Domain URL (Overrides calculated site links)</label>
                      <input 
                        type="text" 
                        placeholder="https://myblog.com"
                        value={blogSiteUrl}
                        onChange={(e) => setBlogSiteUrl(e.target.value)}
                        className="bg-white border border-slate-200 text-xs p-2 rounded-lg outline-none focus:ring-1 focus:ring-slate-500 w-full font-mono text-[10px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-800 border border-rose-100"}`}>
                  {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-600" />}
                  <span>{message.text}</span>
                </div>
              )}

              <button 
                type="submit"
                disabled={isConnecting}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isConnecting ? (
                  <>
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Deploying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Link Code Repo Directory</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active lists */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Connected Codebases</h4>
            {integrations.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs bg-slate-50 border border-dashed rounded-xl border-slate-200">
                No connected Next.js repositories yet.
              </div>
            ) : (
              <div className="space-y-2">
                {integrations.map(site => (
                  <div key={site.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-extrabold text-slate-800 truncate">{site.repository_name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 block font-mono pl-3.5">
                        Branch: {site.target_branch} | Format: {site.output_format.toUpperCase()}
                      </p>
                      <p className="text-[10px] text-slate-400 block font-mono pl-3.5">
                        Folder: /{site.content_folder} | Style: {site.routing_style}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDisconnect(site.repository_name)}
                      className="p-1 px-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-lg cursor-pointer transition"
                      title="Disconnect Repo Node"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sync logs and Queued schedule management tabs (2 Col) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Synchronisation activity graph panel */}
          {chartData.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-slate-700" />
                7-Day Repository Sync Activity Index
              </h4>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="Publishes" stroke="#000000" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Scheduled release queue panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#000000]" />
                Auto Code Deploy Queue ({publishQueue.length})
              </h4>
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Daemon Worker Status: Synchronized
              </span>
            </div>

            {publishQueue.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/25 rounded-2xl border border-slate-200">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                No scheduled articles in Next.js code queue
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
                {publishQueue.map(item => (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">Article #{item.article_id.slice(-6).toUpperCase()}</span>
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded ${
                          item.publish_status === "pending" ? "bg-amber-100 text-amber-800" :
                          item.publish_status === "processing" ? "bg-blue-100 text-blue-800" :
                          item.publish_status === "success" ? "bg-emerald-100 text-emerald-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {item.publish_status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        Repo: <span className="text-slate-700 font-mono select-all font-bold">{item.repository_name}</span>
                      </p>
                      <p className="text-[9px] text-[#000000] font-extrabold flex items-center gap-1">
                        Deployment Trigger: {new Date(item.scheduled_publish_time).toLocaleString()}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleCancelScheduled(item.id)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black rounded-lg transition"
                    >
                      Delete Job
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync success/failure logs widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <FileCode className="h-4 w-4 text-slate-800" />
              Repository Sync Diagnostics & Deployment Logs ({publishLogs.length})
            </h4>

            {publishLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/25 rounded-2xl border border-slate-200">
                <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                No synchronization logs registered in current codebase projects.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {publishLogs.map(log => (
                  <div key={log.id} className="py-3 items-start flex justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2 h-2 w-2 rounded-full ${log.publish_status === "success" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        <span className="text-xs font-bold text-slate-800 truncate">Transaction #{log.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      
                      {log.publish_status === "success" ? (
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-600 leading-normal">
                            Successfully committed Article #{log.article_id.slice(-5).toUpperCase()} natively to repository. 
                            Commit SHA: <span className="font-mono text-slate-500 text-[10px] select-all bg-slate-50 border p-0.5 rounded px-1">{log.commit_sha}</span>
                          </p>
                          {log.commit_message && (
                            <p className="text-[10px] text-slate-400 italic font-mono pl-2 border-l border-slate-200">
                              "{log.commit_message}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-rose-700 bg-rose-50/50 p-2 rounded-lg border border-rose-100 font-semibold leading-relaxed">
                          ⚠️ Deploy Error: {log.publish_error}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[9px] font-bold">Latency: {log.latency_ms}ms</span>
                        <span className="font-mono">Repository: {log.repository_name}</span>
                        {log.publish_status === "success" && (
                          <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-1 rounded text-[9px]">
                            {log.deployment_status.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {log.publish_status === "success" && log.published_url && (
                      <a 
                        href={log.published_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-[10px] font-bold shrink-0 flex items-center gap-1 transition select-none cursor-pointer"
                      >
                        inspect Link
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
