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
  Layers, 
  Sliders,
  Send
} from "lucide-react";

interface FramerCmsIntegrationProps {
  projectId: string;
  userId?: string;
  activePlan: "free" | "premium";
  onLogAdded?: (log: any) => void;
}

interface FramerSite {
  id: string;
  framer_site_id: string;
  framer_collection_id: string;
  framer_project_name?: string;
  framer_collection_name?: string;
  created_at: string;
  is_active: boolean;
}

interface FramerPublishLog {
  id: string;
  article_id: string;
  framer_site_id: string;
  cms_post_id?: string;
  publish_status: "success" | "failed";
  publish_error?: string;
  latency_ms: number;
  published_url?: string;
  created_at: string;
}

interface FramerPublishQueueItem {
  id: string;
  article_id: string;
  framer_site_id: string;
  framer_collection_id: string;
  scheduled_publish_time: string;
  publish_status: "pending" | "processing" | "success" | "failed";
  publish_error?: string;
  attempt_count: number;
  created_at: string;
}

export const FramerCmsIntegration: React.FC<FramerCmsIntegrationProps> = ({ 
  projectId, 
  userId = "anonymous", 
  activePlan,
  onLogAdded
}) => {
  // Connection Form Inputs
  const [framerSiteId, setFramerSiteId] = useState("");
  const [framerCollectionId, setFramerCollectionId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // States
  const [connectedSites, setConnectedSites] = useState<FramerSite[]>([]);
  const [publishLogs, setPublishLogs] = useState<FramerPublishLog[]>([]);
  const [publishQueue, setPublishQueue] = useState<FramerPublishQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sandbox simulation switch
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load active site integrations
      const resSites = await fetch(`/api/cms/framer/integrations?projectId=${projectId}`);
      if (resSites.ok) {
        const data = await resSites.json();
        setConnectedSites(data.integrations || []);
      }

      // 2. Load publish logs
      const resLogs = await fetch(`/api/cms/framer/logs?projectId=${projectId}`);
      if (resLogs.ok) {
        const data = await resLogs.json();
        setPublishLogs(data.logs || []);
      }

      // 3. Load scheduled queue
      const resQueue = await fetch(`/api/cms/framer/queue?projectId=${projectId}`);
      if (resQueue.ok) {
        const data = await resQueue.json();
        setPublishQueue(data.queue || []);
      }
    } catch (err) {
      console.error("Failed loading Framer CMS analytics metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Connect to Framer CMS collections using backend helper
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!framerSiteId) {
      setMessage({ type: "error", text: "Please enter your target Framer Project ID." });
      return;
    }
    if (!framerCollectionId) {
      setMessage({ type: "error", text: "Please enter your Target Collection ID." });
      return;
    }
    if (!apiToken) {
      setMessage({ type: "error", text: "Please provide a valid Workspace API Token." });
      return;
    }

    setIsConnecting(true);
    setMessage(null);

    try {
      // Free users multi-site guard
      if (activePlan === "free" && connectedSites.length >= 1) {
        throw new Error("Free Plan permits 1 connected Framer Site destination. Upgrade to Pro for unlimited multi-site CMS outputs!");
      }

      const response = await fetch("/api/cms/framer/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userId,
          siteId: isSandboxMode ? "mock-framer-site" : framerSiteId,
          collectionId: isSandboxMode ? "mock-cms-collection" : framerCollectionId,
          apiToken: isSandboxMode ? "mock-framer-api-token" : apiToken,
          isSandbox: isSandboxMode
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Credential verification failed");
      }

      setMessage({ type: "success", text: data.message || "Connected natively to Framer CMS target!" });
      setFramerSiteId("");
      setFramerCollectionId("");
      setApiToken("");
      loadData();
      
      if (onLogAdded) {
        onLogAdded({
          id: `fint-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "success",
          message: `Connected Framer CMS Site [${framerSiteId}] Collection [${framerCollectionId}] natively. Ready for automated SEO copy-paste-free syndication.`,
          module: "CMS_SYNC"
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Connection process dismissed. Check coordinates." });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect site
  const handleDisconnect = async (siteId: string) => {
    try {
      const response = await fetch("/api/cms/framer/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, framerSiteId: siteId })
      });
      if (response.ok) {
        loadData();
        setMessage({ type: "success", text: "Framer Site decoupled successfully." });
      }
    } catch (err) {
      console.error("Disconnect rejected:", err);
    }
  };

  // Cancel scheduled post
  const handleCancelScheduled = async (itemId: string) => {
    try {
      const response = await fetch("/api/cms/framer/cancel-scheduled", {
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
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs select-none">F</span>
            Premium Framer CMS Gateway
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Publish generated articles natively to your Framer Collections, matching slug values, categories, meta headers, and images automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activePlan === "free" ? (
            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-600 animate-spin" />
              Free Sandbox Limit
            </span>
          ) : (
            <span className="bg-indigo-100 text-indigo-800 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-indigo-600" />
              Pro Unlimited Access
            </span>
          )}
          <button 
            type="button" 
            onClick={loadData}
            className="p-1 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Sync Hub
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection card (1 Column) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-indigo-600" />
                Secure Framer Authorization
              </h4>
              <p className="text-slate-500 text-[11px]">
                Authentication requests occur via AES-256 decrypted REST nodes secure from visual snooping.
              </p>
            </div>

            <form onSubmit={handleConnect} className="space-y-3">
              {/* Sandbox toggle */}
              <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-indigo-900">Sandbox Trial Simulation</span>
                  <span className="block text-[10px] text-slate-500">Enable to mock deploy and test publish queue APIs</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={isSandboxMode} 
                  onChange={(e) => {
                    setIsSandboxMode(e.target.checked);
                    if (e.target.checked) {
                      setFramerSiteId("framer-mock-site-uuid");
                      setFramerCollectionId("framer-blog-collection");
                      setApiToken("mock-framer-api-token");
                    } else {
                      setFramerSiteId("");
                      setFramerCollectionId("");
                      setApiToken("");
                    }
                  }} 
                  className="rounded border-slate-200 cursor-pointer h-4 w-4 text-indigo-600 focus:ring-indigo-600" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Framer Project ID</label>
                <input 
                  type="text" 
                  disabled={isSandboxMode}
                  placeholder="e.g. 5e08b3ba-bf40-4bf7..." 
                  value={framerSiteId}
                  onChange={(e) => setFramerSiteId(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 w-full font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Target Collection ID</label>
                <input 
                  type="text" 
                  disabled={isSandboxMode}
                  placeholder="e.g. Blog, Posts or d2b1c4e7..." 
                  value={framerCollectionId}
                  onChange={(e) => setFramerCollectionId(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 w-full text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Framer Site API Token</label>
                <input 
                  type="password" 
                  disabled={isSandboxMode}
                  placeholder="Paste site/workspace token" 
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 w-full font-mono"
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
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Link Framer Portfolio</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Connected Site Catalog */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              Connected Framer Collections
            </h4>
            {connectedSites.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs bg-slate-50/50 border border-dashed rounded-xl border-slate-200 font-medium">
                No active Framer linkages in this workspace
              </div>
            ) : (
              <div className="space-y-2">
                {connectedSites.map(site => (
                  <div key={site.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-850 truncate">{site.framer_project_name || "Framer Site"}</p>
                      <p className="text-[10px] text-indigo-700 font-bold truncate">Collection: {site.framer_collection_id}</p>
                      <p className="text-[9px] text-slate-400 select-all truncate">{site.framer_site_id}</p>
                    </div>
                    <button 
                      onClick={() => handleDisconnect(site.framer_site_id)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                      title="Disconnect integration"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sync logs and Queued schedule management tabs (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scheduled release queue panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-600" />
                Framer Autopilot Release Queue ({publishQueue.length})
              </h4>
              <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Daemon Worker Running
              </span>
            </div>

            {publishQueue.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/25 rounded-2xl border border-slate-200">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                No pending scheduled publications for Framer
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
                {publishQueue.map(item => (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">Post #{item.article_id.slice(-6).toUpperCase()}</span>
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded ${
                          item.publish_status === "pending" ? "bg-amber-100 text-amber-800" :
                          item.publish_status === "processing" ? "bg-blue-100 text-blue-800" :
                          item.publish_status === "success" ? "bg-emerald-100 text-emerald-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {item.publish_status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold truncate max-w-sm">
                        Site: <span className="text-slate-700 font-mono font-bold">{item.framer_site_id}</span> | Coll: <span className="text-indigo-700 font-bold">{item.framer_collection_id}</span>
                      </p>
                      <p className="text-[9px] text-indigo-600 font-extrabold flex items-center gap-1">
                        Scheduled Release: {new Date(item.scheduled_publish_time).toLocaleString()}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleCancelScheduled(item.id)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black rounded-lg transition shrink-0 cursor-pointer"
                    >
                      Cancel Schedule
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync Success / Fail log items */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <FileText className="h-4 w-4 text-indigo-600" />
              Sync Diagnostics & Latency Metrics ({publishLogs.length})
            </h4>

            {publishLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/25 rounded-2xl border border-slate-200">
                <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                No CMS sync transaction records available for Framer
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {publishLogs.map(log => (
                  <div key={log.id} className="py-3 items-start flex justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${log.publish_status === "success" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        <span className="text-xs font-bold text-slate-850 truncate">Sync ID: #{log.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      
                      {log.publish_status === "success" ? (
                        <p className="text-[11px] text-slate-650 font-medium">
                          Synced Article #{log.article_id.slice(-5).toUpperCase()} safely to Framer CMS. Post ID: <span className="font-mono text-indigo-700 select-all font-bold">{log.cms_post_id}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-rose-700 bg-rose-50/50 p-2 rounded-lg border border-rose-100 font-semibold leading-relaxed">
                          ⚠️ Publication Rejected: {log.publish_error}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[9px] font-bold text-slate-600">Latency: {log.latency_ms}ms</span>
                        <span className="font-mono truncate max-w-xs">Site: {log.framer_site_id}</span>
                      </div>
                    </div>

                    {log.publish_status === "success" && log.published_url && (
                      <a 
                        href={log.published_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border rounded-lg text-slate-600 text-[10px] font-black shrink-0 flex items-center gap-1 cursor-pointer transition"
                      >
                        Launch
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
