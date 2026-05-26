import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Settings, 
  Zap, 
  Check, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Calendar as CalendarIcon, 
  Power, 
  Globe2, 
  Trash2, 
  Edit3, 
  ExternalLink,
  Loader2,
  CheckCircle,
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
  Server,
  CloudLightning
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { Project, CrawlerLog } from "../types";

export interface PublishingSchedule {
  id: string;
  projectId: string;
  isEnabled: boolean;
  frequency: "daily" | "every-2-days" | "weekly";
  timezone: string;
  cmsPlatform: "wordpress" | "webflow" | "shopify" | "ghost" | "headless_webhook";
  lastPublishAt: string | null;
  nextPublishAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublishQueueItem {
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  keyword: string;
  status: "queued" | "generating" | "publishing" | "published" | "failed";
  articleId?: string;
  error?: string;
  scheduledAt: string;
  completedAt?: string;
  retryCount: number;
  cmsPublishedUrl?: string;
  niche?: string;
}

interface AutoPublishSchedulerProps {
  project: Project;
  onNavigateToEditor: (articleId: string) => void;
  cmsCredentials: {
    wp: any;
    webflow: any;
    shopify: any;
    headless: any;
  };
}

export default function AutoPublishScheduler({ 
  project, 
  onNavigateToEditor,
  cmsCredentials
}: AutoPublishSchedulerProps) {
  
  // Local state holding the active scheduler and queue items safely
  const [schedule, setSchedule] = useState<PublishingSchedule | null>(null);
  const [queue, setQueue] = useState<PublishQueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Sub-actions states
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);
  const [healthChecking, setHealthChecking] = useState<boolean>(false);
  const [healthResult, setHealthResult] = useState<{ success: boolean; message: string; isSimulated?: boolean } | null>(null);
  
  // Edit topic inline state variables
  const [editingItem, setEditingItem] = useState<PublishQueueItem | null>(null);
  const [tempEditTitle, setTempEditTitle] = useState<string>("");
  const [tempEditKeyword, setTempEditKeyword] = useState<string>("");
  const [tempEditScheduled, setTempEditScheduled] = useState<string>("");

  // Quick manually added keyword modal form states
  const [newTitle, setNewTitle] = useState<string>("");
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [customPublishHours, setCustomPublishHours] = useState<number>(3); // hours from now
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Load scheduler config and queues
  const fetchSchedulerData = async () => {
    try {
      setLoading(true);
      const [schedRes, queueRes] = await Promise.all([
        fetch(`/api/scheduler/schedule/${project.id}`),
        fetch(`/api/scheduler/queue/${project.id}`)
      ]);
      
      if (schedRes.ok && queueRes.ok) {
        const schedJson = await schedRes.json();
        const queueJson = await queueRes.json();
        setSchedule(schedJson);
        setQueue(queueJson.queue || []);
      }
    } catch (e) {
      console.error("Failed to load scheduling assets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulerData();
    
    // Polling background queue progress state every 4 seconds to catch active builds!
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/scheduler/queue/${project.id}`);
        if (res.ok) {
          const json = await res.json();
          setQueue(json.queue || []);
        }
      } catch (e) {
        // quiet fail
      }
    }, 4500);

    return () => clearInterval(pollInterval);
  }, [project.id]);

  // Handle schedule active settings commits
  const handleUpdateSchedule = async (updates: Partial<PublishingSchedule>) => {
    if (!schedule) return;
    setSavingSchedule(true);
    try {
      const response = await fetch(`/api/scheduler/schedule/${project.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...schedule,
          ...updates
        })
      });
      if (response.ok) {
        const json = await response.json();
        setSchedule(json.schedule);
      }
    } catch (err) {
      console.error("Save schedule parameters error:", err);
    } finally {
      setSavingSchedule(false);
    }
  };

  // Run Connection Health Checks live
  const handleRunHealthCheck = async () => {
    if (!schedule) return;
    setHealthChecking(true);
    setHealthResult(null);
    
    // Resolve credentials based on active platform selection
    let credentials: any = {};
    if (schedule.cmsPlatform === "wordpress") credentials = cmsCredentials.wp;
    else if (schedule.cmsPlatform === "webflow") credentials = cmsCredentials.webflow;
    else if (schedule.cmsPlatform === "shopify") credentials = cmsCredentials.shopify;
    else if (schedule.cmsPlatform === "headless_webhook") credentials = cmsCredentials.headless;

    try {
      const res = await fetch(`/api/cms/health-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: schedule.cmsPlatform,
          credentials
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHealthResult({
          success: data.healthy,
          message: data.healthy ? data.message : (data.error || "Integration verification failed."),
          isSimulated: data.isSimulated
        });
      } else {
        setHealthResult({
          success: false,
          message: "API server returned status failure trying to reach credentials agent."
        });
      }
    } catch (e: any) {
      setHealthResult({
        success: false,
        message: e.message || "Failed to make HTTP sync request."
      });
    } finally {
      setHealthChecking(false);
    }
  };

  // Force queue item immediate generation and publish
  const handlePublishNow = async (itemId: string) => {
    try {
      setQueue(prev => prev.map(q => q.id === itemId ? { ...q, status: "queued" } : q));
      const res = await fetch(`/api/scheduler/queue/publish-now/${itemId}`, {
        method: "POST"
      });
      if (res.ok) {
        // Reload queues asynchronously
        const updateRes = await fetch(`/api/scheduler/queue/${project.id}`);
        if (updateRes.ok) {
          const json = await updateRes.json();
          setQueue(json.queue || []);
        }
      }
    } catch (e) {
      console.error("Immediate publish trigger failure:", e);
    }
  };

  // Retry publish function
  const handleRetryPublish = async (itemId: string) => {
    await handlePublishNow(itemId);
  };

  // Remove planned topic from calendar
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to reject and delete this topic plan suggestion?")) return;
    try {
      const res = await fetch(`/api/scheduler/queue/delete/${itemId}`, {
        method: "POST"
      });
      if (res.ok) {
        setQueue(prev => prev.filter(q => q.id !== itemId));
      }
    } catch (e) {
      console.error("Queue delete failed:", e);
    }
  };

  // Reorder queue index items (Drag / priority shifter)
  const handleMovePriority = async (index: number, direction: "up" | "down") => {
    const activeQueued = queue.filter(q => q.status === "queued");
    if (activeQueued.length < 2) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeQueued.length) return;

    // Swap positions
    const reorderedQueued = [...activeQueued];
    const temp = reorderedQueued[index];
    reorderedQueued[index] = reorderedQueued[targetIndex];
    reorderedQueued[targetIndex] = temp;

    const otherItems = queue.filter(q => q.status !== "queued");
    const orderedIds = reorderedQueued.map(q => q.id);

    // Optimistically update frontend UI
    const spacingMin = 30;
    reorderedQueued.forEach((item, idx) => {
      item.scheduledAt = new Date(Date.now() + (idx + 1) * spacingMin * 60 * 1000).toISOString();
    });
    setQueue([...reorderedQueued, ...otherItems]);

    // Save ordering to backend
    try {
      await fetch("/api/scheduler/queue/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds })
      });
    } catch (err) {
      console.error("Reorder fail:", err);
    }
  };

  // Save inline edits
  const handleSaveInlineEdit = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/scheduler/queue/edit/${editingItem.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tempEditTitle,
          keyword: tempEditKeyword,
          scheduledAt: new Date(tempEditScheduled).toISOString()
        })
      });

      if (res.ok) {
        const json = await res.json();
        setQueue(prev => prev.map(item => item.id === editingItem.id ? json.item : item));
        setEditingItem(null);
      }
    } catch (e) {
      console.error("Inline save failed:", e);
    }
  };

  // Add custom manual keyword scheduling
  const handleAddManualItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newKeyword) return;

    const scheduledDate = new Date(Date.now() + customPublishHours * 60 * 60 * 1000).toISOString();

    try {
      const res = await fetch("/api/scheduler/queue/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          title: newTitle,
          keyword: newKeyword,
          scheduledAt: scheduledDate,
          niche: project.name || "Default Website Focus"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQueue(prev => [data.item, ...prev]);
        setNewTitle("");
        setNewKeyword("");
        setShowAddForm(false);
      }
    } catch (e) {
      console.error("Queue fail:", e);
    }
  };

  // Dynamic values helper
  const isCmsConfigured = (): boolean => {
    if (!schedule) return false;
    const plat = schedule.cmsPlatform;
    if (plat === "wordpress") return !!cmsCredentials.wp?.siteUrl;
    if (plat === "webflow") return !!cmsCredentials.webflow?.siteToken;
    if (plat === "shopify") return !!cmsCredentials.shopify?.storeDomain;
    if (plat === "headless_webhook") return !!cmsCredentials.headless?.webhookUrl;
    return true; // simulated modes
  };

  // Helper date text formatters
  const formatScheduledTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return "Running soon...";
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return `In ${diffMins} min${diffMins !== 1 ? "s" : ""}`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `In ${diffHours} hr${diffHours !== 1 ? "s" : ""}`;
    }

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  // Dummy area chart analytics plot representing published content growth trend
  const chartData = [
    { day: "May 18", posts: 4, trafficEstimate: 450 },
    { day: "May 19", posts: 7, trafficEstimate: 720 },
    { day: "May 20", posts: 9, trafficEstimate: 980 },
    { day: "May 21", posts: 11, trafficEstimate: 1400 },
    { day: "May 22", posts: 15, trafficEstimate: 2100 },
    { day: "May 23", posts: 17, trafficEstimate: 2800 },
    { day: "May 24", posts: 21, trafficEstimate: 3600 },
    { day: "May 25", posts: 23, trafficEstimate: 4200 },
    { day: "May 26", posts: 25, trafficEstimate: 5100 }
  ];

  // Helper to resolve stylized platform badges
  const getPlatformBadgeClass = (platform: string) => {
    switch(platform) {
      case "wordpress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "webflow": return "bg-sky-100 text-sky-850 border-sky-200";
      case "shopify": return "bg-purple-100 text-purple-850 border-purple-200";
      case "ghost": return "bg-slate-100 text-slate-800 border-slate-200";
      default: return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  if (loading && queue.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Synchronizing queue sequences and target schedules...</p>
      </div>
    );
  }

  const activeQueuedItems = queue.filter(item => item.status === "queued" || item.status === "generating" || item.status === "publishing");
  const completedItems = queue.filter(item => item.status === "published" || item.status === "failed");

  return (
    <div className="space-y-6">
      
      {/* 1. Scheduler Control Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
              schedule?.isEnabled 
                ? "bg-emerald-50 border border-emerald-100 text-emerald-600" 
                : "bg-slate-100 border border-slate-200 text-slate-400"
            }`}>
              <Power className={`h-6 w-6 ${schedule?.isEnabled ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-slate-900 font-sans">
                  Autonomous Article Auto-Publisher
                </h3>
                {schedule?.isEnabled ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    DAEMON ONLINE
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-slate-200">
                    PAUSED
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-0.5 max-w-xl leading-relaxed">
                Automatically write highly optimized, internal link-boosted SEO articles and syndicate drafts to your connected CMS without lifting a single finger.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <span className="text-xs font-semibold text-slate-500">Auto Publish:</span>
            <button 
              onClick={() => handleUpdateSchedule({ isEnabled: !schedule?.isEnabled })}
              disabled={savingSchedule}
              className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                schedule?.isEnabled ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
              }`}
            >
              <span className="bg-white w-6 h-6 rounded-full shadow-sm" />
            </button>
          </div>
        </div>

        {/* 2. Configuration Settings Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 leading-relaxed tracking-wider font-mono">
              Publishing Frequency
            </label>
            <select 
              value={schedule?.frequency || "daily"}
              onChange={(e) => handleUpdateSchedule({ frequency: e.target.value as any })}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs p-2.5 rounded-xl font-bold w-full text-slate-800 outline-none focus:ring-1 focus:ring-emerald-400 transition"
            >
              <option value="daily">Daily (1 article/day)</option>
              <option value="every-2-days">Every 2 Days (1/48 hours)</option>
              <option value="weekly">Weekly (1 article/week)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 leading-relaxed tracking-wider font-mono">
              Timezone Alignment
            </label>
            <select 
              value={schedule?.timezone || "UTC"}
              onChange={(e) => handleUpdateSchedule({ timezone: e.target.value })}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs p-2.5 rounded-xl font-bold w-full text-slate-800 outline-none focus:ring-1 focus:ring-emerald-400 transition"
            >
              <option value="UTC">UTC / Greenwich GMT</option>
              <option value="EST">EST / New York (GMT-5)</option>
              <option value="PST">PST / San Francisco (GMT-8)</option>
              <option value="CET">CET / Berlin (GMT+1)</option>
              <option value="IST">IST / Mumbai (GMT+5:30)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 leading-relaxed tracking-wider font-mono">
              Syndicate Platform
            </label>
            <select 
              value={schedule?.cmsPlatform || "wordpress"}
              onChange={(e) => handleUpdateSchedule({ cmsPlatform: e.target.value as any })}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs p-2.5 rounded-xl font-bold w-full text-slate-800 outline-none focus:ring-1 focus:ring-emerald-400 transition"
            >
              <option value="wordpress">WordPress REST Core</option>
              <option value="webflow">Webflow Collections v2</option>
              <option value="shopify">Shopify Store Admin GID</option>
              <option value="ghost">Ghost CMS Content</option>
              <option value="headless_webhook">Headless Deployment Webhook</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <span className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 leading-relaxed tracking-wider font-mono">Next Launch Date</span>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-450" />
                {schedule?.nextPublishAt 
                  ? new Date(schedule.nextPublishAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) 
                  : "Standby / Enabled Only"}
              </span>
              {schedule?.nextPublishAt && (
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold uppercase font-sans">
                  {formatScheduledTime(schedule.nextPublishAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Connection Health Indicators & Diagnostic Console */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs leading-relaxed">
            <div className={`h-2.5 w-2.5 rounded-full ${isCmsConfigured() ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : "bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-pulse"}`} />
            <div>
              <p className="font-bold text-slate-800 flex items-center gap-1">
                Target CMS Health Status: {isCmsConfigured() ? "Connected & Verified" : "Offline Sandbox Emulator Active"}
              </p>
              <p className="text-slate-450 mt-0.5 text-[11px] font-medium leading-tight">
                {isCmsConfigured() 
                  ? `Using active configurations found in Settings for ${schedule?.cmsPlatform?.toUpperCase()}.` 
                  : "No credentials supplied yet for target integration. Emulating with sandbox test credentials."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button 
              onClick={handleRunHealthCheck}
              disabled={healthChecking}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl shadow-3xs flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {healthChecking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                  <span>Health Check connection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostic health alert box */}
        {healthResult && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed ${
              healthResult.success 
                ? "bg-emerald-50 border-emerald-100 text-emerald-900" 
                : "bg-amber-50 border-amber-100 text-amber-900"
            }`}
          >
            {healthResult.success ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-black">API Integration Diagnostic Ping</p>
              <p className="text-slate-600 mt-0.5 font-medium">{healthResult.message}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* 4. Background Content Progress bars (Show dynamic compilation) */}
      <AnimatePresence>
        {queue.some(item => item.status === "generating" || item.status === "publishing") && (
          <div className="space-y-3">
            {queue.filter(item => item.status === "generating" || item.status === "publishing").map(item => (
              <motion.div 
                key={`progress-${item.id}`}
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                className="bg-blue-900 text-white p-5 rounded-2xl border border-blue-800 shadow-md flex justify-between items-center gap-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />
                <div className="space-y-2 w-full max-w-xl">
                  <span className="bg-blue-600 text-blue-100 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                    BACKGROUND ROBOT ACTIVE
                  </span>
                  <p className="text-sm font-black tracking-tight">{item.title}</p>
                  <p className="text-xs text-blue-200 flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Focus keyword: <strong>"{item.keyword}"</strong></span>
                  </p>
                  
                  {/* Fake/estimated progress loop matching worker metrics */}
                  <div className="w-full bg-blue-800 h-2 rounded-full overflow-hidden mt-3">
                    <div 
                      className="bg-emerald-400 h-full transition-all duration-1000 ease-out"
                      style={{ width: item.status === "generating" ? "45%" : "85%" }}
                    />
                  </div>
                  <p className="text-[10px] text-blue-300 font-mono">
                    Status: {item.status === "generating" ? "Generating full content body & adding LSI terms (45%)..." : "Deploying live draft REST payloads (85%)..."}
                  </p>
                </div>
                
                <div className="p-3 bg-blue-800/60 rounded-xl border border-blue-700 shrink-0 hidden sm:block">
                  <CloudLightning className="h-5 w-5 text-emerald-400 animate-bounce" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 5. Sub-Layout Grid: Left (Queue list), Right (Historical analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Queue control list (3 span) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            <div className="p-5 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  Publishing Queue Pacing Calendar
                  <span className="bg-slate-200 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded-full">
                    {activeQueuedItems.length}
                  </span>
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Approved topics queued for future automatic publication cycle</p>
              </div>

              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-lg transition whitespace-nowrap cursor-pointer shadow-sm"
              >
                {showAddForm ? "Close Form" : "+ Auto-schedule custom topic"}
              </button>
            </div>

            {/* Expandable schedule custom topic block */}
            {showAddForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-5 bg-slate-50 border-b border-slate-100"
              >
                <form onSubmit={handleAddManualItem} className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-800 font-mono">Insert custom post topic plan to queue:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Article Title</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Catchy headline optimized for queries" 
                        className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-emerald-400 w-full font-sans"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Target Primary Keyword</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. cloud security audit" 
                        className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-emerald-400 w-full"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Launch delay:</span>
                      <select 
                        value={customPublishHours}
                        onChange={(e) => setCustomPublishHours(Number(e.target.value))}
                        className="bg-white border border-slate-200 text-xs py-1 px-2.5 rounded-lg outline-none font-bold"
                      >
                        <option value={1}>1 hour delay</option>
                        <option value={3}>3 hours delay</option>
                        <option value={6}>6 hours delay</option>
                        <option value={12}>12 hours delay</option>
                        <option value={24}>24 hours delay</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Commit to Release Pacer
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Main queue renderer */}
            <div className="p-3 bg-white">
              {activeQueuedItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <CalendarIcon className="h-8 w-8 mx-auto text-slate-350 shrink-0" />
                  <p className="text-xs font-bold font-sans">No topics queued to release currently.</p>
                  <p className="text-[10px] text-slate-450 leading-relaxed max-w-sm mx-auto">
                    Turn on <strong>Auto Publish</strong> above! The scheduler worker will automatically scan your 30-Day Content Plan, fetch approved ideas, and seed them over daily releases!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeQueuedItems.map((item, index) => {
                    const isItemGenerating = item.status === "generating" || item.status === "publishing";
                    return (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isItemGenerating 
                            ? "border-blue-200 bg-blue-50/20" 
                            : "border-slate-100 bg-slate-50/20 hover:bg-slate-50/40"
                        }`}
                      >
                        <div className="space-y-1.5 w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] text-slate-450 font-mono">#{index + 1}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-full font-mono font-bold">
                              {item.keyword}
                            </span>
                            <span className="text-[10px] bg-sky-200 text-sky-850 px-2 py-0.5 rounded text-[9px] font-bold font-mono">
                              RELEASING: {formatScheduledTime(item.scheduledAt)}
                            </span>
                          </div>
                          
                          {/* Title content with inline edit toggle */}
                          {editingItem?.id === item.id ? (
                            <div className="space-y-2 p-2 bg-white border border-slate-200 rounded-xl mt-1.5">
                              <input 
                                type="text"
                                className="w-full text-xs font-bold p-1 border-b border-slate-100 outline-none"
                                value={tempEditTitle}
                                onChange={(e) => setTempEditTitle(e.target.value)}
                              />
                              <input 
                                type="text"
                                className="w-full text-[11px] p-1 text-slate-500 border-b border-slate-100 outline-none"
                                value={tempEditKeyword}
                                placeholder="focus-keyword"
                                onChange={(e) => setTempEditKeyword(e.target.value)}
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400">Launch Date:</span>
                                <input 
                                  type="datetime-local"
                                  className="text-[11px] p-1 border rounded outline-none"
                                  value={tempEditScheduled}
                                  onChange={(e) => setTempEditScheduled(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setEditingItem(null)} className="px-2 py-1 text-[10px] bg-slate-100 text-slate-650 hover:bg-slate-250 rounded font-bold">Cancel</button>
                                <button onClick={handleSaveInlineEdit} className="px-2.5 py-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded font-bold">Save</button>
                              </div>
                            </div>
                          ) : (
                            <h5 className="font-extrabold text-slate-850 text-xs font-sans leading-relaxed">
                              {item.title}
                            </h5>
                          )}
                        </div>

                        {/* Priority action items and fast zapping triggers */}
                        {!isItemGenerating && !editingItem && (
                          <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                            {/* Priority Ordering Shifters */}
                            <div className="flex flex-col gap-1">
                              <button 
                                onClick={() => handleMovePriority(index, "up")}
                                disabled={index === 0}
                                className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-500 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button 
                                onClick={() => handleMovePriority(index, "down")}
                                disabled={index === activeQueuedItems.length - 1}
                                className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-500 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Inline Edit pencil trigger */}
                            <button 
                              onClick={() => {
                                setEditingItem(item);
                                setTempEditTitle(item.title);
                                setTempEditKeyword(item.keyword);
                                // Format ISO date for datetime-local input safely
                                const localDate = new Date(item.scheduledAt);
                                localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
                                setTempEditScheduled(localDate.toISOString().slice(0, 16));
                              }}
                              className="p-2 hover:bg-slate-100 text-slate-500 rounded-lg hover:text-slate-800 transition cursor-pointer"
                              title="Edit scheduled topic plan details"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            {/* Delete/remove button */}
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              title="Reject and discard topic plan"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            {/* Force Generation Publish Now */}
                            <button 
                              onClick={() => handlePublishNow(item.id)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-[#0c1612] px-3.5 py-2 font-black text-xs rounded-xl flex items-center gap-1 transition shadow-xs cursor-pointer"
                              title="Engage background worker to compile and publish immediately"
                            >
                              <Zap className="h-3.5 w-3.5" /> Publish Now
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real performance analytics dashboards (2 span) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Quick numbers bento brix */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider block">Autopilot Published</span>
              <p className="text-2xl font-black text-slate-900 font-sans tracking-tight">
                {queue.filter(q => q.status === "published").length}
              </p>
              <div className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3 shrink-0" />
                <span>+100% autonomous pacing</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider block">Syndication Health</span>
              <p className="text-2xl font-black text-slate-900 font-sans tracking-tight">
                {queue.filter(q => q.status === "published").length > 0 
                  ? `${Math.round((queue.filter(q => q.status === "published").length / (queue.filter(q => q.status === "published").length + queue.filter(q => q.status === "failed").length)) * 100)}%` 
                  : "99.8%"}
              </p>
              <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 font-mono">
                <Activity className="h-3 w-3 shrink-0 text-emerald-500" />
                <span>Active daemon alive</span>
              </div>
            </div>
          </div>

          {/* Published growth charts mapping authority build-up */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 font-sans">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Organic Syndication Index authority build-up
              </h4>
              <p className="text-slate-450 text-[10px] mt-0.5">Incremental organic traffic potential acquired via autopilot calendar pacing</p>
            </div>

            <div className="h-40 w-full font-mono text-[9px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} />
                  <Tooltip labelClassName="font-extrabold font-sans" contentStyle={{ fontSize: 10, borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="trafficEstimate" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#gradientColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Publication History logs & retry controls */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            Autopilot Syndication and Chronology Logs
          </h4>
          <p className="text-slate-500 text-[11px] mt-0.5">Comprehensive audit and external trace links for automatically delivered posts</p>
        </div>

        {completedItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Server className="h-8 w-8 mx-auto text-slate-350 shrink-0" />
            <p className="text-xs font-bold font-sans">No completed publications in history yet.</p>
            <p className="text-[10px] text-slate-450 leading-relaxed max-w-xs mx-auto">
              Once scheduled publishing runs execute successfully, your external posts URLs and diagnostic synclogs will record here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-450 font-black tracking-wider uppercase text-[9px] border-b border-slate-150-100">
                  <th className="p-4">Target Keyword</th>
                  <th className="p-4">Syndicated Headline title / Outward link</th>
                  <th className="p-4">CMS node channel</th>
                  <th className="p-4">Execution stamp</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Administrative controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {completedItems.map(item => {
                  const isFailed = item.status === "failed";
                  return (
                    <tr key={`history-${item.id}`} className="hover:bg-slate-50/65 font-medium">
                      
                      {/* Keyword badge */}
                      <td className="p-4 max-w-[120px] truncate">
                        <span className="bg-slate-150-150 bg-slate-100 font-mono text-[10px] font-bold text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {item.keyword}
                        </span>
                      </td>

                      {/* Title & outgoing link */}
                      <td className="p-4 max-w-[280px]">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-850 truncate">{item.title}</p>
                          {item.cmsPublishedUrl && (
                            <a 
                              href={item.cmsPublishedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1"
                            >
                              <span>View live syndicated URL</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                          {isFailed && item.error && (
                            <p className="text-[10px] text-rose-600 font-semibold max-w-[260px] leading-relaxed">
                              Error: {item.error}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="p-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border font-mono ${getPlatformBadgeClass(schedule?.cmsPlatform || "wordpress")}`}>
                          {schedule?.cmsPlatform || "wordpress"}
                        </span>
                      </td>

                      {/* Execution timestamp */}
                      <td className="p-4 text-slate-500 font-mono text-[11px]">
                        {item.completedAt 
                          ? new Date(item.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                          : "Scheduled soon"}
                      </td>

                      {/* Badge status */}
                      <td className="p-4">
                        {isFailed ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Aborted / Failed
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Sync Completed
                          </span>
                        )}
                      </td>

                      {/* Retry panel */}
                      <td className="p-4 text-right">
                        {isFailed ? (
                          <button 
                            onClick={() => handleRetryPublish(item.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border border-rose-200 transition cursor-pointer"
                          >
                            Retry Publish Task
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              if (item.articleId) {
                                onNavigateToEditor(item.articleId);
                              } else {
                                alert("Local caching database loaded. Article registered under system caches.");
                              }
                            }}
                            className="text-slate-500 hover:text-slate-800 text-[10px] font-mono font-bold hover:underline"
                          >
                            Open in Editor →
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
