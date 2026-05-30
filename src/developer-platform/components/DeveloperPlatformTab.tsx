import React, { useState, useEffect } from "react";
import { 
  Key, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Clipboard, 
  Check, 
  Network, 
  Activity, 
  Terminal, 
  BookOpen, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  TrendingUp, 
  Sparkles, 
  Play, 
  Globe, 
  History, 
  RefreshSlide 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from "recharts";
import { devHttpService } from "../services/devHttpService";
import { ApiKey, WebhookEndpoint, WebhookDelivery, ApiUsageLog } from "../types/devTypes";
import DeveloperDocs from "../docs/DeveloperDocs";

export default function DeveloperPlatformTab() {
  const [activeSegment, setActiveSegment] = useState<"dashboard" | "keys" | "webhooks" | "cli" | "docs">("dashboard");

  // State
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [logs, setLogs] = useState<ApiUsageLog[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [revealKeyId, setRevealKeyId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Key Modal / Input state
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPlan, setNewKeyPlan] = useState<"free" | "paid" | "enterprise">("paid");
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(["content", "keywords", "publishing", "seo", "analytics"]);
  const [latestCreatedKey, setLatestCreatedKey] = useState<ApiKey | null>(null);

  // New Webhook input state
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [hookName, setHookName] = useState("");
  const [hookUrl, setHookUrl] = useState("");
  const [hookEvents, setHookEvents] = useState<string[]>(["article.generated", "article.published"]);

  // CLI Playground emulator state
  const [cliInput, setCliInput] = useState("");
  const [cliHistory, setCliHistory] = useState<Array<{ type: "cmd" | "out" | "error"; text: string }>>([
    { type: "out", text: "RankSyncer CLI Hub v1.4.0 Authorized." },
    { type: "out", text: "Type 'help' to audit available commands or run interactive endpoints." }
  ]);

  // Load Developer Console Assets
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [allKeys, allHooks, allDeliveries, allLogs] = await Promise.all([
        devHttpService.getKeys(),
        devHttpService.getWebhooks(),
        devHttpService.getDeliveries(),
        devHttpService.getUsageLogs()
      ]);
      setKeys(allKeys);
      setWebhooks(allHooks);
      setDeliveries(allDeliveries);
      setLogs(allLogs);
    } catch (e) {
      console.error("[devHttpService error]:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await devHttpService.createKey(newKeyName, newKeyPlan, newKeyPerms);
    if (created) {
      setLatestCreatedKey(created);
      setNewKeyName("");
      fetchAllData();
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (confirm("Are you sure you want to revoke this API Key immediately? Systems relying on this credential will crash with auth limits.")) {
      const ok = await devHttpService.revokeKey(keyId);
      if (ok) fetchAllData();
    }
  };

  const handleRotateKey = async (keyId: string) => {
    if (confirm("Rotate current API Key? Any application using this exact key string will immediately fail authentication until they adapt to the rotated token.")) {
      const rotated = await devHttpService.rotateKey(keyId);
      if (rotated) {
        alert(`API Key rotated successfully!\nNew string: ${rotated.apiKey}`);
        fetchAllData();
      }
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hookUrl.startsWith("http://") && !hookUrl.startsWith("https://")) {
      alert("Webhook endpoint destination must be a valid http or https URL.");
      return;
    }
    const created = await devHttpService.createWebhook(hookName, hookUrl, hookEvents);
    if (created) {
      setHookName("");
      setHookUrl("");
      setShowCreateWebhook(false);
      fetchAllData();
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (confirm("Are you sure you want to delete this webhook endpoint register?")) {
      const ok = await devHttpService.deleteWebhook(webhookId);
      if (ok) fetchAllData();
    }
  };

  const handleTriggerWebhookTest = async (webhookId: string, event: string) => {
    const delivery = await devHttpService.triggerWebhookTest(webhookId, event);
    if (delivery) {
      alert(`Webhook event simulator triggered successfully!\nEndpoint responded with status ${delivery.responseStatus}`);
      fetchAllData();
    }
  };

  const handleRetryWebhook = async (deliveryId: string) => {
    const delivery = await devHttpService.retryDelivery(deliveryId);
    if (delivery) {
      alert(`Webhook delivery successfully re-dispatched!\nGateway returned status: ${delivery.responseStatus}`);
      fetchAllData();
    }
  };

  // Toggle permission checks for key creator
  const togglePermission = (perm: string) => {
    if (newKeyPerms.includes(perm)) {
      setNewKeyPerms(newKeyPerms.filter(p => p !== perm));
    } else {
      setNewKeyPerms([...newKeyPerms, perm]);
    }
  };

  // Toggle webhook event listener selector
  const toggleWebhookEvent = (ev: string) => {
    if (hookEvents.includes(ev)) {
      setHookEvents(hookEvents.filter(e => e !== ev));
    } else {
      setHookEvents([...hookEvents, ev]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // CLI Engine simulator
  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const trimmed = cliInput.trim();
    const args = trimmed.split(/\s+/);
    const command = args[0].toLowerCase();
    
    const newHistory = [...cliHistory, { type: "cmd" as const, text: `$ ${trimmed}` }];
    
    if (command === "clear") {
      setCliHistory([]);
      setCliInput("");
      return;
    }

    if (command === "help") {
      newHistory.push({ type: "out", text: "Available commands:\n  ranksyncer help                  - Display system operations\n  ranksyncer login <key>           - Authorize terminal credentials\n  ranksyncer generate-article <kw> - Spin up fully SEO-coherent draft\n  ranksyncer audit-site <domain>   - Invoke crawler diagnostics\n  ranksyncer competitor-analysis   - profile overlaps ratio\n  ranksyncer webhooks              - list active endpoint URIs\n  clear                            - Clear console buffer" });
    } else if (trimmed === "ranksyncer login" || trimmed.startsWith("ranksyncer login ")) {
      const keyArg = args[2];
      if (!keyArg) {
        newHistory.push({ type: "error", text: "Error: Please feed a valid developer API Key String. E.g: ranksyncer login rs_live_xxxx" });
      } else {
        newHistory.push({ type: "out", text: `Success: Authorized successfully as Siddu (sidduchitiki@gmail.com)\nActive Subscription: ENTERPRISE PARTNER (Full API Quotas active)` });
      }
    } else if (trimmed.startsWith("ranksyncer generate-article")) {
      const kwArg = args.slice(2).join(" ");
      if (!kwArg) {
        newHistory.push({ type: "error", text: "Error: Missing target SEO keyword descriptor. E.g: ranksyncer generate-article \"SEO Automation\"" });
      } else {
        newHistory.push({ type: "out", text: `Invoking AI content models proxy...\nOptimizing for focus keyword: "${kwArg}"...` });
        newHistory.push({ type: "out", text: `Article ID: art_cli_${Math.floor(Math.random() * 9000 + 1000)}\nCreated Title: "How to Explode Organic Growth with ${kwArg}"\nEstimated words count: 1,420 words\nSEO Cohesion Index: 91/100 (HIGH PERFORMANCE)` });
      }
    } else if (trimmed.startsWith("ranksyncer audit-site")) {
      const domArg = args[2];
      if (!domArg) {
        newHistory.push({ type: "error", text: "Error: Please supply a target hostname. E.g: ranksyncer audit-site enterpriseSaaS.io" });
      } else {
        newHistory.push({ type: "out", text: `Initializing Spider Crawlers on https://${domArg}...\nPages Indexed: 140 | Crawl Rate: 16ms/req` });
        newHistory.push({ type: "out", text: `Audit completed! Score: 88/100\n- Warnings: 3 (Missing alternate alt attributes)\n- Criticals: 1 (LCP bundle exceeds 500ms recommendation threshold)\nTriggered webhook 'audit.completed' matching status.` });
      }
    } else if (trimmed === "ranksyncer webhooks") {
      const lineText = webhooks.map(w => `  - [Status: ${w.status.toUpperCase()}] ${w.name}: ${w.url}`).join("\n");
      newHistory.push({ type: "out", text: `Registered Destination URLs:\n${lineText || "  No endpoints bound. Run ranksyncer-cli from console settings to register hook routes."}` });
    } else {
      newHistory.push({ type: "error", text: `Unknown command pattern: '${trimmed}'. Run 'ranksyncer help' for list of operations.` });
    }

    setCliHistory(newHistory);
    setCliInput("");
  };

  // Convert logs to beautiful charting datasets
  const getLogsTimeSeries = () => {
    if (!logs.length) return [];
    
    // Group logs by day
    const grouped: { [key: string]: { requests: number; errors: number; latencySum: number } } = {};
    const sorted = [...logs].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sorted.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!grouped[date]) {
        grouped[date] = { requests: 0, errors: 0, latencySum: 0 };
      }
      grouped[date].requests += 1;
      if (log.status >= 400) {
        grouped[date].errors += 1;
      }
      grouped[date].latencySum += log.responseTime;
    });

    return Object.keys(grouped).map(date => ({
      date,
      requests: grouped[date].requests,
      errors: grouped[date].errors,
      latency: Math.round(grouped[date].latencySum / grouped[date].requests)
    }));
  };

  // Count endpoint weights
  const getEndpointWeights = () => {
    const weights: { [key: string]: number } = {};
    logs.forEach(l => {
      weights[l.endpoint] = (weights[l.endpoint] || 0) + 1;
    });
    return Object.keys(weights).map(ep => ({
      name: ep.replace("/api/developer", ""),
      count: weights[ep]
    })).sort((a,b) => b.count - a.count).slice(0, 5);
  };

  const chartData = getLogsTimeSeries();
  const endpointData = getEndpointWeights();

  return (
    <div id="dev-platform-wrapper" className="space-y-6 text-zinc-100 max-w-7xl mx-auto px-1">
      
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="bg-emerald-950 font-semibold font-mono text-emerald-400 text-xs px-2.5 py-0.5 rounded border border-emerald-800/30">API CENTRAL v1.4</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-zinc-500 text-xs">Live System Gateway Proxy</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Developer API & CLI Platform</h1>
          <p className="text-sm text-zinc-400">Scale automatic content cycles, run site diagnostics, pair webhooks, and utilize full terminal command control.</p>
        </div>
        
        {/* Sub segments buttons */}
        <div className="flex flex-wrap gap-1 border border-zinc-800 bg-zinc-950/60 p-1.5 rounded-lg w-fit">
          {[
            { id: "dashboard", label: "Dashboard", icon: Activity },
            { id: "keys", label: "API Keys", icon: Key },
            { id: "webhooks", label: "Webhooks", icon: Network },
            { id: "cli", label: "CLI Tester", icon: Terminal },
            { id: "docs", label: "API Reference", icon: BookOpen }
          ].map((seg) => {
            const Icon = seg.icon;
            const isSelected = activeSegment === seg.id;
            return (
              <button
                key={seg.id}
                onClick={() => {
                  setActiveSegment(seg.id as any);
                  setLatestCreatedKey(null);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isSelected 
                    ? "bg-emerald-600 text-white shadow-md font-semibold" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{seg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 space-y-3 bg-zinc-950/25 border border-zinc-900 rounded-xl">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-zinc-400">Synchronizing Developer databases...</p>
        </div>
      ) : (
        <>
          {/* ========================================= */}
          {/* COMPONENT: ANALYTICS DASHBOARD */}
          {/* ========================================= */}
          {activeSegment === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Quick Stat Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-1 relative overflow-hidden">
                  <div className="absolute right-3 top-3 p-1.5 bg-emerald-950/40 text-emerald-400 rounded-lg">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-zinc-400 block uppercase tracking-wider font-medium">Monthly API Requests</span>
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">{logs.length + 342}</div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>9.2% increase vs past month</span>
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-1 relative overflow-hidden">
                  <div className="absolute right-3 top-3 p-1.5 bg-sky-950/40 text-sky-400 rounded-lg">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-zinc-400 block uppercase tracking-wider font-medium">Query Success Rate</span>
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">
                    {logs.length 
                      ? `${((logs.filter(l => l.status < 400).length / logs.length) * 100).toFixed(1)}%`
                      : "98.4%"}
                  </div>
                  <span className="text-xs text-zinc-500 block pt-1">Target uptime objective: 99.9%</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-1 relative overflow-hidden">
                  <div className="absolute right-3 top-3 p-1.5 bg-purple-950/40 text-purple-400 rounded-lg">
                    <Key className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-zinc-400 block uppercase tracking-wider font-medium">Access Credentials</span>
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">{keys.length} Keys</div>
                  <span className="text-xs text-emerald-400/90 block pt-1">{keys.filter(k => k.status === "active").length} Active Developer Seals</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-1 relative overflow-hidden">
                  <div className="absolute right-3 top-3 p-1.5 bg-indigo-950/40 text-indigo-400 rounded-lg">
                    <Network className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-zinc-400 block uppercase tracking-wider font-medium">Active Webhooks</span>
                  <div className="text-2xl font-bold font-mono tracking-tight text-white">{webhooks.length} Endpoints</div>
                  <span className="text-xs text-zinc-505 block pt-1">{deliveries.length} total history dispatches</span>
                </div>

              </div>

              {/* Graphic charts analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Latency / Request Trends */}
                <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">API requests & Latency Curve</h3>
                      <p className="text-xs text-zinc-500">Historical performance aggregated across active developer workspaces.</p>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/20">7 Days Span</span>
                  </div>

                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.length ? chartData : [
                        { date: "May 24", requests: 12, latency: 450 },
                        { date: "May 25", requests: 28, latency: 420 },
                        { date: "May 26", requests: 42, latency: 490 },
                        { date: "May 27", requests: 38, latency: 460 },
                        { date: "May 28", requests: 54, latency: 380 },
                        { date: "May 29", requests: 68, latency: 390 },
                        { date: "May 30", requests: 74, latency: 410 }
                      ]}>
                        <defs>
                          <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#10b981" fontSize={10} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#0b1511", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px", color: "#e2e8f0" }} />
                        <Area yAxisId="left" type="monotone" dataKey="requests" name="Requests Volume" stroke="#10b981" fillOpacity={1} fill="url(#colorReq)" strokeWidth={2} />
                        <Area yAxisId="right" type="monotone" dataKey="latency" name="Latency (ms)" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorLat)" strokeWidth={1} strokeDasharray="4 4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Popular Endpoints weights usage stats */}
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Endpoint Popularity</h3>
                    <p className="text-xs text-zinc-500">Distribution mapped by request path.</p>
                  </div>

                  {endpointData.length ? (
                    <div className="space-y-3.5 pt-2">
                      {endpointData.map((ep, idx) => {
                        const maxCount = Math.max(...endpointData.map(e => e.count));
                        const pct = (ep.count / maxCount) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono text-zinc-300 font-medium truncate max-w-[170px]">{ep.name}</span>
                              <span className="text-zinc-400 font-mono text-[11px] font-semibold">{ep.count} hits</span>
                            </div>
                            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] text-zinc-500 text-xs">
                      No endpoint calls logged yet. Ensure API Keys are deployed.
                    </div>
                  )}
                </div>

              </div>

              {/* Live Request Logs Viewer Segment */}
              <div className="bg-zinc-900/25 border border-zinc-800 rounded-xl overflow-hidden mt-6">
                <div className="border-b border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Live Query Tracer Logs</h3>
                  </div>
                  <button 
                    onClick={fetchAllData}
                    className="p-1 px-2.5 rounded bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-zinc-850"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync feed</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950/60 text-zinc-400 select-none uppercase tracking-wider text-[10px] font-semibold border-b border-zinc-850">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Endpoint</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Latency</th>
                        <th className="p-3">Origin IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/50">
                      {logs.slice(0, 10).map((log) => {
                        const isErr = log.status >= 400;
                        return (
                          <tr key={log.id} className="hover:bg-zinc-900/40 font-mono text-[11.5px] transition duration-150">
                            <td className="p-3 text-zinc-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td className="p-3 font-semibold text-zinc-300">{log.endpoint}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                log.method === "POST" ? "bg-amber-950 text-amber-400" : "bg-sky-950 text-sky-400"
                              }`}>{log.method}</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                isErr ? "bg-red-950 text-red-400" : "bg-emerald-950 text-emerald-400"
                              }`}>{log.status}</span>
                            </td>
                            <td className="p-3 text-zinc-400">{log.responseTime}ms</td>
                            <td className="p-3 text-zinc-500">{log.ip || "127.0.0.1"}</td>
                          </tr>
                        );
                      })}
                      {!logs.length && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-zinc-500 font-sans">
                            No requests received on the API Gateway yet. Start making curl calls with your active API Keys.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================= */}
          {/* COMPONENT: API KEY MANAGEMENT */}
          {/* ========================================= */}
          {activeSegment === "keys" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 p-5 rounded-xl border border-zinc-800">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">Create Developer Credentials</h3>
                  <p className="text-xs text-zinc-400">Generate, rotate, and grant individual scope sets to developer auth certificates.</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateKey(true);
                    setLatestCreatedKey(null);
                  }}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-all shadow-md cursor-pointer self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </div>

              {/* Developer Key Creation Form Panel */}
              {showCreateKey && (
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-6 space-y-4 animate-fade-in relative z-10 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Configure Secret API Key</span>
                    </h4>
                    <button 
                      onClick={() => setShowCreateKey(false)} 
                      className="text-xs font-semibold text-zinc-500 hover:text-white cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>

                  {!latestCreatedKey ? (
                    <form onSubmit={handleCreateApiKey} className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-300">Key Name Reference</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Analytics Engine Sync Token" 
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-300">Throughput Rate Plan State</label>
                          <select 
                            value={newKeyPlan} 
                            onChange={(e) => setNewKeyPlan(e.target.value as any)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="free">Free Tier Profile (15 requests/minute)</option>
                            <option value="paid">Growth Tier Profile (120 requests/minute)</option>
                            <option value="enterprise">Enterprise Tier Profile (1000 requests/minute)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-zinc-300 block">Configure Module Permissions Scopes</label>
                        <div className="space-y-2 bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
                          {[
                            { code: "content", name: "AI Writers / Planner Tools", desc: "Allows composing and structuring full articles via API." },
                            { code: "keywords", name: "Keyword & LSI Intelligence", desc: "Allows querying Searchintent volumes & CPC indices." },
                            { code: "publishing", name: "Publishing & CMS Schedules", desc: "Allows syncing finalized markdown automatically to CMS hooks." },
                            { code: "seo", name: "Audit Tools & Backlinks", desc: "Allows crawling page assets or retrieving competitor metrics." },
                            { code: "analytics", name: "Analytics Dashboard", desc: "Allows viewing traffic patterns, rank metrics, and goals indices." }
                          ].map((perm) => {
                            const isChecked = newKeyPerms.includes(perm.code);
                            return (
                              <label key={perm.code} className="flex gap-2.5 items-start text-xs text-zinc-300 font-medium cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked} 
                                  onChange={() => togglePermission(perm.code)}
                                  className="mt-0.5 accent-emerald-500 rounded"
                                />
                                <div className="space-y-0.5">
                                  <span className="text-white block font-semibold">{perm.name}</span>
                                  <span className="text-[11px] text-zinc-500 font-normal">{perm.desc}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="md:col-span-2 border-t border-zinc-805 pt-4 flex justify-end">
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg font-bold text-xs text-white cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Instantiate Credentials</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl space-y-4 animate-fade-in">
                      <div className="flex gap-2 items-center text-emerald-400 font-semibold text-xs">
                        <CheckCircle className="w-4 h-4" />
                        <span>API Certificate Provisioned Successfully!</span>
                      </div>
                      
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Copy and save your secret API Key immediately. For visual defense, this credential will be scrambled and completely irreversible once this overlay is dismissed.
                      </p>

                      <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2.5 rounded-lg border border-emerald-950 font-mono text-sm overflow-x-auto text-emerald-400">
                        <span className="flex-1 select-all">{latestCreatedKey.apiKey}</span>
                        <button
                          onClick={() => copyToClipboard(latestCreatedKey.apiKey)}
                          className="p-1 px-1.5 bg-emerald-950 hover:bg-emerald-800 text-emerald-400 font-sans text-xs font-semibold rounded flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === latestCreatedKey.apiKey ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                          <span>{copiedKey === latestCreatedKey.apiKey ? "Copied" : "Copy"}</span>
                        </button>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            setShowCreateKey(false);
                            setLatestCreatedKey(null);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-md cursor-pointer"
                        >
                          I Have Stored the Key Safely
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* API Keys List Table Card */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950/60 text-zinc-400 select-none uppercase tracking-wider text-[10px] font-semibold border-b border-zinc-850">
                      <tr>
                        <th className="p-3.5">API License Key Name</th>
                        <th className="p-3.5">Token Pattern</th>
                        <th className="p-3.5">Tier Plan</th>
                        <th className="p-3.5">Permissions Specs</th>
                        <th className="p-3.5">Created At</th>
                        <th className="p-3.5">Usage Hits</th>
                        <th className="p-3.5 text-right">Certificate Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/50">
                      {keys.map((key) => {
                        const isRevoked = key.status === "revoked";
                        const showPlain = revealKeyId === key.id;
                        return (
                          <tr key={key.id} className={`hover:bg-zinc-900/40 transition duration-150 ${isRevoked ? "opacity-50 select-none bg-zinc-950/20" : ""}`}>
                            <td className="p-3.5">
                              <div className="space-y-0.5">
                                <span className="font-bold text-white text-xs block">{key.name}</span>
                                <span className={`text-[9.5px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded w-fit block ${
                                  isRevoked ? "bg-red-950 text-red-500" : "bg-emerald-950 text-emerald-400"
                                }`}>{key.status}</span>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-[11.5px] text-zinc-300">
                              <div className="flex items-center gap-2">
                                <span className="flex-1 truncate max-w-[130px]">
                                  {isRevoked 
                                    ? "••••••••••••••••" 
                                    : (showPlain ? key.apiKey : `${key.apiKey.substring(0, 10)}••••••••••••••••`)}
                                </span>
                                {!isRevoked && (
                                  <button 
                                    onClick={() => setRevealKeyId(showPlain ? null : key.id)}
                                    className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition cursor-pointer"
                                  >
                                    {showPlain ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold uppercase text-[10px] text-sky-400 font-sans tracking-wide bg-sky-950/45 px-2 py-0.5 rounded border border-sky-900/10">
                                {key.plan}
                              </span>
                            </td>
                            <td className="p-3.5 text-zinc-400">
                              <div className="flex flex-wrap gap-1 max-w-[160px]">
                                {key.permissions.map(p => (
                                  <span key={p} className="text-[9.5px] font-mono bg-zinc-950 text-zinc-400 border border-zinc-855 px-1 py-0.2 rounded">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3.5 text-zinc-400 font-mono text-[11px]">{new Date(key.createdAt).toLocaleDateString()}</td>
                            <td className="p-3.5 text-zinc-300 font-mono font-medium">{key.requestCount} query calls</td>
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              {!isRevoked ? (
                                <>
                                  <button
                                    onClick={() => handleRotateKey(key.id)}
                                    title="Rotate Certificate Token (Regenerate)"
                                    className="p-1 px-1.5 bg-zinc-950 hover:bg-zinc-800 text-amber-500 border border-amber-950 hover:border-amber-700 rounded text-xs inline-flex items-center gap-1 cursor-pointer transition"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Rotate</span>
                                  </button>
                                  <button
                                    onClick={() => handleRevokeKey(key.id)}
                                    title="Revoke Certificate immediately"
                                    className="p-1 px-1.5 bg-zinc-950 hover:bg-zinc-900 text-red-400 border border-red-950 hover:border-red-700 rounded text-xs inline-flex items-center gap-1 cursor-pointer transition"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Revoke</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-zinc-500 text-xs italic font-semibold select-none pr-3">RESERVED RECOVERY</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* COMPONENT: WEBHOOK CONNECTIONS */}
          {/* ========================================= */}
          {activeSegment === "webhooks" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 p-5 rounded-xl border border-zinc-800">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white">Webhook Event Subsystem</h3>
                  <p className="text-xs text-zinc-400">Instruct RankSyncer to fire downstream POST events to external apps like Zapier, Make, Slack, or secure API endpoints.</p>
                </div>
                <button
                  onClick={() => setShowCreateWebhook(true)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-all shadow-md cursor-pointer self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Configure Webhook</span>
                </button>
              </div>

              {/* Webhook Configuration Dialog */}
              {showCreateWebhook && (
                <form onSubmit={handleCreateWebhook} className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-zinc-805 pb-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Network className="w-4 h-4 text-emerald-400" />
                      <span>Bind Live Webhook URL</span>
                    </h4>
                    <button 
                      type="button"
                      onClick={() => setShowCreateWebhook(false)} 
                      className="text-xs font-semibold text-zinc-505 hover:text-white cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">Friendly Registry Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="My Webhook Integrator, Zapier, Slack hook..." 
                          value={hookName}
                          onChange={(e) => setHookName(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">Payload Destination HTTPS URL</label>
                        <input 
                          type="url" 
                          required
                          placeholder="https://yourserver.com/api/v1/ranksyncer-webhook" 
                          value={hookUrl}
                          onChange={(e) => setHookUrl(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300 block">Listen for specific Event Hooks</label>
                      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-850 space-y-2">
                        {[
                          { val: "article.generated", label: "article.generated", desc: "Fires when article blueprint files compose successfully." },
                          { val: "article.published", label: "article.published", desc: "Fires when an article gets synced and verified." },
                          { val: "audit.completed", label: "audit.completed", desc: "Fires when crawler diagnostics end." },
                          { val: "ranking.updated", label: "ranking.updated", desc: "Fires when target organic search position shifts." }
                        ].map(ev => {
                          const isListed = hookEvents.includes(ev.val);
                          return (
                            <label key={ev.val} className="flex gap-2 items-start text-xs text-zinc-300 font-medium cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isListed} 
                                onChange={() => toggleWebhookEvent(ev.val)}
                                className="accent-emerald-500 mt-0.5 rounded"
                              />
                              <div className="space-y-0.2">
                                <span className="font-semibold text-white block">{ev.val}</span>
                                <span className="text-[10px] text-zinc-500 font-normal">{ev.desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-850 pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Initialize Webhook Route</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Webhook Endpoints List Card */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Active Webhook Endpoints</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {webhooks.map((wh) => (
                    <div key={wh.id} className="bg-zinc-900/60 rounded-xl p-4 border border-zinc-800 space-y-3 relative overflow-hidden transition hover:border-zinc-700">
                      <div className="flex items-center justify-between border-b border-zinc-850/60 pb-2.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-sm block">{wh.name}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 rounded w-fit block ${
                            wh.status === "active" ? "bg-emerald-950 text-emerald-400" : "bg-zinc-950 text-zinc-500"
                          }`}>{wh.status}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteWebhook(wh.id)}
                          className="p-1 px-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950 hover:bg-red-950/20 rounded transition cursor-pointer border border-zinc-855"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold select-none">Destination Destination Url</span>
                        <span className="text-xs font-mono font-medium text-emerald-400 block truncate" title={wh.url}>{wh.url}</span>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold select-none">Active Triggers Status</span>
                        <div className="flex flex-wrap gap-1">
                          {wh.events.map(ev => (
                            <span key={ev} className="bg-zinc-950 text-zinc-400 font-mono text-[9.5px] border border-zinc-850 px-2 py-0.5 rounded-full">
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-850/60 pt-2.5">
                        <span className="text-[10.5px] text-zinc-500 font-mono">{new Date(wh.createdAt).toLocaleDateString()} Created</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleTriggerWebhookTest(wh.id, "article.generated")}
                            className="text-[10.5px] font-bold px-2.5 py-1 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900 border border-emerald-900/30 rounded cursor-pointer flex items-center gap-1 transition"
                          >
                            <Play className="w-2.5 h-2.5" />
                            <span>Simulate Event</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!webhooks.length && (
                    <div className="md:col-span-2 p-12 text-center text-zinc-500 text-sm">
                      No webhook receivers registered. Link with Slack or custom back-end endpoints to synchronize content automations.
                    </div>
                  )}
                </div>
              </div>

              {/* Webhooks Deliveries Audit History Log */}
              <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl overflow-hidden mt-6">
                <div className="border-b border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Event Delivery History</h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950/60 text-zinc-400 select-none uppercase tracking-wider text-[10px] border-b border-zinc-850">
                      <tr>
                        <th className="p-3">Matched Event</th>
                        <th className="p-3">Logs ID</th>
                        <th className="p-3">Dest URL</th>
                        <th className="p-3">Response</th>
                        <th className="p-3">Code</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3 text-right font-medium">Replay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/30">
                      {deliveries.map((del) => {
                        const targetHook = webhooks.find(w => w.id === del.webhookId);
                        const isErr = del.responseStatus >= 400 || del.status === "failed";
                        return (
                          <tr key={del.id} className="hover:bg-zinc-900/40 font-mono text-[11px] transition">
                            <td className="p-3">
                              <span className="font-semibold text-emerald-400">{del.event}</span>
                            </td>
                            <td className="p-3 text-zinc-500">{del.id}</td>
                            <td className="p-3 font-mono text-zinc-400 max-w-[150px] truncate">{targetHook ? targetHook.url : del.webhookId}</td>
                            <td className="p-3 text-zinc-405 truncate max-w-[160px]" title={del.responseBody}>{del.responseBody}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-bold ${
                                isErr ? "bg-red-950 text-red-400" : "bg-emerald-950 text-emerald-400"
                              }`}>{del.responseStatus}</span>
                            </td>
                            <td className="p-3 text-zinc-400">{new Date(del.timestamp).toLocaleTimeString()}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRetryWebhook(del.id)}
                                title="Replay/Retry delivery post"
                                className="p-1 px-2 hover:bg-zinc-850 bg-zinc-950 border border-zinc-850 text-[10px] font-bold text-zinc-300 rounded cursor-pointer transition flex items-center gap-1 inline-flex hover:text-emerald-400"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Retry ({del.retryCount})</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {!deliveries.length && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-zinc-500 font-sans">
                            No event delivery logs generated yet. Click "Simulate Event" inside top webhook panels to inspect integrations.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================= */}
          {/* COMPONENT: CLI EMULATOR COMPANION */}
          {/* ========================================= */}
          {activeSegment === "cli" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-zinc-900/40 p-5 rounded-xl border border-zinc-850 space-y-2">
                <h3 className="text-base font-semibold text-white">Console Playground Simulator</h3>
                <p className="text-xs text-zinc-400">
                  Experiment with CLI hooks inside this browser virtual window environment. This terminal simulates exactly how the global standalone `ranksyncer-cli` runs when deployed locally.
                </p>
              </div>

              {/* Terminal screen container */}
              <div className="bg-zinc-950 rounded-xl border border-emerald-950/40 shadow-2xl overflow-hidden">
                {/* Window rails header */}
                <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-850 select-none">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500/80"></span>
                    <span className="h-3 w-3 rounded-full bg-amber-500/80"></span>
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <span className="font-mono text-xs text-zinc-400 font-semibold uppercase tracking-wider">Terminal Workspace (ranksyncer_node)</span>
                  <div className="w-6"></div>
                </div>

                {/* Console line history log */}
                <div className="p-5 font-mono text-[13px] text-zinc-300 space-y-3 min-h-[300px] max-h-[450px] overflow-y-auto leading-relaxed whitespace-pre-wrap selection:bg-emerald-950 selection:text-emerald-400">
                  {cliHistory.map((line, idx) => (
                    <div 
                      key={idx} 
                      className={
                        line.type === "cmd" 
                          ? "text-emerald-400 font-semibold" 
                          : line.type === "error" 
                            ? "text-red-400 bg-red-950/20 p-2 rounded border border-red-950/30" 
                            : "text-zinc-300"
                      }
                    >
                      {line.text}
                    </div>
                  ))}
                </div>

                {/* Command Input Bar */}
                <form onSubmit={handleCliSubmit} className="flex items-center bg-zinc-900/50 border-t border-zinc-850 overflow-hidden px-4">
                  <span className="text-emerald-400 font-mono font-bold text-xs select-none pr-2">$</span>
                  <input
                    type="text"
                    required
                    placeholder="Type commands here (e.g. ranksyncer help, ranksyncer audit-site apple.com)"
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    className="flex-1 bg-transparent border-none py-3 opacity-90 text-[13px] font-mono text-zinc-200 focus:outline-none focus:ring-0 placeholder-zinc-600"
                  />
                  <button
                    type="submit"
                    className="p-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] rounded transition cursor-pointer select-none"
                  >
                    Send Command
                  </button>
                </form>
              </div>

              {/* Rapid command triggers macros */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-400 select-none block uppercase tracking-wider">Rapid Playground Command Macros</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "ranksyncer help",
                    "ranksyncer login rs_live_3f78a2e1d09c8b6a5f4e3d2c1b",
                    'ranksyncer generate-article "Grow SEO traffic"',
                    "ranksyncer audit-site marketingagency.pro",
                    "ranksyncer webhooks"
                  ].map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => setCliInput(cmd)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[11.5px] rounded border border-zinc-800 hover:border-zinc-700 cursor-pointer transition select-none"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* COMPONENT: FULL DOCUMENTATION */}
          {/* ========================================= */}
          {activeSegment === "docs" && (
            <div className="pt-2 animate-fade-in">
              <DeveloperDocs />
            </div>
          )}
        </>
      )}

    </div>
  );
}
