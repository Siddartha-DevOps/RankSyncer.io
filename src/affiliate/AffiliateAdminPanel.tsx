import React, { useState, useEffect } from "react";
import { 
  Award, 
  Users, 
  DollarSign, 
  Layers, 
  ShieldAlert, 
  HelpCircle, 
  Check, 
  X, 
  Edit2, 
  Copy, 
  TrendingUp, 
  Percent, 
  FileText, 
  Image, 
  Grid,
  Settings,
  ShieldCheck,
  RefreshCw,
  Plus
} from "lucide-react";

interface AffiliateAdminPanelProps {
  userId: string;
  onRefreshGlobalConfig?: () => void;
}

export default function AffiliateAdminPanel({
  userId,
  onRefreshGlobalConfig
}: AffiliateAdminPanelProps) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<'partners' | 'payouts' | 'referrals' | 'cms' | 'fraud'>('partners');
  
  // Data State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partnerRateVal, setPartnerRateVal] = useState<number>(30);
  const [partnerStatusVal, setPartnerStatusVal] = useState<'approved' | 'pending' | 'rejected'>('approved');

  // CMS dynamic state
  const [defaultRate, setDefaultRate] = useState<number>(30);
  const [activePlc, setActivePlc] = useState<number>(1420);
  const [totalPaidPlc, setTotalPaidPlc] = useState<number>(84650);
  const [avgPayoutPlc, setAvgPayoutPlc] = useState<number>(480);
  const [convPlc, setConvPlc] = useState<number>(12400);

  // FAQs CMS state
  const [faqs, setFaqs] = useState<any[]>([]);
  const [newFaqQ, setNewFaqQ] = useState<string>("");
  const [newFaqA, setNewFaqA] = useState<string>("");

  // Toggles fraud state
  const [preventSelf, setPreventSelf] = useState<boolean>(true);
  const [preventDupIp, setPreventDupIp] = useState<boolean>(true);
  const [requireManual, setRequireManual] = useState<boolean>(true);

  // Load Admin Data
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/affiliate/global");
      const body = await res.json();
      if (body.success && body.global) {
        setAnalytics(body.global);
        
        // Populate inputs from global config 
        const config = body.global.config;
        setDefaultRate(config.default_commission_rate || 30);
        setActivePlc(config.landing_stats?.active_affiliates_placeholder || 1420);
        setTotalPaidPlc(config.landing_stats?.total_paid_placeholder || 84650);
        setAvgPayoutPlc(config.landing_stats?.avg_monthly_payout_placeholder || 480);
        setConvPlc(config.landing_stats?.referral_conversions_placeholder || 12400);
        setFaqs(config.faqs || []);
        setPreventSelf(config.fraud_rules?.prevent_self_referrals ?? true);
        setPreventDupIp(config.fraud_rules?.prevent_duplicate_ips ?? true);
        setRequireManual(config.fraud_rules?.require_manual_payout_approval ?? true);
      } else {
        setError(body.error || "Failed to load admin affiliate analytics buffer");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Update account commission or status
  const handleUpdateAccount = async (affiliateId: string) => {
    try {
      const res = await fetch("/api/affiliate/admin/account/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId,
          status: partnerStatusVal,
          commissionRate: Number(partnerRateVal)
        })
      });
      const body = await res.json();
      if (body.success) {
        alert("Affiliate partner account updated successfully!");
        setEditingPartnerId(null);
        fetchAdminData();
      } else {
        alert(`Update failed: ${body.error}`);
      }
    } catch (e: any) {
      alert(`Update error: ${e.message}`);
    }
  };

  // Approve or Reject payout
  const handlePayoutAction = async (payoutId: string, action: 'approve' | 'reject') => {
    const reason = action === "reject" ? prompt("Enter reason for rejecting this payout:") : null;
    if (action === "reject" && reason === null) return; // cancelled prompt

    try {
      const res = await fetch("/api/affiliate/admin/payout/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, action, reason })
      });
      const body = await res.json();
      if (body.success) {
        alert(`Payout successfully ${action}d!`);
        fetchAdminData();
      } else {
        alert(`Payout action failed: ${body.error}`);
      }
    } catch (e: any) {
      alert(`Payout action error: ${e.message}`);
    }
  };

  // Sync CMS configs
  const handleSyncCmsConfig = async () => {
    try {
      const res = await fetch("/api/affiliate/global/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_commission_rate: Number(defaultRate),
          landing_stats: {
            active_affiliates_placeholder: Number(activePlc),
            total_paid_placeholder: Number(totalPaidPlc),
            avg_monthly_payout_placeholder: Number(avgPayoutPlc),
            referral_conversions_placeholder: Number(convPlc)
          },
          faqs,
          fraud_rules: {
            prevent_self_referrals: preventSelf,
            prevent_duplicate_ips: preventDupIp,
            require_manual_payout_approval: requireManual
          }
        })
      });
      const body = await res.json();
      if (body.success) {
        alert("Landing page CMS and FAQs updated successfully!");
        if (onRefreshGlobalConfig) onRefreshGlobalConfig();
        fetchAdminData();
      } else {
        alert(`Sync failed: ${body.error}`);
      }
    } catch (err: any) {
      alert(`Sync error: ${err.message}`);
    }
  };

  // Add FAQ to local array
  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const item = {
      id: `faq-custom-${Date.now()}`,
      question: newFaqQ,
      answer: newFaqA
    };
    setFaqs([...faqs, item]);
    setNewFaqQ("");
    setNewFaqA("");
  };

  // Remove FAQ from local array
  const handleRemoveFaq = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-emerald-500" />
        Processing administrative affiliate logs...
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-800 rounded-3xl text-center space-y-2">
        <ShieldAlert className="h-6 w-6 text-red-500 mx-auto" />
        <h4 className="font-extrabold text-xs uppercase tracking-wider">Failed to instantiate Administrative Console</h4>
        <p className="text-xs">{error || "Administrative buffers not syncable."}</p>
        <button onClick={fetchAdminData} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-black">Retry Synchronize</button>
      </div>
    );
  }

  // Detect self-referrals or fraud flags
  const partnersWithSelfReferral = analytics.accounts.filter((acc: any) => {
    return analytics.referrals.some((ref: any) => ref.affiliate_id === acc.affiliate_id && ref.referred_user_id === acc.user_id);
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
      
      {/* Admin Panel Header / Global aggregates */}
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span className="text-[9px] font-mono font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">System Daemon</span>
          <h3 className="text-base font-black text-slate-900 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="h-5 w-5 text-indigo-600" /> Affiliate Management Suite
          </h3>
          <p className="text-xs text-slate-500">Monitor active program commissions, fraud states, configure FAQs, and approve payouts.</p>
        </div>

        <div className="flex gap-4 font-mono text-xs shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-450 uppercase block">Active partners</span>
            <strong className="text-slate-805 text-sm">{analytics.totalAffiliates} Affiliates</strong>
          </div>
          <div className="space-y-0.5 border-l border-slate-200 pl-4">
            <span className="text-[10px] text-slate-450 uppercase block">Commissions logged</span>
            <strong className="text-slate-805 text-sm">${analytics.lifetimeEarningsGlobal.toFixed(2)} USD</strong>
          </div>
          <div className="space-y-0.5 border-l border-slate-200 pl-4">
            <span className="text-[10px] text-slate-450 uppercase block">Referral conversions</span>
            <strong className="text-slate-805 text-sm">{analytics.totalReferrals} Accounts</strong>
          </div>
        </div>
      </div>

      {/* Admin sub-tab navigator */}
      <div className="px-6 border-b border-slate-100 flex gap-2 overflow-x-auto py-2 bg-slate-50/50">
        {[
          { id: 'partners', label: 'Affiliates List', count: analytics.totalAffiliates },
          { id: 'payouts', label: 'Payout Requests', count: analytics.payouts?.filter((p: any) => p.status === 'pending').length || 0 },
          { id: 'referrals', label: 'Referral Logs', count: analytics.totalReferrals },
          { id: 'cms', label: 'Landing & FAQ CMS' },
          { id: 'fraud', label: 'Fraud Center', count: partnersWithSelfReferral.length || 0, badgeColor: 'bg-red-100 text-red-700' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] font-mono px-1.5 py-0.1 rounded font-extrabold ${tab.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Tab Contents */}
      <div className="p-6">
        
        {/* Tab 1: Partners List */}
        {activeSubTab === 'partners' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-mono font-extrabold uppercase text-slate-400">Manage Affiliate Partner Accounts</h4>
              <span className="text-[11px] text-slate-500">Click Edit to alter commission split percentages or block accounts.</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-150 text-slate-650">
                <thead className="bg-slate-50 text-[10px] font-mono text-slate-450 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-5 py-3">Affiliate ID</th>
                    <th className="px-5 py-3">User ID</th>
                    <th className="px-5 py-3">Referral Code</th>
                    <th className="px-5 py-3">Commission Rate</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Joint Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {analytics.accounts && analytics.accounts.length > 0 ? (
                    analytics.accounts.map((acc: any) => {
                      const isEditing = editingPartnerId === acc.affiliate_id;
                      return (
                        <tr key={acc.affiliate_id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3 font-bold text-slate-900 select-all">{acc.affiliate_id}</td>
                          <td className="px-5 py-3 text-slate-500 select-all">{acc.user_id}</td>
                          <td className="px-5 py-3 text-slate-805 font-bold">{acc.referral_code}</td>
                          <td className="px-5 py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input 
                                  type="number" 
                                  value={partnerRateVal} 
                                  onChange={(e) => setPartnerRateVal(Number(e.target.value))}
                                  className="w-14 p-1 text-xs border border-slate-300 rounded font-bold font-mono"
                                />
                                <span className="text-slate-400">%</span>
                              </div>
                            ) : (
                              <span className="font-extrabold text-indigo-750">{acc.commission_rate || 30}% recurring</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {isEditing ? (
                              <select
                                value={partnerStatusVal}
                                onChange={(e) => setPartnerStatusVal(e.target.value as any)}
                                className="p-1 border border-slate-300 rounded text-xs font-bold"
                              >
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Blocked</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-black uppercase tracking-wider ${
                                acc.status === "approved" ? "bg-emerald-100 text-[#0c4a2c]" : 
                                acc.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                              }`}>{acc.status}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-400">{new Date(acc.created_at).toLocaleDateString()}</td>
                          <td className="px-5 py-3 text-right font-sans">
                            {isEditing ? (
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  onClick={() => handleUpdateAccount(acc.affiliate_id)}
                                  className="p-1 text-emerald-600 hover:text-emerald-700 font-extrabold"
                                >
                                  <Check className="h-4.5 w-4.5" />
                                </button>
                                <button 
                                  onClick={() => setEditingPartnerId(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600 font-extrabold"
                                >
                                  <X className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingPartnerId(acc.affiliate_id);
                                  setPartnerRateVal(acc.commission_rate || 30);
                                  setPartnerStatusVal(acc.status || "approved");
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded font-bold text-[10px]"
                              >
                                Edit Rates
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-400 font-mono text-[11px]">No active affiliate partner accounts database registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Payout Requests */}
        {activeSubTab === 'payouts' && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-extrabold uppercase text-slate-400">Review Commission Withdrawals</h4>
            
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-150 text-slate-650">
                <thead className="bg-slate-50 text-[10px] font-mono text-slate-450 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-5 py-3">Payout ID</th>
                    <th className="px-5 py-3">Affiliate ID</th>
                    <th className="px-5 py-3">Amount Requested</th>
                    <th className="px-5 py-3">Payout Coordinates</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Requested At</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {analytics.payouts && analytics.payouts.length > 0 ? (
                    analytics.payouts.map((pay: any) => (
                      <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-slate-900 select-all font-bold">{pay.id}</td>
                        <td className="px-5 py-3 text-slate-500 select-all">{pay.affiliate_id}</td>
                        <td className="px-5 py-3 text-slate-850 font-black text-emerald-700">${pay.amount.toFixed(2)} USD</td>
                        <td className="px-5 py-3 text-slate-700 select-all font-bold">{pay.payment_address}</td>
                        <td className="px-5 py-3 capitalize font-bold text-slate-600">{pay.payment_method}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-black uppercase tracking-wider ${
                            pay.status === "paid" || pay.status === "approved" ? "bg-emerald-100 text-emerald-850" : 
                            pay.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }`}>{pay.status}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-400">{new Date(pay.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-right font-sans">
                          {pay.status === "pending" ? (
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => handlePayoutAction(pay.id, "approve")}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px]"
                              >
                                Approve & Pay
                              </button>
                              <button 
                                onClick={() => handlePayoutAction(pay.id, "reject")}
                                className="px-2 py-1 bg-red-100 text-red-800 hover:bg-red-150 rounded font-bold text-[10px]"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">Audited</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400 font-mono text-[11px]">No withdrawal requests present in database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Referred Customers log */}
        {activeSubTab === 'referrals' && (
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-extrabold uppercase text-slate-400">All referred user registration logs</h4>
            
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-150 text-slate-650">
                <thead className="bg-slate-50 text-[10px] font-mono text-slate-450 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-5 py-3">Referral ID</th>
                    <th className="px-5 py-3">Referrer Affiliate ID</th>
                    <th className="px-5 py-3">Customer Email</th>
                    <th className="px-5 py-3">Referred Key ID</th>
                    <th className="px-5 py-3">Conversion Status</th>
                    <th className="px-5 py-3">Plan / MRR Tier</th>
                    <th className="px-5 py-3 text-right">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {analytics.referrals && analytics.referrals.length > 0 ? (
                    analytics.referrals.map((ref: any) => (
                      <tr key={ref.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800">{ref.id}</td>
                        <td className="px-5 py-3 text-slate-500 select-all">{ref.affiliate_id}</td>
                        <td className="px-5 py-3 select-all font-bold text-slate-900">{ref.email}</td>
                        <td className="px-5 py-3 text-slate-400 select-all">{ref.referred_user_id}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-black uppercase tracking-wider ${
                            ref.status === "signup" ? "bg-indigo-150 text-indigo-800" : 
                            ref.status === "trial" ? "bg-amber-100 text-amber-800" : 
                            ref.status === "paid" ? "bg-emerald-100 text-emerald-850" : "bg-red-100 text-red-800"
                          }`}>{ref.status}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-750 font-semibold">{ref.plan_name || 'Free Trial'} (${ref.mrr || 0}/mo)</td>
                        <td className="px-5 py-3 text-right text-slate-400">{new Date(ref.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-400 font-mono text-[11px]">No customer referrals found in database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: CMS Banners & FAQ Management */}
        {activeSubTab === 'cms' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Landing configs */}
              <div className="space-y-4 p-5 border border-slate-200 rounded-2xl bg-slate-50/50">
                <h4 className="font-extrabold text-xs uppercase font-mono text-slate-450 tracking-wider">Default Commission Split & Landing Stats</h4>
                
                <div className="space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-400 font-black">DEFAULT COMMISSION PERCENT (%)</label>
                    <input 
                      type="number" 
                      value={defaultRate} 
                      onChange={(e) => setDefaultRate(Number(e.target.value))}
                      className="w-full text-xs font-bold p-2 bg-white border border-slate-250 rounded focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400 font-black">ACTIVE PARTNERS PLACEHOLDER</label>
                      <input 
                        type="number" 
                        value={activePlc} 
                        onChange={(e) => setActivePlc(Number(e.target.value))}
                        className="w-full text-xs font-bold p-2 bg-white border border-slate-250 rounded focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400 font-black">TOTAL PAID PLACEHOLDER ($)</label>
                      <input 
                        type="number" 
                        value={totalPaidPlc} 
                        onChange={(e) => setTotalPaidPlc(Number(e.target.value))}
                        className="w-full text-xs font-bold p-2 bg-white border border-slate-250 rounded focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400 font-black">AVG MONTHLY PAYOUT PLACEHOLDER ($)</label>
                      <input 
                        type="number" 
                        value={avgPayoutPlc} 
                        onChange={(e) => setAvgPayoutPlc(Number(e.target.value))}
                        className="w-full text-xs font-bold p-2 bg-white border border-slate-250 rounded focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-slate-400 font-black">CONVERSIONS PLACEHOLDER</label>
                      <input 
                        type="number" 
                        value={convPlc} 
                        onChange={(e) => setConvPlc(Number(e.target.value))}
                        className="w-full text-xs font-bold p-2 bg-white border border-slate-250 rounded focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: FAQ Manager */}
              <div className="space-y-4 p-5 border border-slate-200 rounded-2xl bg-slate-50/50">
                <h4 className="font-extrabold text-xs uppercase font-mono text-slate-450 tracking-wider">Interactive Program FAQ Editor</h4>
                
                <div className="space-y-3 font-sans text-xs max-h-[220px] overflow-y-auto divide-y divide-slate-150">
                  {faqs.map((faq, index) => (
                    <div key={faq.id} className="pt-2 flex justify-between items-start gap-4">
                      <div className="space-y-0.5">
                        <strong className="block text-slate-900 text-xs">{faq.question}</strong>
                        <p className="text-slate-500 text-[11px] leading-relaxed">{faq.answer}</p>
                      </div>
                      <button 
                        onClick={() => handleRemoveFaq(index)} 
                        className="p-1 text-red-650 hover:bg-slate-100 rounded cursor-pointer font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-slate-450 uppercase block">Insert New FAQ</span>
                  <input 
                    type="text" 
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                    placeholder="FAQ Question"
                    className="w-full text-xs p-1.5 border border-slate-250 rounded outline-none"
                  />
                  <textarea 
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    placeholder="FAQ Answer Details..."
                    className="w-full text-xs p-1.5 border border-slate-250 rounded outline-none h-14 resize-none"
                  />
                  <button 
                    onClick={handleAddFaq}
                    className="w-full py-1.5 bg-indigo-650 hover:bg-slate-900 text-white font-extrabold text-xs rounded transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add FAQ to Queue
                  </button>
                </div>
              </div>

            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSyncCmsConfig}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
              >
                Sync All CMS Configurations & Banners Live
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Fraud Protection Center */}
        {activeSubTab === 'fraud' && (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50/40 border border-indigo-150 rounded-2xl flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-indigo-700 shrink-0 animate-bounce" />
              <p className="text-xs text-indigo-850 leading-relaxed font-medium">
                Our rule-based screening engine monitors accounts and automatically flag/rate-limits conversions that mismatch system tracking parameters. Toggles below instantly apply to operations globally.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Side: Rule toggles */}
              <div className="p-5 border border-slate-200 bg-slate-50/50 rounded-2xl space-y-4">
                <h4 className="font-extrabold text-xs uppercase font-mono text-slate-450 tracking-wider">Screening Filters & Restrictions</h4>
                
                <div className="space-y-4 text-xs font-sans">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={preventSelf} 
                      onChange={(e) => setPreventSelf(e.target.checked)}
                      className="h-4 w-4 bg-white border border-slate-250 rounded outline-none accent-indigo-600 mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <strong className="block text-slate-900 text-xs">Self-Referral Prevention</strong>
                      <span className="text-slate-500 text-[11px] block leading-relaxed">Blocks referral link clicks and conversions if the newly registered user ID corresponds to the referrer affiliate user ID.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={preventDupIp} 
                      onChange={(e) => setPreventDupIp(e.target.checked)}
                      className="h-4 w-4 bg-white border border-slate-250 rounded outline-none accent-indigo-600 mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <strong className="block text-slate-900 text-xs">IP Duplicate Rate-Limiting</strong>
                      <span className="text-slate-500 text-[11px] block leading-relaxed">Prevents logging separate refer links clicks originating from identical client IPs within a 5-second window to prevent abuse.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={requireManual} 
                      onChange={(e) => setRequireManual(e.target.checked)}
                      className="h-4 w-4 bg-white border border-slate-250 rounded outline-none accent-indigo-600 mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <strong className="block text-slate-900 text-xs">Mandatory Payout Auditing</strong>
                      <span className="text-slate-500 text-[11px] block leading-relaxed">Maintains requested payouts in 'pending' hold state until designated administrators perform manually clearing.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Right Side: Log audits */}
              <div className="p-5 border border-slate-200 bg-slate-50/50 rounded-2xl space-y-4">
                <h4 className="font-extrabold text-xs uppercase font-mono text-slate-450 tracking-wider">Security Violations Ledger</h4>
                
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {partnersWithSelfReferral.length > 0 ? (
                    partnersWithSelfReferral.map((partner: any, idx: number) => (
                      <div key={idx} className="p-3 bg-red-50 border border-red-150 rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between text-[10px] font-mono text-red-650 font-bold">
                          <span>BREACH ATEMPT CODE: SELF_REF</span>
                          <span>LEVEL 1 FLAG</span>
                        </div>
                        <p className="text-slate-700 font-mono text-xs font-bold leading-normal">
                          Partner <span className="underline select-all">{partner.affiliate_id}</span> attempted self-referral using user registration {partner.user_id}.
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-1 bg-white">
                      <span className="bg-emerald-100 text-[#0c4a2c] text-[9px] font-bold px-1.5 py-0.2 rounded mb-1">ALL STATUS GREEN</span>
                      No security and fraud violations logged in active buffer.
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={handleSyncCmsConfig}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl cursor-pointer shadow-xs uppercase tracking-wider"
              >
                Apply Fraud Security Rules Globally
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
