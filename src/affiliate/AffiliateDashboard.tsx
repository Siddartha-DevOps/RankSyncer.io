import React, { useState, useEffect } from "react";
import { 
  Award, 
  Copy, 
  Check, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Activity, 
  ArrowUpRight, 
  ChevronRight, 
  Layers, 
  Clock, 
  Image, 
  FileText, 
  Download, 
  CreditCard, 
  AlertCircle, 
  Play, 
  RefreshCw,
  Zap,
  UserCheck,
  Percent,
  XCircle,
  PiggyBank
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AffiliateCMSConfig } from "./types";

interface AffiliateDashboardProps {
  userId: string;
  userEmail: string;
  backendConfig?: AffiliateCMSConfig;
  onExit: () => void;
}

export default function AffiliateDashboard({
  userId,
  userEmail,
  backendConfig,
  onExit
}: AffiliateDashboardProps) {
  // Sync States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Copy success indicator states
  const [copiedLink, setCopiedLink] = useState<any>(null);
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);

  // Payout request variables
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("wise");
  const [paymentAddress, setPaymentAddress] = useState<string>("");
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);

  // Simulation variables
  const [simCampaign, setSimCampaign] = useState<string>("twitter");
  const [simEmail, setSimEmail] = useState<string>("");
  const [simAction, setSimAction] = useState<string>("paid");
  const [simPlanName, setSimPlanName] = useState<string>("Premium Autopilot Suite");
  const [simMrr, setSimMrr] = useState<number>(49);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Fetch Affiliate Data
  const fetchAffiliateData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/affiliate/account?userId=${encodeURIComponent(userId)}`);
      const body = await res.json();
      if (body.success) {
        setData(body.analytics);
        // Default payout address if empty
        if (body.analytics.account?.payment_address) {
          setPaymentAddress(body.analytics.account.payment_address);
        }
        if (body.analytics.account?.payment_method) {
          setPaymentMethod(body.analytics.account.payment_method);
        }
      } else {
        setError(body.error || "Failed to load affiliate telemetry");
      }
    } catch (e: any) {
      setError(e.message || "Network error loading partner coordinates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateData();
  }, [userId]);

  // Handle Join (in case they got routed here and accounts didn't load)
  const handleJoin = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/affiliate/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, customCode: `PARTNER-${userId.slice(0, 4).toUpperCase()}` })
      });
      const body = await res.json();
      if (body.success) {
        setData(body.analytics);
      } else {
        setError(body.error || "Failed to instantiate account");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Clipboard Copier
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink({ [id]: true });
    setTimeout(() => {
      setCopiedLink(null);
    }, 2000);
  };

  // Request Payout Action
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSuccess(null);

    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum < 50) {
      setPayoutError("Minimum eligible payout withdrawal is $50.00 USD");
      return;
    }

    if (!paymentAddress.trim()) {
      setPayoutError("Please enter your target payout details/email coordinates");
      return;
    }

    try {
      const res = await fetch("/api/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: amountNum,
          method: paymentMethod,
          address: paymentAddress
        })
      });
      const body = await res.json();
      if (body.success) {
        setPayoutSuccess(`Successfully logged withdrawal request for $${amountNum.toFixed(2)} USD!`);
        setPayoutAmount("");
        // Reload dashboard sync data
        fetchAffiliateData();
        setTimeout(() => {
          setShowPayoutModal(false);
          setPayoutSuccess(null);
        }, 3000);
      } else {
        setPayoutError(body.error || "Failed to log withdrawal query");
      }
    } catch (err: any) {
      setPayoutError(err.message || "Network issue requesting payout");
    }
  };

  // Perform Simulation
  const runActionSimulation = async (simType: "click" | "signup") => {
    try {
      setSimulating(true);
      const url = simType === "click" ? "/api/affiliate/simulate-click" : "/api/affiliate/simulate-signup";
      const payload = simType === "click" 
        ? { referralCode: data.account.referral_code, campaign: simCampaign }
        : { referralCode: data.account.referral_code, email: simEmail, action: simAction, planName: simPlanName, mrr: simMrr };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (body.success) {
        alert(`${simType === "click" ? "Link Click" : "Referral Conversion"} simulated successfully! Refreshing analytics dashboard...`);
        // clear local inputs
        if (simType === "signup") {
          setSimEmail("");
        }
        fetchAffiliateData();
      } else {
        alert(`Simulation blocked: ${body.error}`);
      }
    } catch (e: any) {
      alert(`Simulation failed: ${e.message}`);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-4">
        <RefreshCw className="h-6 w-6 text-emerald-500 animate-spin" />
        Synchronizing Partner Telemetry...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-3xl text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <h3 className="font-extrabold text-sm text-slate-900">Affiliate Portal Error</h3>
        <p className="text-xs text-slate-600 max-w-sm mx-auto">{error || "No dashboard state active for this profile credentials."}</p>
        <button 
          onClick={handleJoin}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer"
        >
          Initialize Account Now
        </button>
      </div>
    );
  }

  // Generate chart data based on dynamic clicks / referrals for trend visual
  // Since we might not have a lot of items, let's build interactive trend points representing clicks vs registrations
  const chartData = [
    { name: "Mon", Clicks: data.totalClicks ? Math.max(1, Math.round(data.totalClicks * 0.1)) : 0, Refs: data.totalReferrals ? Math.max(0, Math.round(data.totalReferrals * 0.15)) : 0 },
    { name: "Tue", Clicks: data.totalClicks ? Math.max(1, Math.round(data.totalClicks * 0.15)) : 0, Refs: data.totalReferrals ? Math.max(0, Math.round(data.totalReferrals * 0.1)) : 0 },
    { name: "Wed", Clicks: data.totalClicks ? Math.max(2, Math.round(data.totalClicks * 0.2)) : 0, Refs: data.totalReferrals ? Math.max(1, Math.round(data.totalReferrals * 0.3)) : 0 },
    { name: "Thu", Clicks: data.totalClicks ? Math.max(1, Math.round(data.totalClicks * 0.18)) : 0, Refs: data.totalReferrals ? Math.max(0, Math.round(data.totalReferrals * 0.1)) : 0 },
    { name: "Fri", Clicks: data.totalClicks ? Math.max(3, Math.round(data.totalClicks * 0.25)) : 0, Refs: data.totalReferrals ? Math.max(1, Math.round(data.totalReferrals * 0.2)) : 0 },
    { name: "Sat", Clicks: data.totalClicks ? Math.max(1, Math.round(data.totalClicks * 0.08)) : 0, Refs: data.totalReferrals ? Math.max(0, Math.round(data.totalReferrals * 0.05)) : 0 },
    { name: "Sun", Clicks: data.totalClicks ? Math.max(1, Math.round(data.totalClicks * 0.04)) : 0, Refs: data.totalReferrals ? Math.max(0, Math.round(data.totalReferrals * 0.1)) : 0 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-600 bg-emerald-150 px-2 py-0.5 rounded">Partner Platform</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <Award className="h-5 w-5 text-indigo-600" /> Affiliate Hub Studio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered Partner ID: <span className="font-mono text-slate-800 font-extrabold select-all">{data.account?.affiliate_id}</span> • Commission split: <span className="font-mono text-indigo-750 font-bold">{data.account?.commission_rate || 30}% recurring</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchAffiliateData}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-xl border border-slate-200 transition-all cursor-pointer hover:shadow-2xs active:scale-95 flex items-center justify-center"
            title="Refresh Analytics Buffer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            onClick={onExit}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-150 text-slate-700 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
          >
            View Landing Info
          </button>
        </div>
      </div>

      {/* Overview stats layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/95 space-y-1 shadow-3xs hover:border-slate-350 transition-colors">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Clicks logged</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black font-mono text-slate-800">{data.totalClicks}</h3>
            <span className="text-[9px] font-mono text-slate-400">Total clicks</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/95 space-y-1 shadow-3xs hover:border-slate-350 transition-colors">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Referrals</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black font-mono text-slate-800">{data.totalReferrals}</h3>
            <span className="text-[9px] font-mono text-emerald-600 block">+{data.totalReferrals} signups</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/95 space-y-1 shadow-3xs hover:border-slate-350 transition-colors">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Conversions</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black font-mono text-slate-800">{data.activeCustomers}</h3>
            <span className="text-[9px] font-mono text-indigo-600 block">paying</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/95 space-y-1 shadow-3xs hover:border-slate-350 transition-colors">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Conv. Rate</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black font-mono text-slate-800">{data.conversionRate}%</h3>
            <span className="text-[9px] font-mono text-[#047857]">avg click</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-[#f0fdf4] p-4 rounded-2xl border border-emerald-200 space-y-1 shadow-3xs">
          <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase tracking-wider block">Monthly Est.</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black font-mono text-emerald-800">${data.monthlyEarnings.toFixed(2)}</h3>
            <span className="text-[9px] font-mono text-slate-500 block">last 30d</span>
          </div>
        </div>

        {/* KPI 6 */}
        <div className="bg-[#f0fdf4] p-4 rounded-2xl border border-emerald-200 space-y-1 shadow-3xs">
          <span className="text-[10px] font-mono text-emerald-850 font-black uppercase tracking-wider block">Lifetime Est.</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black font-mono text-emerald-850">${data.lifetimeEarnings.toFixed(2)}</h3>
            <span className="text-[9px] font-mono text-slate-500 block">LTV stream</span>
          </div>
        </div>

        {/* KPI 7 */}
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200 space-y-1 shadow-3xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-mono text-indigo-850 font-black uppercase tracking-wider block">Pending balance</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black font-mono text-indigo-850">${data.pendingCommissions.toFixed(2)}</h3>
            <span className="text-[9px] font-mono text-indigo-700 block">unpaid</span>
          </div>
        </div>
      </div>

      {/* Referral Link & Code Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row items-center gap-6 justify-between shadow-2xs">
        <div className="space-y-1.5 max-w-xl">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
            <Zap className="h-4.5 w-4.5 text-amber-500" /> Share Your Personalized Referral Link
          </h3>
          <p className="text-slate-500 text-xs">
            Any prospect who navigates your link gets standard 60-day cookie tracking. If they sign up and subsequently upgrade to premium autopilot tiers, you earn a 30% recurring split directly!
          </p>
        </div>

        <div className="w-full md:w-auto space-y-3 shrink-0">
          {/* Main Referral URL */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-250 w-full md:w-[350px]">
            <input 
              type="text" 
              readOnly 
              value={data.account?.referral_url} 
              className="bg-transparent border-none text-[10px] font-mono text-slate-750 focus:outline-none w-full px-2"
            />
            <button
              onClick={() => copyToClipboard(data.account?.referral_url, "url")}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg shrink-0 transition-colors border border-slate-200 cursor-pointer"
            >
              {copiedLink?.url ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Simple Code Copy */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-450 font-mono">Referral Code: <span className="font-extrabold text-slate-750">{data.account?.referral_code}</span></span>
            <button
              onClick={() => copyToClipboard(data.account?.referral_code, "code")}
              className="text-[11px] font-extrabold text-[#10b981] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedLink?.code ? "Copied!" : "Copy Code"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Column Breakdown: Charts & Withdrawal, Simulators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Performance Chart & History logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recharts Area Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-900 font-sans uppercase tracking-tight flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-600" /> Weekly Traffic Conversion Metrics
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Live Simulation Sync</span>
            </div>

            <div className="h-48 w-full font-mono text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRefs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="Clicks" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                  <Area type="monotone" dataKey="Refs" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRefs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-3 text-[10px] font-mono">
              <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                <span className="h-2 w-2 bg-indigo-600 rounded-full" /> Link Clicks
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="h-2 w-2 bg-emerald-500 rounded-full" /> Registrations
              </span>
            </div>
          </div>

          {/* Referrals list */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-sans">
                My Referred Customers ({data.referralsList?.length || 0})
              </h3>
              <span className="text-[10px] font-mono text-slate-400">All conversion milestones</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-500 divide-y divide-slate-100 table-auto">
                <thead className="bg-slate-50 font-black text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  <tr>
                    <th className="px-5 py-3">Customer Email</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assigned Plan</th>
                    <th className="px-5 py-3">MRR Paid</th>
                    <th className="px-5 py-3 text-right">Signed Up At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {data.referralsList && data.referralsList.length > 0 ? (
                    data.referralsList.map((ref: any, index: number) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-extrabold text-slate-900 font-mono select-all select-none">
                          {ref.email}
                        </td>
                        <td className="px-5 py-3">
                          {ref.status === "paid" && (
                            <span className="bg-emerald-100 text-[#0f5132] px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider font-sans">Paying</span>
                          )}
                          {ref.status === "trial" && (
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider font-sans">Trialing</span>
                          )}
                          {ref.status === "signup" && (
                            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider font-sans">Registered</span>
                          )}
                          {ref.status === "cancelled" && (
                            <span className="bg-red-100 text-red-850 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider font-sans">Cancelled</span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-700 capitalize">
                          {ref.plan_name || "Free Sandbox"}
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-slate-800">
                          ${ref.mrr || 0}/mo
                        </td>
                        <td className="px-5 py-3 text-right text-slate-400 font-mono">
                          {new Date(ref.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400 font-mono text-[11px]">
                        No refereed customers registered. Try triggering an autonomous click click or conversion simulation in the right panel!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commissions list */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Commissions History ({data.commissionsList?.length || 0})
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Recurring commission statements</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-500 divide-y divide-slate-100 table-auto">
                <thead className="bg-slate-50 font-black text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  <tr>
                    <th className="px-5 py-3">Commission ID</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Payout Status</th>
                    <th className="px-5 py-3 text-right">Accrued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {data.commissionsList && data.commissionsList.length > 0 ? (
                    data.commissionsList.map((com: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-slate-800 select-all">
                          {com.id}
                        </td>
                        <td className="px-5 py-3 font-mono font-black text-[#047857]">
                          +${com.amount.toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          {com.status === "paid" && (
                            <span className="text-emerald-700 font-black">Cleared & Paid</span>
                          )}
                          {com.status === "pending" && (
                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Pending Hold</span>
                          )}
                          {com.status === "approved" && (
                            <span className="bg-emerald-100 text-[#047857] px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Approved</span>
                          )}
                          {com.status === "rejected" && (
                            <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Rejected / Refund</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-600 font-semibold capitalize">
                          {com.type}
                        </td>
                        <td className="px-5 py-3 font-mono text-slate-400 text-[10px]">
                          {com.status === "paid" ? "Processed" : "Unpaid Balance"}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-400 font-mono">
                          {new Date(com.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-mono text-[11px]">
                        No commission logs accrued. Generate conversion logs to trigger automated credit payouts!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: Request Payout, Promotion downloads & LIVE TEST HARNESS/SIMULATOR */}
        <div className="space-y-6">
          
          {/* Request Payout Action Card */}
          <div className="bg-gradient-to-br from-[#0c1310] to-[#040806] text-white p-6 rounded-3xl border border-[#14271f] shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30"><DollarSign className="h-5 w-5" /></span>
                <span className="text-[10px] font-mono text-slate-400">Min. payout $50</span>
              </div>
              <h3 className="text-base font-extrabold text-white">Request Payout Withdrawal</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Eligible balance represent approved commissions which have cleared our 30-day safety hold. Cashout anytime instantly once threshold is crossed.
              </p>
              
              <div className="pt-2 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Available for cashout</span>
                <span className="text-xl font-mono font-black text-emerald-400">
                  ${data.pendingCommissions.toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                disabled={data.pendingCommissions < 50}
                onClick={() => setShowPayoutModal(true)}
                className={`w-full py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer flex items-center justify-center gap-1 text-center ${
                  data.pendingCommissions >= 50
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                {data.pendingCommissions >= 50 ? "Request Payout Withdrawal" : "Below $50 Threshold"}
              </button>
            </div>
          </div>

          {/* LIVE TEST HARNESS / REFRRAL PIPELINE SIMULATOR */}
          <div className="bg-white p-6 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/20 via-white to-white shadow-2xs space-y-4">
            <div className="space-y-1">
              <span className="bg-indigo-150 text-indigo-800 px-2 py-0.5 rounded text-[9px] uppercase font-mono font-black flex items-center gap-1.5 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" /> Sandbox Simulator
              </span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Real-Time Verification Engine</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Test the robust logic of clicks tracking, fraud prevention, trial signups, paid subscription upgrades, refunds, and payout balance calculations directly!
              </p>
            </div>

            {/* Test Case 1: Click Simulation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-800 block text-[10px] uppercase font-mono">Stage 1: Link Clicks</span>
              <div className="flex gap-2">
                <div className="space-y-1 w-full">
                  <label className="text-[9px] text-slate-405 font-mono uppercase block font-semibold">UTM Campaign</label>
                  <input 
                    type="text" 
                    value={simCampaign} 
                    onChange={(e) => setSimCampaign(e.target.value)} 
                    placeholder="e.g. twitter_bio" 
                    className="w-full text-xs font-mono p-1.5 bg-white border border-slate-250 rounded focus:border-indigo-500 outline-none"
                  />
                </div>
                <button
                  disabled={simulating}
                  id="btn-sim-click"
                  onClick={() => runActionSimulation("click")}
                  className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 mt-4.5"
                >
                  Simulate Click
                </button>
              </div>
            </div>

            {/* Test Case 2: Conversion Simulation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
              <span className="font-extrabold text-slate-800 block text-[10px] uppercase font-mono">Stage 2: Customer Conversion</span>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-405 font-mono uppercase block font-semibold">Customer Email</label>
                    <input 
                      type="email" 
                      value={simEmail} 
                      onChange={(e) => setSimEmail(e.target.value.toLowerCase())} 
                      placeholder="e.g. buyer@gmail.com" 
                      className="w-full text-xs font-mono p-1.5 bg-white border border-slate-250 rounded focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-405 font-mono uppercase block font-semibold">Action Mode</label>
                    <select 
                      value={simAction} 
                      onChange={(e) => setSimAction(e.target.value)} 
                      className="w-full text-xs p-1.5 bg-white border border-slate-250 rounded focus:border-indigo-500 outline-none font-bold"
                    >
                      <option value="signup">Sign Up (Trial)</option>
                      <option value="paid">Upgrade (Paid Customer)</option>
                      <option value="cancelled">Cancel Sub</option>
                      <option value="refunded">Refund payment</option>
                    </select>
                  </div>
                </div>

                {simAction === "paid" && (
                  <div className="grid grid-cols-2 gap-2 p-2 bg-indigo-50/30 rounded border border-indigo-200/40">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-405 font-mono uppercase block font-semibold">Plan selected</label>
                      <select 
                        value={simPlanName} 
                        onChange={(e) => setSimPlanName(e.target.value)}
                        className="w-full text-[10px] p-1 bg-white border border-slate-200 rounded outline-none font-bold"
                      >
                        <option value="Premium Action Suite">Premium ($49)</option>
                        <option value="Autonomous Growth Suite">Agency ($149)</option>
                        <option value="Enterprise Plan">Enterprise ($299)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-405 font-mono uppercase block font-semibold">Plan Price ($/mo)</label>
                      <input 
                        type="number" 
                        value={simMrr}
                        onChange={(e) => setSimMrr(Number(e.target.value))}
                        className="w-full text-[10px] p-1 bg-white border border-slate-200 rounded font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => runActionSimulation("signup")}
                  disabled={simulating}
                  id="btn-sim-conv"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-505 text-white text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  Trigger Simulated Conversion
                </button>
              </div>
            </div>
          </div>

          {/* Promotional Assets */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4" id="resources">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
              <Image className="h-4.5 w-4.5 text-indigo-600" /> Marketing & Promotional Assets
            </h3>
            <p className="text-slate-500 text-xs">
              Load ready assets directly to publish on your blog sidebar, social grids, or newsletters. Includes dynamic download options.
            </p>

            <div className="space-y-3">
              {(backendConfig?.promotional_assets || [
                {
                  id: "asset-1",
                  title: "RankSyncer Premium Sidebar Banner (300x250)",
                  type: "banner",
                  dimensions: "300x250",
                  imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=250&fit=crop&q=80",
                  downloadUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=250&fit=crop&q=80"
                },
                {
                  id: "asset-2",
                  title: "RankSyncer Leaderboard Hero (728x90)",
                  type: "banner",
                  dimensions: "728x90",
                  imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=728&h=90&fit=crop&q=80",
                  downloadUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=728&h=90&fit=crop&q=80"
                }
              ]).map((asset: any) => (
                <div key={asset.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 line-clamp-1">{asset.title}</span>
                    <span className="text-[9px] bg-slate-200 font-mono px-1 py-0.2 rounded text-slate-600 font-bold">{asset.dimensions || 'Vector'}</span>
                  </div>
                  <img src={asset.imageUrl} className="h-16 w-full object-cover rounded-lg border border-slate-200 shadow-3xs" alt="Banner visual content" />
                  <div className="flex justify-between items-center text-[10px] pt-1.5">
                    <button 
                      onClick={() => copyToClipboard(`<a href="${data.account?.referral_url}"><img src="${asset.imageUrl}" alt="RankSyncer SEO Automation" /></a>`, asset.id)}
                      className="text-indigo-600 hover:underline font-extrabold cursor-pointer"
                    >
                      {copiedLink?.[asset.id] ? "Copied Link Code!" : "Copy HTML Code"}
                    </button>
                    <a 
                      href={asset.downloadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-800 font-extrabold flex items-center gap-0.5"
                    >
                      <Download className="h-3 w-3" /> Download Link
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: Payout Request Form */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full relative space-y-4">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Request Payout Withdrawal</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Verify your withdrawable balance. Once submitted, our accounts dashboard team audits conversions and processes payment manually.
            </p>

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-450 block font-bold">Payout Amount ($ USD)</label>
                <div className="flex items-center bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5">
                  <DollarSign className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <input 
                    type="number" 
                    step="0.01"
                    min="50"
                    max={data.pendingCommissions}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="e.g. 150.00" 
                    className="bg-transparent border-none text-xs font-mono text-slate-800 focus:outline-none w-full ml-1"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  Available for withdrawal: <strong className="text-emerald-600">${data.pendingCommissions.toFixed(2)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-450 block font-bold">Withdrawal Method</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 outline-none"
                  >
                    <option value="paypal">PayPal</option>
                    <option value="wise">Wise (TransferWise)</option>
                    <option value="bank">Direct Wire (IBAN/SWIFT)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-450 block font-bold">Transfer Coordinates</label>
                  <input 
                    type="text" 
                    value={paymentAddress}
                    onChange={(e) => setPaymentAddress(e.target.value)}
                    placeholder="PayPal email or Bank account details" 
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:border-indigo-500 outline-none font-medium"
                  />
                </div>
              </div>

              {payoutError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{payoutError}</span>
                </div>
              )}

              {payoutSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 animate-bounce" />
                  <span>{payoutSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-150 text-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                >
                  Submit Payout Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
