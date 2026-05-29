import React, { useState, useEffect } from "react";
import {
  CreditCard,
  TrendingUp,
  Coins,
  Layers,
  Settings,
  Activity,
  FileText,
  CheckCircle2,
  Plus,
  Minus,
  Building2,
  ShieldCheck,
  BarChart3,
  Sparkles,
  ArrowRight,
  Info,
  Sliders,
  DollarSign,
  Briefcase,
  History
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface BillingDashboardViewProps {
  projectsCount: number;
  activePlan: "free" | "premium";
  setActivePlan: (plan: "free" | "premium") => void;
  userId?: string;
}

export default function BillingDashboardView({
  projectsCount = 0,
  activePlan = "free",
  setActivePlan,
  userId = "demo-user"
}: BillingDashboardViewProps) {
  // System configurations & statistics states
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({
    enabled: true,
    basePricePerSite: 99,
    tiers: [
      { min: 1, max: 1, discountPercent: 0, name: "Standard Starter" },
      { min: 2, max: 4, discountPercent: 10, name: "Growth Duo/Team" },
      { min: 5, max: 19, discountPercent: 15, name: "Pro Agency" },
      { min: 20, max: 9999, discountPercent: 20, name: "Enterprise Suite" }
    ]
  });

  const [historyData, setHistoryData] = useState<any>({
    logs: [],
    adjustments: [],
    history: [],
    currentSubscription: null
  });

  const [analytics, setAnalytics] = useState<any>({
    totalDiscountsApplied: 0,
    totalSavingsAmount: 0,
    averageSitesPerAccount: 1,
    revenueImpactPercent: 0,
    tierUtilization: { "0%": 0, "10%": 0, "15%": 0, "20%": 0 },
    activeSubscriptionsCount: 1,
    actualRevenueTotal: 0,
    originalRevenueTotal: 0,
    logsFeed: [],
    adjustmentsFeed: []
  });

  // Admin panel editing states
  const [editingBasePrice, setEditingBasePrice] = useState(99);
  const [editingEnabled, setEditingEnabled] = useState(true);
  const [editingTiers, setEditingTiers] = useState<any[]>([]);
  const [adminActiveTab, setAdminActiveTab] = useState<"dashboard" | "controls" | "analytics">("dashboard");
  const [saveMessage, setSaveMessage] = useState("");

  // Simulated Slider for custom site counts during dynamic checkout exploration
  const [simulatedSiteCount, setSimulatedSiteCount] = useState<number>(() => Math.max(1, projectsCount));

  // Loading triggers
  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch Config
      const configRes = await fetch("/api/billing/config");
      if (configRes.ok) {
        const configJson = await configRes.json();
        setConfig(configJson.config);
        setEditingBasePrice(configJson.config.basePricePerSite);
        setEditingEnabled(configJson.config.enabled);
        setEditingTiers(configJson.config.tiers);
      }

      // Fetch User History
      const historyRes = await fetch(`/api/billing/history?userId=${userId}`);
      if (historyRes.ok) {
        const historyJson = await historyRes.json();
        setHistoryData(historyJson);
      }

      // Fetch Analytics
      const analyticsRes = await fetch("/api/billing/analytics");
      if (analyticsRes.ok) {
        const analyticsJson = await analyticsRes.json();
        setAnalytics(analyticsJson.analytics);
      }
    } catch (e) {
      console.error("Failed to load billing dynamic systems:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [userId, projectsCount]);

  // Recalculate billing values automatically
  const triggerRecalculate = async (targetSitesCount: number) => {
    try {
      const res = await fetch("/api/billing/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          activeSitesCount: targetSitesCount
        })
      });
      if (res.ok) {
        const json = await res.json();
        // Update state
        setActivePlan("premium");
        localStorage.setItem("rs_active_plan", "premium");
        fetchAllData(); // Refresh history and charts
        return json;
      }
    } catch (e) {
      console.error("Failed to run active recalculation:", e);
    }
    return null;
  };

  // Save new configuration bounds to server database
  const saveConfigToServer = async () => {
    try {
      const res = await fetch("/api/billing/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: editingEnabled,
          basePricePerSite: editingBasePrice,
          tiers: editingTiers
        })
      });
      if (res.ok) {
        const json = await res.json();
        setConfig(json.config);
        setSaveMessage("Tiers and price controls synchronized perfectly!");
        setTimeout(() => setSaveMessage(""), 4000);
        // Instant refresh
        fetchAllData();
      }
    } catch (e) {
      console.error("Failed storing custom billing configuration:", e);
    }
  };

  // Helper selectors for dynamic state
  const runningSites = projectsCount || 1;
  
  // Calculate current indicators matching the connected site size
  const getCurrentDiscountDetails = (sites: number) => {
    if (!config.enabled) return { percent: 0, tierName: "Disabled" };
    const matchingTier = config.tiers.find((t: any) => sites >= t.min && sites <= t.max);
    return {
      percent: matchingTier ? matchingTier.discountPercent : 0,
      tierName: matchingTier ? matchingTier.name : "None"
    };
  };

  const currentDetails = getCurrentDiscountDetails(runningSites);
  const baseCost = runningSites * config.basePricePerSite;
  const savings = baseCost * (currentDetails.percent / 100);
  const finalPrice = baseCost - savings;

  // Let's get the Next tier requirements
  const getNextTierDetails = (sites: number) => {
    const sortedTiers = [...config.tiers].sort((a: any, b: any) => a.min - b.min);
    const next = sortedTiers.find((t: any) => t.min > sites);
    if (!next) return null;
    return {
      minNeeded: next.min,
      additionalSitesNeeded: next.min - sites,
      targetPercent: next.discountPercent,
      name: next.name
    };
  };

  const nextTier = getNextTierDetails(runningSites);

  // Dynamic progress percentage for visual progress bar
  const calculateProgress = () => {
    if (!nextTier) return 100;
    const currentTierBounds = config.tiers.filter((t: any) => t.discountPercent < nextTier.targetPercent);
    const prevMax = currentTierBounds.length > 0 ? Math.max(...currentTierBounds.map((b: any) => b.min)) : 0;
    const range = nextTier.minNeeded - prevMax;
    const progress = Math.min(100, Math.max(0, ((runningSites - prevMax) / (range || 1)) * 100));
    return progress;
  };

  // Recharts color palettes
  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6"];
  const pieData = Object.keys(analytics.tierUtilization || {}).map((key) => ({
    name: `Tier ${key} Off`,
    value: analytics.tierUtilization[key] || 0
  }));

  return (
    <div className="space-y-6" id="volume-discount-dashboard">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          RankSyncer Billing & Volume Discounts
          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
            AUTOMATED ENGINE
          </span>
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Deploy premium multi-tenant SEO pipelines. Volume discounts scale automatically based on connected sites.
        </p>
      </div>

      {/* Primary Tab Bar */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setAdminActiveTab("dashboard")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            adminActiveTab === "dashboard"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>User Billing Dashboard</span>
        </button>
        <button
          onClick={() => setAdminActiveTab("controls")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            adminActiveTab === "controls"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Admin Discount Settings</span>
        </button>
        <button
          onClick={() => setAdminActiveTab("analytics")}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            adminActiveTab === "analytics"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Macro Revenue Analytics</span>
        </button>
      </div>

      {/* Loader indicator state */}
      {loading && (
        <div className="p-8 text-center bg-white border border-slate-150 rounded-2xl animate-pulse text-indigo-600 font-semibold text-xs flex items-center justify-center gap-2">
          <span className="animate-spin h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent rounded-full" />
          Loading Billing Engine Matrix...
        </div>
      )}

      {!loading && (
        <>
          {/* TAB 1: USER BILLING DASHBOARD */}
          {adminActiveTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Stat Bento Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Stat 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs hover:border-indigo-100 transition duration-300">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Connected Sites</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-slate-900">{runningSites}</span>
                    <span className="text-slate-400 text-[10px] font-bold">domain{runningSites !== 1 ? 's' : ''} active</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium mt-1 inline-flex items-center gap-1">
                    <Activity className="h-2.5 w-2.5 text-[#10b981]" />
                    Real-time count detected
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs hover:border-indigo-100 transition duration-300">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Discount Tier</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-indigo-600">
                      {currentDetails.percent}%
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                      {currentDetails.tierName}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium mt-1">
                    Matched automatically to portfolio
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs hover:border-indigo-100 transition duration-300">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Monthly Savings</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-emerald-600">
                      ${savings.toFixed(2)}
                    </span>
                    <span className="text-slate-400 text-[10px] font-semibold">USD</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium mt-1">
                    Estimated ${ (savings * 12).toFixed(2) } annually
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/15 shadow-3xs transition duration-300">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500">Subscription Total</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-slate-900">
                      ${finalPrice.toFixed(2)}
                    </span>
                    <span className="text-slate-500 text-[10px] font-bold">/month</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold line-through">
                    Original Price: ${baseCost.toFixed(2)}
                  </div>
                </div>

              </div>

              {/* Volume Discount Progress Panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Volume Discount Progress
                  </h3>
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Tier Progress: {calculateProgress().toFixed(0)}%
                  </span>
                </div>

                <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${calculateProgress()}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500 cursor-pointer"
                  />
                </div>

                {/* Status indicator context lines */}
                <div className="flex items-start gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Current Plan State</p>
                    <p className="text-xs font-black text-slate-800 mt-1">
                      {runningSites} Active Sites connected
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Your pricing rate benefits from a <span className="font-bold text-indigo-600">{currentDetails.percent}% volume rebate</span>.
                    </p>
                  </div>

                  {nextTier ? (
                    <div className="bg-indigo-50/30 p-3.5 rounded-xl border border-indigo-100/50 flex-1">
                      <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Next Tier Target</p>
                      <p className="text-xs font-black text-indigo-950 mt-1">
                        Unlock {nextTier.targetPercent}% Off Tier!
                      </p>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        Add <span className="font-extrabold text-indigo-600">{nextTier.additionalSitesNeeded} more site{nextTier.additionalSitesNeeded !== 1 ? 's' : ''}</span> to reach the <span className="font-bold">{nextTier.name}</span>. Save an average of ${(config.basePricePerSite * nextTier.targetPercent / 100).toFixed(0)} per node!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/30 p-3.5 rounded-xl border border-emerald-100/50 flex-1 flex flex-col justify-center">
                      <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Tier Achieved</p>
                      <p className="text-xs font-black text-emerald-950 mt-1 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Highest Tier Active!
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        You have unlocked the standard limit volume discount of <span className="font-extrabold text-emerald-600">20% off</span>. For 100+ sites setups, click talk to us in pricing page.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Checkout Experience & Real-time Calculator */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Simulator slider card block */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-indigo-500" />
                        Dynamic Checkout & Pricing Sandbox
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Explore how the subscription rates scale as sites are added/removed below</p>
                    </div>
                  </div>

                  {/* Range slider */}
                  <div className="space-y-3 bg-slate-50 p-4.5 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Simulated Active Sites Count:</span>
                      <span className="text-indigo-600 font-black text-base">{simulatedSiteCount} Sites</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={simulatedSiteCount}
                      onChange={(e) => setSimulatedSiteCount(parseInt(e.target.value))}
                      className="w-full text-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>1 Site (Base)</span>
                      <span>5 Sites (15% Off)</span>
                      <span>10 Sites (15% Off)</span>
                      <span>20+ Sites (20% Off)</span>
                    </div>
                  </div>

                  <div className="bg-indigo-50/20 border border-dashed border-indigo-100 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex gap-2.5 items-center">
                      <div className="h-9 w-9 bg-white text-indigo-600 border border-indigo-100 rounded-lg flex items-center justify-center font-bold text-sm">
                        %
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-800">Assign New Volume pricing</p>
                        <p className="text-[10px] text-slate-500">Recalculate subscription matching this site count in backend</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => triggerRecalculate(simulatedSiteCount)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white text-[11px] font-black rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
                    >
                      Apply Volume Rate
                    </button>
                  </div>
                </div>

                {/* Checkout pricing receipt visualizer */}
                <div className="lg:col-span-5 bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest pb-2 border-b border-slate-800 flex items-center justify-between">
                      <span>Checkout Receipt</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Live Simulation</span>
                    </h4>

                    {/* Calculated values */}
                    {(() => {
                      const simDetails = getCurrentDiscountDetails(simulatedSiteCount);
                      const simBase = simulatedSiteCount * config.basePricePerSite;
                      const simSavings = simBase * (simDetails.percent / 100);
                      const simPrice = simBase - simSavings;

                      return (
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between font-medium">
                            <span className="text-slate-450">Base Price ({simulatedSiteCount} node{simulatedSiteCount !== 1 ? 's' : ''}):</span>
                            <span className="font-mono text-slate-100">${simBase.toFixed(2)} / month</span>
                          </div>
                          
                          <div className="flex justify-between font-medium">
                            <span className="text-slate-450">Base Price rate:</span>
                            <span className="font-mono text-slate-100">${config.basePricePerSite} / month per site</span>
                          </div>

                          <div className="flex justify-between font-bold text-emerald-400">
                            <span>Volume Discount Tag ({simDetails.percent}% Off):</span>
                            <span className="font-mono">-${simSavings.toFixed(2)}</span>
                          </div>

                          <div className="h-px bg-slate-800 pt-1" />

                          <div className="flex justify-between items-baseline pt-2">
                            <span className="text-xs font-black text-white uppercase tracking-wider">Final Price:</span>
                            <div className="text-right">
                              <span className="text-2xl font-black font-mono text-indigo-400">
                                ${simPrice.toFixed(2)}
                              </span>
                              <span className="text-[9px] text-slate-550 block font-bold">USD / Month</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="text-center pt-2 select-none">
                    <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase flex items-center justify-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                      Dynamic calculations computed in backend
                    </span>
                  </div>
                </div>

              </div>

              {/* Dynamic Invoice Simulator Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-150">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      Invoice Ledger Audit
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Automated invoice records displaying discount details and line-item charges</p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-500 font-mono">
                    Total Records: {historyData.adjustments?.length || 0}
                  </span>
                </div>

                {historyData.adjustments?.length === 0 ? (
                  <div className="text-slate-400 text-xs text-center p-6 bg-slate-50 rounded-xl">
                    No billing adjustment adjustments logged. Complete a dynamic checkout update above!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historyData.adjustments?.map((adj: any, idx: number) => (
                      <div key={adj.id || idx} className="bg-slate-50 rounded-xl p-4 border border-slate-150 relative overflow-hidden flex flex-col justify-between">
                        
                        <div className="flex justify-between items-start pb-2 border-b border-slate-200">
                          <div>
                            <p className="text-[10px] font-black font-mono text-indigo-600">INVOICE #{adj.id}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">
                              Applied: {new Date(adj.applied_at).toLocaleString()}
                            </p>
                          </div>
                          
                          <span className="text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full uppercase">
                            PAID SYSTEM
                          </span>
                        </div>

                        {/* Invoice Calculations Content */}
                        <div className="space-y-1.5 pt-3 text-xs font-medium text-slate-600">
                          <div className="flex justify-between">
                            <span>Account Sites Portfolio:</span>
                            <span className="font-bold text-slate-800">{adj.active_sites} site{adj.active_sites !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Base Rate:</span>
                            <span className="font-mono text-slate-800">${config.basePricePerSite}.00 / site</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Base Cost:</span>
                            <span className="font-mono text-slate-800">${adj.original_price?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-600 font-black">
                            <span>Volume Rebate Applied:</span>
                            <span className="font-mono">-${adj.adjustment_amount?.toFixed(2)}</span>
                          </div>

                          <div className="h-px bg-slate-200 mt-2" />

                          <div className="flex justify-between pt-1 font-bold text-slate-950">
                            <span>Final Amount Charged:</span>
                            <span className="font-mono text-indigo-600 text-sm font-black">${adj.discounted_price?.toFixed(2)}</span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: ADMIN CONFIGURATION CONTROLS */}
          {adminActiveTab === "controls" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="h-4.5 w-4.5 text-indigo-500 animate-spin" style={{ animationDuration: "8s" }} />
                    Volume Discount Admin Control Center
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure base nodes price, configure discount thresholds, or disable/enable calculations
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-500 uppercase">Engine Status</span>
                  <button
                    onClick={() => setEditingEnabled(!editingEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                      editingEnabled ? "bg-indigo-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-250 ease-in-out ${
                        editingEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Message indicators */}
              {saveMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-black text-center animate-fade-in">
                  {saveMessage}
                </div>
              )}

              {/* Base pricing input config */}
              <div className="p-5 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <Coins className="h-4 w-4 text-[#eab308]" />
                  Base Subscription Rate Configuration
                </h4>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] uppercase font-black text-slate-450 block">Standard Price Per Site</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        value={editingBasePrice}
                        onChange={(e) => setEditingBasePrice(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full pl-8 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-850"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                      Adjusting this rate changes the standard monthly site portfolio rate instantly. Calculations in client dashboards recalculate accordingly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tier sliders adjustment block */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Discount Tiers Threshold and Percentages
                </h4>

                <div className="space-y-2.5">
                  {editingTiers.map((tier, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4.5 rounded-xl border border-slate-200 relative">
                      {/* Name of Tier */}
                      <div className="flex-1 space-y-1 min-w-[200px]">
                        <span className="text-[10px] font-black uppercase text-slate-400 uppercase tracking-wider">
                          Tier Name
                        </span>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => {
                            const copy = [...editingTiers];
                            copy[idx].name = e.target.value;
                            setEditingTiers(copy);
                          }}
                          className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        />
                      </div>

                      {/* Threshold Minimum */}
                      <div className="w-24 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Min Sites
                        </span>
                        <input
                          type="number"
                          value={tier.min}
                          onChange={(e) => {
                            const copy = [...editingTiers];
                            copy[idx].min = Math.max(1, parseInt(e.target.value) || 1);
                            setEditingTiers(copy);
                          }}
                          className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                        />
                      </div>

                      {/* Threshold Maximum */}
                      <div className="w-24 space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Max Sites
                        </span>
                        <input
                          type="number"
                          value={tier.max === 9999 ? "" : tier.max}
                          placeholder="Infinite"
                          onChange={(e) => {
                            const copy = [...editingTiers];
                            copy[idx].max = e.target.value === "" ? 9999 : (parseInt(e.target.value) || 9999);
                            setEditingTiers(copy);
                          }}
                          className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                        />
                      </div>

                      {/* Percentage Rebate */}
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between items-center pr-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            Rebate %
                          </span>
                        </div>
                        <input
                          type="number"
                          value={tier.discountPercent}
                          onChange={(e) => {
                            const copy = [...editingTiers];
                            copy[idx].discountPercent = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                            setEditingTiers(copy);
                          }}
                          className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin configuration actions bar */}
              <div className="pt-4 border-t border-slate-150 flex justify-end">
                <button
                  onClick={saveConfigToServer}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-slate-900 border border-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm"
                >
                  Synchronize Discount Configuration
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MACRO REVENUE ANALYTICS */}
          {adminActiveTab === "analytics" && (
            <div className="space-y-6">
              
              {/* Stat Bento Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Stat 1 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Total Discounts Triggered</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{analytics.totalDiscountsApplied || 0}</p>
                  <p className="text-[9px] text-[#10b981] font-semibold mt-1">
                    Logged adjustments history
                  </p>
                </div>

                {/* Stat 2 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Aggregated Savings Amount</p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">${analytics.totalSavingsAmount?.toFixed(0) || 0}</p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">
                    Value retained back by users
                  </p>
                </div>

                {/* Stat 3 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Average Sites / User</p>
                  <p className="text-3xl font-black text-indigo-600 mt-1">{analytics.averageSitesPerAccount || 0.0}</p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">
                    Multi-site adoption rate average
                  </p>
                </div>

                {/* Stat 4 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Revenue Impact Gaps</p>
                  <p className="text-3xl font-black text-rose-500 mt-1">{analytics.revenueImpactPercent || 0}%</p>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">
                    Rebated percentage vs raw revenue
                  </p>
                </div>

              </div>

              {/* Analytics graphics structures inside Recharts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Bar chart - Raw vs discounted */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    MRR Streams: Raw Revenue vs Discounted Revenue
                  </h4>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Macro Subscriptions MRR",
                            "Original Gross Revenue": analytics.originalRevenueTotal || 500.00,
                            "Actual Net Revenue": analytics.actualRevenueTotal || 420.75
                          }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="Original Gross Revenue" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Actual Net Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie chart - Tier density */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4 flex flex-col justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Tier Utilization Breakdown
                  </h4>

                  <div className="h-44 flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData.some(d => d.value > 0) ? pieData : [{ name: "No Logs", value: 1 }]}
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    {pieData.map((dataPoint, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          {dataPoint.name}
                        </span>
                        <span className="font-mono text-slate-800">{dataPoint.value} occurrences</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Master system audit telemetry feed */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <History className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
                  System Volume Discount Telemetry Logs
                </h4>

                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {analytics.logsFeed?.length === 0 ? (
                    <p className="text-xs text-slate-450 p-4 text-center">No calculations compiled recently.</p>
                  ) : (
                    analytics.logsFeed?.map((log: any, idx: number) => (
                      <div key={log.id || idx} className="py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 gap-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
                          <span>User <span className="font-mono text-slate-900">{log.user_id}</span> updated connected site size to <span className="text-indigo-600 font-bold">{log.active_sites} site{log.active_sites !== 1 ? 's' : ''}</span></span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">{new Date(log.applied_at).toLocaleTimeString()}</span>
                          <span className="text-emerald-500 font-black">Applied {log.discount_percentage}% discount</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
}
