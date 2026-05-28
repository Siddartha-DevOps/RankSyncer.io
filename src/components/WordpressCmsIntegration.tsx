import React, { useState, useEffect } from "react";
import { 
  Globe, 
  Lock, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  FileText, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Workflow, 
  Activity, 
  UserCheck,
  ChevronRight,
  TrendingUp,
  Sliders,
  Settings,
  Link2
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface WordpressCmsIntegrationProps {
  projectId: string;
  userId?: string;
  activePlan: "free" | "premium";
  onLogAdded?: (log: any) => void;
}

interface WordpressSite {
  id: string;
  wordpress_site_id: string;
  wordpress_site_url: string;
  wordpress_site_name: string;
  created_at: string;
  is_active: boolean;
}

interface WordpressPublishLog {
  id: string;
  article_id: string;
  wordpress_site_id: string;
  wordpress_post_id?: string;
  publish_status: "success" | "failed";
  publish_error?: string;
  latency_ms: number;
  published_url?: string;
  created_at: string;
}

interface WordpressPublishQueueItem {
  id: string;
  article_id: string;
  wordpress_site_id: string;
  scheduled_publish_time: string;
  publish_status: "pending" | "processing" | "success" | "failed";
  publish_error?: string;
  attempt_count: number;
  created_at: string;
}

interface AnalyticsStats {
  totalPublishes: number;
  successfulPublishes: number;
  failedPublishes: number;
  scheduledPublishes: number;
  connectionHealth: number;
  activeBlogsCount: number;
}

interface DayPublishStat {
  day: string;
  Publishes: number;
}

export const WordpressCmsIntegration: React.FC<WordpressCmsIntegrationProps> = ({ 
  projectId, 
  userId = "anonymous", 
  activePlan,
  onLogAdded
}) => {
  // States
  const [connectedSites, setConnectedSites] = useState<WordpressSite[]>([]);
  const [publishLogs, setPublishLogs] = useState<WordpressPublishLog[]>([]);
  const [publishQueue, setPublishQueue] = useState<WordpressPublishQueueItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsStats>({
    totalPublishes: 0,
    successfulPublishes: 0,
    failedPublishes: 0,
    scheduledPublishes: 0,
    connectionHealth: 100,
    activeBlogsCount: 0
  });
  const [chartData, setChartData] = useState<DayPublishStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Connection Custom input fields (for sandboxed / simulation or custom endpoints verification)
  const [customSiteUrl, setCustomSiteUrl] = useState("");
  const [customSiteName, setCustomSiteName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Load WordPress.com connection metrics
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch connected blogs
      const resSites = await fetch(`/api/cms/wordpress/integrations?projectId=${projectId}`);
      if (resSites.ok) {
        const data = await resSites.json();
        setConnectedSites(data.integrations || []);
      }

      // 2. Fetch publication log records
      const resLogs = await fetch(`/api/cms/wordpress/logs?projectId=${projectId}`);
      if (resLogs.ok) {
        const data = await resLogs.json();
        setPublishLogs(data.logs || []);
      }

      // 3. Fetch schedules list queue
      const resQueue = await fetch(`/api/cms/wordpress/queue?projectId=${projectId}`);
      if (resQueue.ok) {
        const data = await resQueue.json();
        setPublishQueue(data.queue || []);
      }

      // 4. Fetch daily charts and health metrics KPI stats
      const resAnalytics = await fetch("/api/cms/wordpress/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        if (data.success) {
          setAnalytics(data.stats);
          setChartData(data.chartData);
        }
      }

    } catch (err) {
      console.error("Failed reloading WordPress.com dashboards:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Initiate real WordPress.com OAuth link
  const handleConnectOAuth = async () => {
    setIsConnecting(true);
    setMessage(null);
    try {
      if (activePlan === "free" && connectedSites.length >= 1) {
        throw new Error("RankSyncer Free Plan limits to 1 active WordPress.com blog connection. Upgrade to Pro for multi-site publishing support!");
      }

      const res = await fetch(`/api/auth/wordpress/url?projectId=${projectId}&userId=${userId}`);
      if (!res.ok) {
        throw new Error("Unable to initialize Oauth redirect pathway with local agent server.");
      }
      
      const data = await res.json();
      if (data.success && data.url) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.url, 
          "wordpress_oauth_link", 
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
        );

        const handleAuthMessage = (event: MessageEvent) => {
          if (event.data && event.data.type === "WORDPRESS_COM_AUTH_SUCCESS") {
            setMessage({ type: "success", text: "WordPress.com account linked and synced successfully!" });
            loadData();
            
            if (onLogAdded) {
              onLogAdded({
                id: `wp-integ-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: "success",
                message: "Integrated and authorized WordPress.com host site. Sites indexed successfully.",
                module: "CMS_PUBLISH"
              });
            }
            window.removeEventListener("message", handleAuthMessage);
          }
        };

        window.addEventListener("message", handleAuthMessage);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed running Authorization redirects." });
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect via fast Simulation connector (Super friendly bypass if they don't have OAuth assets)
  const handleConnectSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setMessage(null);

    const siteUrl = customSiteUrl.trim() || "mytechblog.wordpress.com";
    const siteName = customSiteName.trim() || "Tech Authority SEO Hub";

    try {
      if (activePlan === "free" && connectedSites.length >= 1) {
        throw new Error("RankSyncer Free Plan limits to 1 active WordPress.com blog connection. Upgrade to Premium for multi-site publishing support!");
      }

      const response = await fetch("/api/cms/wordpress/connect-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userId,
          siteUrl,
          siteName,
          siteId: `mock-wp-${Math.floor(Math.random() * 100000) + 100}`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Sandbox linker rejected credentials.");
      }

      setMessage({ type: "success", text: data.message || "Created simulated Sandbox Blog!" });
      setCustomSiteUrl("");
      setCustomSiteName("");
      loadData();

      if (onLogAdded) {
        onLogAdded({
          id: `wp-sandbox-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "success",
          message: `Linked Sandbox WordPress.com Blog [${siteUrl}] for UI demonstration and publishing trials.`,
          module: "CMS_PUBLISH"
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Bypassed connection aborted." });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect connected WordPress blog
  const handleDisconnect = async (siteId: string) => {
    try {
      const response = await fetch("/api/cms/wordpress/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, wordpressSiteId: siteId })
      });
      if (response.ok) {
        loadData();
        setMessage({ type: "success", text: "WordPress.com site disconnected successfully." });
      }
    } catch (err) {
      console.error("WordPress site disconnect execution error:", err);
    }
  };

  // Cancel scheduled post
  const handleCancelQueueItem = async (itemId: string) => {
    try {
      const response = await fetch("/api/cms/wordpress/cancel-scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId })
      });
      if (response.ok) {
        loadData();
        setMessage({ type: "success", text: "Automated scheduled release aborted." });
      }
    } catch (err) {
      console.error("Queue item cancel exception:", err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header section panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs select-none">W</span>
            Native WordPress.com Hosted Publishing Dashboard
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Connect your WordPress.com accounts, manage multi-site synchronization catalogs, deploy scheduled autopilot publication pipelines, and review performance KPIs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activePlan === "free" ? (
            <span className="bg-amber-100 text-amber-801 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
              <Sparkles className="h-3 w-3 text-amber-600 animate-pulse" />
              Free Sandbox Trials
            </span>
          ) : (
            <span className="bg-indigo-100 text-indigo-900 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
              <CheckCircle2 className="h-3 w-3 text-indigo-600" />
              Pro Premium Autopilot Sync
            </span>
          )}
          <button 
            type="button" 
            onClick={loadData}
            className="p-1 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Portal
          </button>
        </div>
      </div>

      {/* Analytics KPI Block widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
          <span className="block text-[10px] uppercase tracking-wider font-black text-slate-400">Total Deployments</span>
          <span className="text-xl font-black text-slate-800">{analytics.totalPublishes} posts</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
          <span className="block text-[10px] uppercase tracking-wider font-black text-slate-400">Successful</span>
          <span className="text-xl font-black text-emerald-600">{analytics.successfulPublishes} hits</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
          <span className="block text-[10px] uppercase tracking-wider font-black text-slate-400">Failed Retries</span>
          <span className={`text-xl font-black ${analytics.failedPublishes > 0 ? "text-rose-600" : "text-slate-800"}`}>
            {analytics.failedPublishes}
          </span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
          <span className="block text-[10px] uppercase tracking-wider font-black text-slate-400">Autopilot Queue</span>
          <span className="text-xl font-black text-indigo-700">{analytics.scheduledPublishes} pending</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 col-span-2 lg:col-span-1">
          <span className="block text-[10px] uppercase tracking-wider font-black text-slate-400">Sync Health Rating</span>
          <span className="text-xl font-black text-blue-600">{analytics.connectionHealth}% Health</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Connecting Panel & Active Connected Site list */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Link Connection form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-indigo-600" />
                Establish Integration Node
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Connect your hosted WordPress.com dashboard to enable direct syndication. Select Sandbox trial mode to instant-test features!
              </p>
            </div>

            {/* Sandbox switcher */}
            <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/70 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-indigo-950 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                  Sandbox Trial Simulator
                </span>
                <span className="block text-[10px] text-slate-500">Demo the syndication loops without live keys</span>
              </div>
              <input 
                type="checkbox" 
                checked={isSandboxMode} 
                onChange={(e) => {
                  setIsSandboxMode(e.target.checked);
                  if (e.target.checked) {
                    setCustomSiteUrl("sandbox-authority.wordpress.com");
                    setCustomSiteName("SEO Authority Sandbox");
                  } else {
                    setCustomSiteUrl("");
                    setCustomSiteName("");
                  }
                }}
                className="rounded border-slate-300 cursor-pointer h-4 w-4 text-indigo-600 focus:ring-indigo-550"
              />
            </div>

            {isSandboxMode ? (
              /* Simulated login inputs */
              <form onSubmit={handleConnectSandbox} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Simulated Blog URL</label>
                  <input 
                    type="text" 
                    placeholder="sandbox-authority.wordpress.com" 
                    value={customSiteUrl}
                    onChange={(e) => setCustomSiteUrl(e.target.value)}
                    className="bg-slate-50 focus:bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Simulated Blog Name</label>
                  <input 
                    type="text" 
                    placeholder="My SEO Blog" 
                    value={customSiteName}
                    onChange={(e) => setCustomSiteName(e.target.value)}
                    className="bg-slate-50 focus:bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isConnecting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 outline-none"
                >
                  <Workflow className="h-4 w-4" />
                  <span>Connect Sandbox Site</span>
                </button>
              </form>
            ) : (
              /* Official OAuth linking */
              <div className="space-y-3">
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl leading-relaxed">
                  Click below to open the safe WordPress.com single-sign-on OAuth screen. Approve RankSyncer to enable automated article syncing.
                </p>

                <button 
                  type="button"
                  onClick={handleConnectOAuth}
                  disabled={isConnecting}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 outline-none shadow-sm disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Negotiating Authentication...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4.5 w-4.5 text-blue-400" />
                      <span>Connect via WordPress OAuth</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-800 border border-rose-100"}`}>
                {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="h-4 w-4 shrink-0 text-rose-600" />}
                <span>{message.text}</span>
              </div>
            )}
          </div>

          {/* Active blogs list selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Synced Blogs ({connectedSites.length})
            </h4>

            {connectedSites.length === 0 ? (
              <div className="text-center py-6 text-slate-400 border border-dashed border-slate-150 rounded-xl space-y-2">
                <Globe className="h-8 w-8 mx-auto stroke-1" />
                <span className="block text-xs font-medium">No integrated blogs currently map this project yet.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {connectedSites.map(site => (
                  <div key={site.id} className="p-3 border border-slate-100 hover:border-slate-205 rounded-xl flex items-center justify-between gap-2 transition bg-slate-50/50">
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-slate-800 truncate">{site.wordpress_site_name}</span>
                      <a href={site.wordpress_site_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 truncate">
                        <span>{site.wordpress_site_url}</span>
                        <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                      </a>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleDisconnect(site.wordpress_site_id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Disconnect site from project"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: charts, schedules list and publish logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* KPI Area Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3.5">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Daily Syndication Frequency Chart
                </h4>
                <p className="text-[10px] text-slate-400">Total publishes pushed to WordPress.com blogs recently.</p>
              </div>
            </div>
            
            <div className="h-40 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wpColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#94a3b8" }} stroke="#cbd5e1" tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} stroke="#cbd5e1" tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                    <Area type="monotone" dataKey="Publishes" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#wpColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  No publication data available to render charts.
                </div>
              )}
            </div>
          </div>

          {/* Autopilot publish Scheduler queue tasks list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Automated Autopilot Scheduler Queue ({publishQueue.length})
            </h4>

            {publishQueue.length === 0 ? (
              <div className="text-center py-5 text-slate-400 border border-dashed border-slate-150 rounded-xl">
                <Clock className="h-6 w-6 mx-auto stroke-1 text-slate-300 mb-1" />
                <span className="block text-[11px] font-medium">No release jobs pending in autopilot queues.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {publishQueue.map(item => (
                  <div key={item.id} className="p-3 border border-slate-100 rounded-xl flex sm:items-center justify-between gap-4 transition bg-slate-50/20">
                    <div className="space-y-1">
                      <span className="text-xs font-black text-slate-800 block">Article ID: {item.article_id.slice(-8).toUpperCase()}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                        <Clock className="h-3 w-3 text-indigo-500" />
                        Triggers: {new Date(item.scheduled_publish_time).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">
                        {item.publish_status}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleCancelQueueItem(item.id)}
                        className="p-1 px-2.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-100 text-slate-400 hover:text-rose-600 text-[10px] font-bold rounded-lg transition shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial Sync publication logs status registry */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3.5">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-emerald-500" />
              Syndication Status Registry Logs
            </h4>

            {publishLogs.length === 0 ? (
              <div className="text-center py-6 text-slate-400 border border-dashed border-slate-150 rounded-xl">
                <FileText className="h-8 w-8 mx-auto stroke-1" />
                <span className="block text-xs font-medium">No published post logs recorded yet.</span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {publishLogs.map(log => (
                  <div key={log.id} className="p-3 border border-slate-100 rounded-xl text-xs space-y-2 bg-slate-50/10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-700 block text-[11px]">
                          Syndication Job ID: {log.id.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          Target Blog ID: {log.wordpress_site_id}
                        </span>
                      </div>
                      <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5 ${log.publish_status === "success" ? "bg-emerald-100 text-emerald-805" : "bg-rose-100 text-rose-805"}`}>
                        {log.publish_status === "success" ? (
                          <>
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Success
                          </>
                        ) : (
                          <>
                            <XCircle className="h-2.5 w-2.5" />
                            Failed
                          </>
                        )}
                      </span>
                    </div>

                    {log.published_url && (
                      <a 
                        href={log.published_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center gap-0.5 break-all"
                      >
                        <span>{log.published_url}</span>
                        <ExternalLink className="h-2.5 w-2.5 stroke-2" />
                      </a>
                    )}

                    {log.publish_error && (
                      <div className="text-[10px] text-rose-600 bg-rose-50/50 p-2 border border-rose-100 rounded-lg font-mono">
                        {log.publish_error}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-50 pt-2 font-mono">
                      <span>Deployment Latency: {log.latency_ms} ms</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
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
