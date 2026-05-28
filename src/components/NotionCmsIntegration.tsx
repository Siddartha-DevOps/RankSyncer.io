import React, { useState, useEffect } from "react";
import { 
  Database, 
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
  Sliders,
  Send,
  Workflow,
  List,
  Layers,
  Activity,
  UserCheck
} from "lucide-react";

interface NotionCmsIntegrationProps {
  projectId: string;
  userId?: string;
  activePlan: "free" | "premium";
  onLogAdded?: (log: any) => void;
}

interface NotionSite {
  id: string;
  notion_workspace_name?: string;
  notion_database_name?: string;
  notion_database_id: string;
  created_at: string;
  is_active: boolean;
}

interface NotionSyncLog {
  id: string;
  article_id: string;
  notion_database_id: string;
  notion_page_id?: string;
  sync_status: "success" | "failed";
  sync_error?: string;
  latency_ms: number;
  synced_at: string;
  fields_synced: string[];
}

interface NotionSyncQueueItem {
  id: string;
  article_id: string;
  notion_database_id: string;
  scheduled_sync_time: string;
  sync_status: "pending" | "processing" | "success" | "failed";
  sync_error?: string;
  attempt_count: number;
  created_at: string;
}

export const NotionCmsIntegration: React.FC<NotionCmsIntegrationProps> = ({ 
  projectId, 
  userId = "anonymous", 
  activePlan,
  onLogAdded
}) => {
  // Connection Form Inputs
  const [databaseId, setDatabaseId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // States
  const [connectedSites, setConnectedSites] = useState<NotionSite[]>([]);
  const [syncLogs, setSyncLogs] = useState<NotionSyncLog[]>([]);
  const [syncQueue, setSyncQueue] = useState<NotionSyncQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sandbox simulation switch
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Custom metadata input placeholders
  const [customWorkspaceName, setCustomWorkspaceName] = useState("");
  const [customDatabaseName, setCustomDatabaseName] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load active database integrations
      const resSites = await fetch(`/api/cms/notion/integrations?projectId=${projectId}`);
      if (resSites.ok) {
        const data = await resSites.json();
        setConnectedSites(data.integrations || []);
      }

      // 2. Load sync logs
      const resLogs = await fetch(`/api/cms/notion/logs?projectId=${projectId}`);
      if (resLogs.ok) {
        const data = await resLogs.json();
        setSyncLogs(data.logs || []);
      }

      // 3. Load scheduled queue
      const resQueue = await fetch(`/api/cms/notion/queue?projectId=${projectId}`);
      if (resQueue.ok) {
        const data = await resQueue.json();
        setSyncQueue(data.queue || []);
      }
    } catch (err) {
      console.error("Failed loading Notion integration metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Connect to Notion CMS database using backend service
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!databaseId) {
      setMessage({ type: "error", text: "Please enter your Target Database ID." });
      return;
    }
    if (!apiToken) {
      setMessage({ type: "error", text: "Please provide a valid Notion Internal Integration Secret Token." });
      return;
    }

    setIsConnecting(true);
    setMessage(null);

    try {
      // Free users multi-database safety guard
      if (activePlan === "free" && connectedSites.length >= 1) {
        throw new Error("Free Plan limits to 1 active Notion Database sync connection. Upgrade to Pro for unlimited multi-database integrations!");
      }

      const response = await fetch("/api/cms/notion/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userId,
          databaseId: isSandboxMode ? "mock-notion-database-id" : databaseId,
          apiToken: isSandboxMode ? "mock-notion-token" : apiToken,
          isSandbox: isSandboxMode,
          workspaceName: customWorkspaceName || "Main Workspace",
          databaseName: customDatabaseName || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Workspace connection validation rejected by Notion API.");
      }

      setMessage({ type: "success", text: data.message || "Connected natively to Notion target database!" });
      setDatabaseId("");
      setApiToken("");
      setCustomWorkspaceName("");
      setCustomDatabaseName("");
      loadData();
      
      if (onLogAdded) {
        onLogAdded({
          id: `notion-int-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "success",
          message: `Natively integrated Notion Database [${data.integration?.notion_database_name || databaseId}] successfully. Ready for AI article sync syncing.`,
          module: "CMS_SYNC"
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Connection failed. Please inspect your token or database rights." });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Database
  const handleDisconnect = async (dbId: string) => {
    try {
      const response = await fetch("/api/cms/notion/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, databaseId: dbId })
      });
      if (response.ok) {
        loadData();
        setMessage({ type: "success", text: "Notion database connection detached." });
      }
    } catch (err) {
      console.error("Disconnect failed:", err);
    }
  };

  // Cancel scheduled sync queue item
  const handleCancelScheduled = async (itemId: string) => {
    try {
      const response = await fetch("/api/cms/notion/cancel-scheduled", {
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

  // Calculate high quality analytics counters
  const successfulSyncsCount = syncLogs.filter(log => log.sync_status === "success").length;
  const failedSyncsCount = syncLogs.filter(log => log.sync_status === "failed").length;
  const workspaceHealth = failedSyncsCount === 0 ? "100%" : `${Math.max(0, Math.floor(((successfulSyncsCount) / (successfulSyncsCount + failedSyncsCount)) * 100))}%`;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-4 gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs select-none">N</span>
            Premium Notion Database Sync Portal
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Map and sync generated AI articles directly to your custom Notion schemas. Automatically generates headings, body sections, bullet blocks, and metadata index properties in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activePlan === "free" ? (
            <span className="bg-amber-100 text-amber-805 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-600 animate-pulse" />
              Free Sandbox Limits
            </span>
          ) : (
            <span className="bg-indigo-150 text-indigo-900 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-indigo-600" />
              Pro Unlimited Database Sync
            </span>
          )}
          <button 
            type="button" 
            onClick={loadData}
            className="p-1 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            Sync Dashboard
          </button>
        </div>
      </div>

      {/* Analytics widgets block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
          <span className="block text-[10px] uppercase tracking-wider font-black text-slate-400">Synced to Notion</span>
          <span className="text-xl font-black text-slate-800">{successfulSyncsCount} articles</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
          <span className="block text-[10px] uppercase tracking-wider font-black text-slate-400">Failed Syncs</span>
          <span className={`text-xl font-black ${failedSyncsCount > 0 ? "text-rose-600" : "text-slate-800"}`}>{failedSyncsCount}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
          <span className="block text-[10px] uppercase tracking-wider font-black text-slate-400">Workspace Sync Health</span>
          <span className="text-xl font-black text-emerald-600">{workspaceHealth}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
          <span className="block text-[10px] uppercase tracking-wider font-black text-slate-400">Autopilot Queue</span>
          <span className="text-xl font-black text-indigo-700">{syncQueue.length} jobs pending</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Form Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-3xs space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-indigo-600" />
                Connection Configurations
              </h4>
              <p className="text-slate-500 text-[11px]">
                Create an internal integration in Notion (<a href="https://notion.so/my-integrations" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">notion.so/my-integrations</a>), copy the token, and share your Database pages with it.
              </p>
            </div>

            <form onSubmit={handleConnect} className="space-y-3">
              {/* Sandbox toggle */}
              <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-indigo-900">Sandbox Trial Simulator</span>
                  <span className="block text-[10px] text-slate-500">Tick to instant-test sync UI structures without production keys</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={isSandboxMode} 
                  onChange={(e) => {
                    setIsSandboxMode(e.target.checked);
                    if (e.target.checked) {
                      setDatabaseId("mock-database-node-id");
                      setApiToken("mock-notion-token");
                      setCustomWorkspaceName("RankSyncer Sandbox Notion");
                      setCustomDatabaseName("SaaS Article Directory");
                    } else {
                      setDatabaseId("");
                      setApiToken("");
                      setCustomWorkspaceName("");
                      setCustomDatabaseName("");
                    }
                  }} 
                  className="rounded border-slate-200 cursor-pointer h-4 w-4 text-indigo-600 focus:ring-indigo-600" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Notion Database ID</label>
                <input 
                  type="text" 
                  disabled={isSandboxMode}
                  placeholder="e.g. d3b905fce9c849cf82998a46271aee09" 
                  value={databaseId}
                  onChange={(e) => setDatabaseId(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 w-full font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Notion Internal Integration Secret API Token</label>
                <input 
                  type="password" 
                  disabled={isSandboxMode}
                  placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 w-full font-mono text-slate-800"
                />
              </div>

              <div className="border-t border-dashed border-slate-100 pt-2 space-y-2">
                <span className="block text-[9px] font-black uppercase text-indigo-900 tracking-wider">Workspace Brand Label (Optional)</span>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Workspace Label</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Marketing Notion HQ" 
                    value={customWorkspaceName}
                    onChange={(e) => setCustomWorkspaceName(e.target.value)}
                    className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-[11px] p-2 rounded-lg outline-none w-full"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Custom Database Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. AI Generated News Content" 
                    value={customDatabaseName}
                    onChange={(e) => setCustomDatabaseName(e.target.value)}
                    className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-[11px] p-2 rounded-lg outline-none w-full"
                  />
                </div>
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
                    <span>Verifying Notion Node Access...</span>
                  </>
                ) : (
                  <>
                    <Workflow className="h-4.5 w-4.5" />
                    <span>Link Notion Workspace Database</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Connected databases lists catalog */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-blue-600" />
              Active Notion Workspaces ({connectedSites.length})
            </h4>
            {connectedSites.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs bg-slate-50/50 border border-dashed rounded-xl border-slate-200 font-medium">
                No active Notion Databases configured.
              </div>
            ) : (
              <div className="space-y-2">
                {connectedSites.map(site => (
                  <div key={site.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-850 truncate">{site.notion_database_name || "Notion Directory"}</p>
                      <p className="text-[10px] text-indigo-700 font-bold truncate">Workspace Name: {site.notion_workspace_name || "Primary space"}</p>
                      <p className="text-[9px] text-slate-400 select-all font-mono truncate">{site.notion_database_id}</p>
                    </div>
                    <button 
                      onClick={() => handleDisconnect(site.notion_database_id)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                      title="Deactivate integration"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sync logs and queuing status (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Queued autopilot releases */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Notion Autopilot Sync Queue ({syncQueue.length})
              </h4>
              <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Daemon Worker Running
              </span>
            </div>

            {syncQueue.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/25 rounded-2xl border border-slate-200">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                No pending scheduled sync actions in queue
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
                {syncQueue.map(item => (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">Article #{item.article_id.slice(-6).toUpperCase()}</span>
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded ${
                          item.sync_status === "pending" ? "bg-amber-100 text-amber-850" :
                          item.sync_status === "processing" ? "bg-blue-105 text-blue-800" :
                          item.sync_status === "success" ? "bg-emerald-100 text-emerald-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          {item.sync_status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-550 truncate max-w-sm font-semibold">
                        Notion DB ID: <span className="text-indigo-700 font-mono font-bold font-semibold">{item.notion_database_id}</span>
                      </p>
                      <p className="text-[9px] text-indigo-600 font-extrabold flex items-center gap-1">
                        Scheduled Release Sync: {new Date(item.scheduled_sync_time).toLocaleString()}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleCancelScheduled(item.id)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black rounded-lg transition shrink-0 cursor-pointer"
                    >
                      Cancel Release
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync History Logs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <FileText className="h-4 w-4 text-emerald-600" />
              Real Notion Sync Transactions ({syncLogs.length})
            </h4>

            {syncLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/25 rounded-2xl border border-slate-200">
                <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                No Notion transactional records on file
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {syncLogs.map(log => (
                  <div key={log.id} className="py-3 items-start flex justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${log.sync_status === "success" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                        <span className="text-xs font-bold text-slate-850 truncate">Transaction Sync: #{log.id.slice(-6).toUpperCase()}</span>
                        <span className="text-[9px] text-slate-405 font-semibold font-mono">{new Date(log.synced_at).toLocaleString()}</span>
                      </div>
                      
                      {log.sync_status === "success" ? (
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-600 font-medium">
                            Synced article <span className="text-slate-800 font-bold">#{log.article_id.slice(-5).toUpperCase()}</span> perfectly. Notion Block Item Page ID: <span className="font-mono text-indigo-700 font-bold select-all">{log.notion_page_id}</span>
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {log.fields_synced.map((col, idx) => (
                              <span key={idx} className="bg-slate-105 border border-slate-200 text-slate-600 text-[8.5px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-rose-700 bg-rose-50/50 p-2 border border-rose-100 rounded-lg leading-relaxed font-semibold">
                          ⚠️ Sync Failed: {log.sync_error}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                        <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[9px] font-bold text-slate-600">Latency: {log.latency_ms}ms</span>
                        <span className="font-mono truncate max-w-xs font-semibold">Database Destination: {log.notion_database_id}</span>
                      </div>
                    </div>

                    {log.sync_status === "success" && log.notion_page_id && (
                      <a 
                        href={`https://notion.so/${log.notion_page_id.replace(/-/g, "")}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-1 px-2.5 bg-slate-50 hover:bg-slate-105 border rounded-lg text-slate-600 text-[10px] font-black shrink-0 flex items-center gap-1 cursor-pointer transition"
                      >
                        Open Page
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
