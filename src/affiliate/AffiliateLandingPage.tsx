import React, { useState, useEffect } from "react";
import { 
  Award, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Sparkles, 
  HelpCircle, 
  Play, 
  ChevronDown, 
  ShieldAlert, 
  FileText, 
  Link2, 
  Share2, 
  ArrowUpRight, 
  UserCheck, 
  Zap, 
  ChevronRight, 
  Database,
  Briefcase,
  Layers,
  Cpu
} from "lucide-react";
import { AffiliateCMSConfig } from "./types";

interface AffiliateLandingPageProps {
  onJoin: (customCode?: string) => void;
  isEnrolled: boolean;
  userId: string;
  onGoToDashboard: () => void;
  backendConfig?: AffiliateCMSConfig;
}

export default function AffiliateLandingPage({
  onJoin,
  isEnrolled,
  userId,
  onGoToDashboard,
  backendConfig
}: AffiliateLandingPageProps) {
  // Live Calculator States
  const [referralsCount, setReferralsCount] = useState<number>(25);
  const [customerValue, setCustomerValue] = useState<number>(49); // typical $49 plan
  const [commissionRate, setCommissionRate] = useState<number>(30); // 30%

  // Accordion FAQ state
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // Fallback defaults for CTA stats if backend config is not fully fetched yet
  const stats = backendConfig?.landing_stats || {
    active_affiliates_placeholder: 1420,
    total_paid_placeholder: 84650,
    avg_monthly_payout_placeholder: 480,
    referral_conversions_placeholder: 12400
  };

  const faqs = backendConfig?.faqs || [
    {
      id: "faq-1",
      question: "How much commission do I earn?",
      answer: "You earn a 30% recurring monthly commission on all subscription plans as long as the referred customer remains active. No caps or limits on total earnings."
    },
    {
      id: "faq-2",
      question: "When do I get paid?",
      answer: "Commissions are approved 30 days after a payment is cleared (to account for our refund window). Payouts are made monthly on the 10th for balances over $50."
    },
    {
      id: "faq-3",
      question: "How long do referral cookies last?",
      answer: "Our tracking cookies last for 60 full days. If a visitor clicks your affiliate link and signs up anytime within 60 days, you get credited!"
    },
    {
      id: "faq-4",
      question: "Is there a payout threshold?",
      answer: "Yes, the minimum threshold to request a payout is $50. Payouts can be requested via PayPal, Wise, or Direct Bank Transfer."
    },
    {
      id: "faq-5",
      question: "How are commissions tracked?",
      answer: "We use robust, reliable server-side cookies combined with IP verification. When a visitor signs up, our tracking registers their referral state immediately."
    },
    {
      id: "faq-6",
      question: "What marketing materials are provided?",
      answer: "We provide professional logos, landing page assets, social media assets, and promotional banners inside your affiliate partner dashboard."
    }
  ];

  // Dynamic calculations
  const monthlyEarnings = referralsCount * customerValue * (commissionRate / 100);
  const annualEarnings = monthlyEarnings * 12;
  const lifetimeProjection = monthlyEarnings * 18; // assuming 18 Month Average Customer LTV

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Dynamic Sub-header Banner */}
      <div className="bg-slate-900 text-slate-300 py-2.5 px-4 text-center text-xs font-mono font-bold flex justify-center items-center gap-2 border-b border-slate-800">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        Join {stats.active_affiliates_placeholder.toLocaleString()}+ active partners earning recurring payouts
      </div>

      {/* Hero Section */}
      <header className="relative bg-gradient-to-br from-slate-900 via-[#0a1410] to-[#040806] pt-16 pb-24 px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            <Award className="h-3.5 w-3.5" /> RankSyncer.co Partner Network
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">30% Recurring</span> Commission Forever
          </h1>

          <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Earn recurring passive income by promoting RankSyncer — the world's most advanced autonomous SEO research and automated content growth platform.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
            {isEnrolled ? (
              <button 
                onClick={onGoToDashboard}
                id="btn-goto-dash"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                Access Affiliate Dashboard
                <ArrowRight className="h-4 w-4 text-black" />
              </button>
            ) : (
              <button 
                onClick={() => onJoin()}
                id="btn-join-aff"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                Become an Affiliate Partner
                <ArrowRight className="h-4 w-4 text-black" />
              </button>
            )}
            <a 
              href="#resources"
              className="w-full sm:w-auto px-6 py-4 bg-slate-800/80 hover:bg-slate-850 text-slate-200 hover:text-white font-extrabold rounded-2xl text-sm transition-all border border-slate-700/60 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              View Affiliate Resources
            </a>
          </div>

          {/* Social Proof metrics */}
          <div className="mt-14 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div className="space-y-1">
              <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Active Affiliates</p>
              <h3 className="text-2xl md:text-3xl font-black text-white font-mono">
                {stats.active_affiliates_placeholder.toLocaleString()}+
              </h3>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Total Payouts Paid</p>
              <h3 className="text-2xl md:text-3xl font-black text-white font-mono">
                ${stats.total_paid_placeholder.toLocaleString()} USD
              </h3>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Average Monthly Payout</p>
              <h3 className="text-2xl md:text-3xl font-black text-white font-mono">
                ${stats.avg_monthly_payout_placeholder.toLocaleString()}
              </h3>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">Conversions Tracked</p>
              <h3 className="text-2xl md:text-3xl font-black text-white font-mono">
                {stats.referral_conversions_placeholder.toLocaleString()}+
              </h3>
            </div>
          </div>
        </div>
      </header>

      {/* Dynamic Interactive Earnings Calculator */}
      <section className="py-20 px-6 max-w-5xl mx-auto -mt-12 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 md:p-10">
          <div className="text-center mb-8">
            <span className="text-xs uppercase font-mono tracking-wider font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Interactive Projection</span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">Estimate Your Affiliate Earnings</h2>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              Drag the sliders below to see how much you could earn with our high recurring payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-stretch">
            {/* Input sliders */}
            <div className="lg:col-span-3 space-y-6 flex flex-col justify-center">
              <div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-700 mb-2">
                  <span>Number of Referrals</span>
                  <span className="text-indigo-600 font-black font-mono text-lg">{referralsCount} Customers</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="500" 
                  value={referralsCount} 
                  onChange={(e) => setReferralsCount(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>1 customer</span>
                  <span>500 customers</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-700 mb-2">
                  <span>Average Plan Size</span>
                  <span className="text-indigo-600 font-black font-mono text-lg">${customerValue} /mo</span>
                </div>
                <input 
                  type="range" 
                  min="19" 
                  max="299" 
                  value={customerValue} 
                  onChange={(e) => setCustomerValue(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-100 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>$19 (Starter)</span>
                  <span>$299 (Agency Suite)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-700 mb-2">
                  <span>Commission Rate</span>
                  <span className="text-indigo-600 font-black font-mono text-lg">{commissionRate}% Recurring</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={commissionRate} 
                  disabled
                  className="w-full accent-indigo-500 h-2 bg-slate-150 rounded-lg cursor-not-allowed opacity-75"
                />
                <p className="text-[10px] text-slate-400 font-mono mt-1 leading-snug">
                  *Default Partner is locked to 30%. Dynamic higher tiers available for enterprise partners.
                </p>
              </div>
            </div>

            {/* Results display card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-[#0e1f18] text-white p-6 rounded-2xl border border-teal-900/60 flex flex-col justify-between shadow-lg">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Monthly Income</span>
                  <h3 className="text-3xl md:text-4xl font-black font-mono text-emerald-400">
                    ${monthlyEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Annual Income</span>
                    <span className="text-lg md:text-xl font-black font-mono text-white">
                      ${annualEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Lifetime Est. (LTV)</span>
                    <span className="text-lg md:text-xl font-black font-mono text-white">
                      ${lifetimeProjection.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
                {isEnrolled ? (
                  <button 
                    onClick={onGoToDashboard}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 text-xs font-black rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
                  >
                    Launch Partner Panel
                  </button>
                ) : (
                  <button 
                    onClick={() => onJoin()}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 text-xs font-black rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
                  >
                    Start Earning Passive Income Now
                  </button>
                )}
                <span className="text-[10px] text-slate-400 block mt-2 font-mono">Zero setup fee. Instant registration.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-xs uppercase font-mono tracking-wider font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Why Promote Us?</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Ecosystem Benefits & Perks</h2>
            <p className="text-slate-500 text-sm">
              We provide the highest quality autonomous SEO tool, making it extremely straightforward to refer and convert traffic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Benefit 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-500/20 hover:shadow-lg transition-all group relative overflow-hidden">
              <div className="p-3 bg-emerald-100/60 group-hover:bg-emerald-100 text-emerald-700 rounded-xl w-fit mb-4 transition-colors">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Fast Growing Platform</h3>
              <p className="text-slate-550 text-xs leading-relaxed">
                RankSyncer is leading the autonomous SEO wave, utilizing Gemini to streamline SEO audits, content mapping, and direct CMS publishing.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-500/20 hover:shadow-lg transition-all group relative overflow-hidden">
              <div className="p-3 bg-indigo-100/60 group-hover:bg-indigo-100 text-indigo-700 rounded-xl w-fit mb-4 transition-colors">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">High Recurring Revenue</h3>
              <p className="text-slate-550 text-xs leading-relaxed">
                We share 30% of every payment. In contrast with one-time payouts, you will continue to earn regular commissions as long as they retain active status.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-500/20 hover:shadow-lg transition-all group relative overflow-hidden">
              <div className="p-3 bg-emerald-100/60 group-hover:bg-emerald-100 text-emerald-700 rounded-xl w-fit mb-4 transition-colors">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Unlimited Earning Potential</h3>
              <p className="text-slate-550 text-xs leading-relaxed">
                There are absolutely no upper limits on how much you can generate. Scale up to hundreds of subscribers and command real business monthly income.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-500/20 hover:shadow-lg transition-all group relative overflow-hidden">
              <div className="p-3 bg-teal-100/60 group-hover:bg-teal-100 text-teal-700 rounded-xl w-fit mb-4 transition-colors">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Instant Cookie Attribution</h3>
              <p className="text-slate-550 text-xs leading-relaxed">
                We persist traffic cookies for a full 60 days. If the lead upgrades anywhere in this wide window, standard credit goes straight to you!
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-500/20 hover:shadow-lg transition-all group relative overflow-hidden">
              <div className="p-3 bg-sky-100/60 group-hover:bg-sky-100 text-sky-700 rounded-xl w-fit mb-4 transition-colors">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Incredible Product/Market Fit</h3>
              <p className="text-slate-550 text-xs leading-relaxed">
                RankSyncer resolves real painful SEO limits. Our high trial-to-paid conversions mean your traffic generates optimal payout revenue.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-500/20 hover:shadow-lg transition-all group relative overflow-hidden">
              <div className="p-3 bg-pink-100/60 group-hover:bg-pink-100 text-pink-700 rounded-xl w-fit mb-4 transition-colors">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Reliable Monthly Payouts</h3>
              <p className="text-slate-550 text-xs leading-relaxed">
                Consistent payouts directly on the 10th of each month. Safely request withdrawals using PayPal, Wise, or Direct wire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-xs uppercase font-mono tracking-wider font-extrabold text-[#10b981] bg-emerald-100 px-3 py-1 rounded-full font-sans">Simplicity first</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">How the Affiliate Program Works</h2>
            <p className="text-slate-550 text-sm">
              We design our referral engine to make tracking, attribution, and payout request seamless.
            </p>
          </div>

          <div className="relative">
            {/* Visual connector line in desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-dashed bg-slate-200 -translate-y-1/2 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-slate-200 text-center space-y-4 shadow-3xs">
                <div className="h-10 w-10 bg-indigo-600 text-white font-black text-sm flex items-center justify-center rounded-full mx-auto shadow-sm">
                  1
                </div>
                <h3 className="text-base font-black text-slate-900">Join Free</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Sign up to the affiliate program in 1 click. Create your unique custom referral tag instantly.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-slate-200 text-center space-y-4 shadow-3xs">
                <div className="h-10 w-10 bg-indigo-600 text-white font-black text-sm flex items-center justify-center rounded-full mx-auto shadow-sm">
                  2
                </div>
                <h3 className="text-base font-black text-slate-900">Get Referral Links</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Access ready-made unique tracking links and professional high-converting graphic promotional banners.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-slate-200 text-center space-y-4 shadow-3xs">
                <div className="h-10 w-10 bg-indigo-600 text-white font-black text-sm flex items-center justify-center rounded-full mx-auto shadow-sm">
                  3
                </div>
                <h3 className="text-base font-black text-slate-900">Share & Promote</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Publish articles, recommend RankSyncer on social feeds, list us on lists, or email your newsletter.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-slate-200 text-center space-y-4 shadow-3xs">
                <div className="h-10 w-10 bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center rounded-full mx-auto shadow-sm">
                  4
                </div>
                <h3 className="text-base font-black text-slate-900 font-sans">Earn Recurring</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Track dynamic signups, check conversions real-time, and get payouts direct to Wise or PayPal monthly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Worth Promoting */}
      <section className="py-20 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] font-mono text-emerald-400 font-black tracking-widest uppercase block">Why it sells itself</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Core Features Worth Promoting</h2>
            <p className="text-slate-400 text-sm">
              RankSyncer offers premium, proprietary automations that solve actual SEO workflow blockages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-3">
              <span className="p-2 bg-emerald-950 text-emerald-400 rounded-xl w-fit"><Briefcase className="h-4 w-4" /></span>
              <h4 className="font-bold text-sm text-white">AI Blog Composer</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Continuous generation of fully factual, optimized articles directly from rankings intelligence maps.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-3">
              <span className="p-2 bg-purple-950 text-purple-400 rounded-xl w-fit"><Cpu className="h-4 w-4" /></span>
              <h4 className="font-bold text-sm text-white">Keyword Intelligence</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Intense semantic search intent tracking, volume projections, and real Google rankings indexing logs.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-3">
              <span className="p-2 bg-blue-950 text-blue-400 rounded-xl w-fit"><Layers className="h-4 w-4" /></span>
              <h4 className="font-bold text-sm text-white">Headless CMS Sync</h4>
              <p className="text-slate-400 text-xs leading-relaxed">1-click automated syndication integrations into Ghost, WordPress, Webflow, Framer, and custom routers.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-3">
              <span className="p-2 bg-pink-950 text-pink-400 rounded-xl w-fit"><Share2 className="h-4 w-4" /></span>
              <h4 className="font-bold text-sm text-white">Backlink Exchange</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Collaborative, authenticated continuous guest post placements and backlink verification logs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ideal Partners Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-sans">Network fit</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Who Is This Program Perfect For?</h2>
            <p className="text-slate-500 text-sm">
              We collaborate with a highly diverse spectrum of digital growth creators and operators.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Agencies & Consultants",
              "SaaS Review sites",
              "Bloggers & Publishers",
              "Affiliate Reviewers",
              "Entrepreneurs",
              "SEO Consultants",
              "YouTube Content Creators",
              "Digital Marketers"
            ].map((partner, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-black text-slate-800 leading-snug">{partner}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center max-w-md mx-auto space-y-2">
            <HelpCircle className="h-8 w-8 text-indigo-600 mx-auto" />
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">Frequently Asked Questions</h2>
            <p className="text-slate-500 text-sm">
              Everything you need to know about the affiliate program.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-3xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    className="w-full p-5 text-left flex justify-between items-center outline-none cursor-pointer"
                  >
                    <span className="font-bold text-sm text-slate-900 pr-4">{faq.question}</span>
                    <ChevronDown className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-500 leading-relaxed border-t border-slate-100 transition-all">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories Testimonials Placeholder */}
      <section className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Award className="h-5 w-5" /></div>
          <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Affiliate Success Stories</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Dynamic testimonial collections from global SEO marketing blogs.
          </p>

          <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl mt-4 border-dashed text-slate-450 text-xs flex flex-col items-center justify-center gap-2">
            <span className="font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">CMS INTEGRATED PLACEHOLDER</span>
            <p className="max-w-sm">
              Testimonials are currently empty. New partner feedback can be added, edited, and approved directly using the Admin Panel landing page manager inside settings.
            </p>
          </div>
        </div>
      </section>

      {/* JOIN CTA SECTION */}
      <footer className="bg-slate-900 text-white py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white">Ready to Start Earning?</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
            Become an authorized partner today. Free setup, real-time analytics, high recurring payouts, and professional banners ready to deploy.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
            {isEnrolled ? (
              <button 
                onClick={onGoToDashboard}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black hover:scale-101 transition-all rounded-xl text-xs uppercase cursor-pointer shadow-sm"
              >
                Access Partner Console
              </button>
            ) : (
              <button 
                onClick={() => onJoin()}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black hover:scale-101 transition-all rounded-xl text-xs uppercase cursor-pointer shadow-sm"
              >
                Become an Affiliate Partner
              </button>
            )}
            <button 
              onClick={() => alert("Please consult contact coordinates in main support page.")}
              className="w-full sm:w-auto px-6 py-4 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-extrabold cursor-pointer border border-slate-700/65"
            >
              Contact Affiliate Team
            </button>
          </div>

          <p className="text-[10px] text-slate-500 font-mono pt-4 select-none">
            © 2026 RankSyncer Autonomous Marketing Ecosystem. Subject to standard partner validation and fraud checks.
          </p>
        </div>
      </footer>

    </div>
  );
}
