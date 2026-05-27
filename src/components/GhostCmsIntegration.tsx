import React, { useState, useEffect } from "react";
import { 
  Zap, 
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
  Radio
} from "lucide-react";

interface GhostCmsIntegrationProps {
  projectId: string;
  userId?: string;
  activePlan: "free" | "premium";
  onLogAdded?: (log: any) => void;
}

interface GhostSite {
  id: string;
  ghost_site_url: string;
  site_title?: string;
  description?: string;
  connected_at: string;
  language_code?: string;
  visibility_settings?: "public" | "members" | "paid";
}

interface GhostPublishLog {
  id: string;
  article_id: string;
  ghost_site_url: string;
  cms_post_id?: string;
  publish_status: "success" | "failed";
  publish_error?: string;
  latency_ms: number;
  published_url?: string;
  created_at: string;
}

interface GhostPublishQueueItem {
  id: string;
  article_id: string;
  ghost_site_url: string;
  scheduled_publish_time: string;
  publish_status: "pending" | "processing" | "success" | "failed";
  publish_error?: string;
  attempt_count: number;
  created_at: string;
}

export const GhostCmsIntegration: React.FC<GhostCmsIntegrationProps> = ({ 
  projectId, 
  userId = "anonymous", 
  activePlan,
  onLogAdded
}) => {
  // Connection Form Inputs
  const [ghostSiteUrl, setGhostSiteUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Loaded integrations state
  const [connectedSites, setConnectedSites] = useState<GhostSite[]>([]);
  const [publishLogs, setPublishLogs] = useState<GhostPublishLog[]>([]);
  const [publishQueue, setPublishQueue] = useState<GhostPublishQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Active Sandbox mode switch helper
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Load Integration Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load active site listing
      const resSites = await fetch(`/api/cms/ghost/integrations?projectId=${projectId}`);
      if (resSites.ok) {
        const data = await resSites.json();
        setConnectedSites(data.sites || []);
      }

      // 2. Load publish logs
      const resLogs = await fetch(`/api/cms/ghost/logs?projectId=${projectId}`);
      if (resLogs.ok) {
        const data = await resLogs.json();
        setPublishLogs(data.logs || []);
      }

      // 3. Load scheduled queue
      const resQueue = await fetch(`/api/cms/ghost/queue?projectId=${projectId}`);
      if (resQueue.ok) {
        const data = await resQueue.json();
        setPublishQueue(data.queue || []);
      }
    } catch (err) {
      console.error("Failed loading Ghost CMS metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Connect to Ghost
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghostSiteUrl) {
      setMessage({ type: "error", text: "Please enter your Ghost Admin URL." });
      return;
    }
    if (!apiKey) {
      setMessage({ type: "error", text: "Please enter your Ghost Admin API Key." });
      return;
    }

    setIsConnecting(true);
    setMessage(null);

    try {
      // Billing enforcement: check limitations
      if (activePlan === "free" && connectedSites.length >= 1) {
        throw new Error("Free Plan Sandbox permits 1 connected Ghost domain. Please upgrade to Pro for multiple site integrations!");
      }

      const response = await fetch("/api/cms/ghost/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userId,
          ghostSiteUrl: isSandboxMode ? "https://mock-ghost-demo.example.com" : ghostSiteUrl,
          apiKey: isSandboxMode ? "6067cb97cb401e0001090332:7fa0eed31bc5b5dec507" : apiKey
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Credential validation failed");
      }

      setMessage({ type: "success", text: data.message || "Connected natively to Ghost CMS!" });
      setGhostSiteUrl("");
      setApiKey("");
      loadData();
      
      if (onLogAdded) {
        onLogAdded({
          id: `cr-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "success",
          message: `Connected Ghost CMS: Fully integrated domain ${ghostSiteUrl} securely. Ready for AI article auto-publishing.`,
          module: "CMS_SYNC"
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed validating API coordinates" });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from Ghost
  const handleDisconnect = async (siteUrl: string) => {
    try {
      const response = await fetch("/api/cms/ghost/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ghostSiteUrl: siteUrl })
      });
      if (response.ok) {
        loadData();
        setMessage({ type: "success", text: "Ghost Site disconnected successfully." });
      }
    } catch (err) {
      console.error("Disconnect rejected:", err);
    }
  };

  // Cancel scheduled post
  const handleCancelScheduled = async (itemId: string) => {
    try {
      const response = await fetch("/api/cms/ghost/cancel-scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId })
      });
      if (response.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Failed to cancel scheduled publish", err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#ff1a75]" />
            Native Ghost CMS Publishing Hub
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Connect your Ghost publication and publish generated articles natively using the official Admin API.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activePlan === "free" ? (
            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-600 animate-spin" />
              Free Sandbox Limit
            </span>
          ) : (
            <span className="bg-blue-100 text-blue-800 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-blue-600" />
              Pro Unlimited
            </span>
          )}
          <button 
            type="button" 
            onClick={loadData}
            className="p-1 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition flex items-center gap-1 shrink-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Sync Dashboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection card (Takes 1 Col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Connection Terminal
              </h4>
              <p className="text-slate-500 text-[11px]">
                API keys are symmetrically encrypted on server-side and never exposed to the browser clients.
              </p>
            </div>

            <form onSubmit={handleConnect} className="space-y-3">
              {/* Optional Sandbox Toggle */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-700">Client Sandbox Simulation</span>
                  <span className="block text-[10px] text-slate-400">Perform mock tests without real credentials</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={isSandboxMode} 
                  onChange={(e) => {
                    setIsSandboxMode(e.target.checked);
                    if (e.target.checked) {
                      setGhostSiteUrl("https://mock-ghost.local");
                      setApiKey("6067cb97cb401e0001090332:7fa0eed31bc5b5dec5071dfa7aa15f3df7baf501460a566cd1ec0bc3763f0d4a");
                    } else {
                      setGhostSiteUrl("");
                      setApiKey("");
                    }
                  }} 
                  className="rounded border-slate-200 cursor-pointer h-4 w-4 text-[#ff1a75] focus:ring-[#ff1a75]" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Ghost API Admin URL</label>
                <input 
                  type="text" 
                  disabled={isSandboxMode}
                  placeholder="e.g. https://my-blog.ghost.io" 
                  value={ghostSiteUrl}
                  onChange={(e) => setGhostSiteUrl(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-slate-500 w-full font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Ghost Admin API Key</label>
                <input 
                  type="password" 
                  disabled={isSandboxMode}
                  placeholder="e.g. 60cde7b...:7fa0ee..." 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-slate-500 w-full font-mono"
                />
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
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    <span>Verifying Coordinates...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize & Link Site</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Connected Sites listing */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Linked Ghost Portfolios</h4>
            {connectedSites.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs bg-slate-50/50 border border-dashed rounded-xl border-slate-200">
                No connected Ghost domains on this workspace workspace
              </div>
            ) : (
              <div className="space-y-2">
                {connectedSites.map(site => (
                  <div key={site.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-800 truncate">{site.site_title}</p>
                      <p className="text-[10px] text-slate-400 truncate select-all">{site.ghost_site_url}</p>
                    </div>
                    <button 
                      onClick={() => handleDisconnect(site.ghost_site_url)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Disconnect Site integration"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sync logs and Queued schedule management tabs (Takes 2 Col) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scheduled release queue panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#ff1a75]" />
                Auto Release Queue ({publishQueue.length})
              </h4>
              <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Timezone Aware Queue Daemon: Running
              </span>
            </div>

            {publishQueue.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/25 rounded-2xl border border-slate-200">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                No scheduled articles in automated CMS queues
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
                        Site: <span className="text-slate-700 font-mono select-all font-bold">{item.ghost_site_url}</span>
                      </p>
                      <p className="text-[9px] text-[#ff1a75] font-extrabold flex items-center gap-1">
                        Scheduled Release: {new Date(item.scheduled_publish_time).toLocaleString()}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleCancelScheduled(item.id)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-105 text-rose-700 text-[10px] font-black rounded-lg transition"
                    >
                      Cancel Schedule
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync success/failure logs widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <FileText className="h-4 w-4 text-[#ff1a75]" />
              Publish history logs & Synchronization diagnostics ({publishLogs.length})
            </h4>

            {publishLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/25 rounded-2xl border border-slate-200">
                <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                No sync diagnostic transactions available on this workspace.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {publishLogs.map(log => (
                  <div key={log.id} className="py-3 items-start flex justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2 h-2 w-2 rounded-full ${log.publish_status === "success" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        <span className="text-xs font-bold text-slate-800 truncate">Log #{log.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      
                      {log.publish_status === "success" ? (
                        <p className="text-[11px] text-slate-600">
                          Synced Article #{log.article_id.slice(-5).toUpperCase()} natively into Host. CMS ID: <span className="font-mono text-slate-500 select-all">{log.cms_post_id}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-rose-700 bg-rose-50/50 p-2 rounded-lg border border-rose-100 font-semibold leading-relaxed">
                          ⚠️ Sync Rejected: {log.publish_error}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[9px] font-bold">Latency: {log.latency_ms}ms</span>
                        <span className="font-mono">Target: {log.ghost_site_url}</span>
                      </div>
                    </div>

                    {log.publish_status === "success" && log.published_url && (
                      <a 
                        href={log.published_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border rounded-lg text-slate-600 text-[10px] font-bold shrink-0 flex items-center gap-1"
                      >
                        Review
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
