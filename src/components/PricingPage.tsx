import { useState } from 'react';
import { 
  CheckCircle2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Star, 
  Globe2, 
  Sparkles, 
  Zap, 
  Lock,
  ChevronLeft
} from 'lucide-react';
import RankSyncerLogo from './RankSyncerLogo';

interface PricingPageProps {
  onBackToLanding: () => void;
  onLaunchApp: () => void;
  projectsCount?: number;
}

export default function PricingPage({ onBackToLanding, onLaunchApp, projectsCount = 0 }: PricingPageProps) {
  // FAQ interactive state tracking using boolean flags
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({
    0: false,
    1: false,
    2: false
  });

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqs = [
    {
      question: "Are there any hidden set-up fees or continuous retention models?",
      answer: "Absolutely not. RankSyncer operates on a transparent, self-serve subscription. You pay the flat flat rate shown ($99/mo) and enjoy full autonomous direct integrations with WordPress, Webflow, Shopify, Framer, and more. Cancel or upgrade instantly in one click."
    },
    {
      question: "How does the SEO Autopilot loop mitigate ranking drops?",
      answer: "Our intelligent background workers track Google SERP positions continuously. If a phrase drops below a specified target thresholds, the dynamic engine analyzes the competitor gap, designs a targeted organic brief, and publishes a refresh article to regain position."
    },
    {
      question: "Can I manage multiple client domains under a single checkout?",
      answer: "Yes, multi-tenant workspace structures support managing up to 100 keyword targets. Dynamic volume discounts apply automatically to your subscription tier if you manage more sites, reducing costs automatically."
    }
  ];

  // Placeholder indicators for future integrations

  return (
    <div className="min-h-screen bg-[#faf8f9] text-slate-800 font-sans relative overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-850">
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Ambient background blur circles */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-200/20 rounded-full filter blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-100/30 rounded-full filter blur-[120px] pointer-events-none z-0" />

      {/* Simple navigation bar */}
      <header className="sticky top-0 z-40 bg-[#faf8f9]/85 backdrop-blur-md border-b border-indigo-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="cursor-pointer" onClick={onBackToLanding}>
            <RankSyncerLogo theme="light" />
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <button onClick={onBackToLanding} className="hover:text-indigo-600 transition-colors cursor-pointer">
              Discovery Home
            </button>
            <span className="text-slate-300">|</span>
            <button onClick={onLaunchApp} className="hover:text-indigo-600 transition-colors cursor-pointer">
              Control Panel
            </button>
          </div>

          <div>
            <button 
              onClick={onLaunchApp}
              className="px-4.5 py-2.5 bg-slate-900 text-white hover:bg-indigo-600 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm shadow-slate-950/10"
            >
              Launch Console
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-12 pb-24">
        
        {/* Back navigation anchor */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <button 
            onClick={onBackToLanding}
            className="group flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Discovery</span>
          </button>
        </div>

        {/* TOP WORD: PRICING (Must be in middle at top) */}
        <div className="text-center mb-8">
          <span className="text-[11px] font-black tracking-[0.25em] text-indigo-600 bg-indigo-50/70 border border-indigo-100 px-3.5 py-1.5 rounded-full uppercase">
            Pricing
          </span>
        </div>

        {/* HERO HEADER */}
        <div className="max-w-4xl mx-auto px-4 text-center mb-8 sm:mb-12 space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-black tracking-tight text-slate-950 leading-tight">
            Grow Organic Traffic <br className="hidden sm:inline" />
            on <span className="text-indigo-600 relative inline-block">Auto-Pilot</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm md:text-base text-slate-600 font-medium leading-relaxed">
            Outrank grows your SEO rankings and organic traffic while you focus on growing your business.
          </p>

          {/* Social proof overlays: Elegant placeholders representing "future slots/connected sites" */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <div className="flex items-center -space-x-2">
              {/* Active starter spot */}
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-505 from-indigo-500 to-indigo-650 to-indigo-600 border-2 border-white flex items-center justify-center text-white text-[9px] font-black shadow-xs" title="Connected Domain #1">
                RS
              </div>
              {/* Ready to connect placeholder slots */}
              <div className="h-8 w-8 rounded-full bg-slate-50 border-2 border-dashed border-slate-350 border-slate-200 flex items-center justify-center text-slate-400 text-xs shadow-3xs" title="Empty slot ready for integration">
                +
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-50 border-2 border-dashed border-slate-350 border-slate-200 flex items-center justify-center text-slate-400 text-xs shadow-3xs" title="Empty slot ready for integration">
                +
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-50 border-2 border-dashed border-slate-350 border-slate-200 flex items-center justify-center text-slate-400 text-xs shadow-3xs" title="Empty slot ready for integration">
                +
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-50 border-2 border-dashed border-indigo-250 border-indigo-200 bg-indigo-50/10 flex items-center justify-center text-indigo-400 font-bold text-xs shadow-3xs animate-pulse" title="Add integration slot">
                +
              </div>
            </div>
            
            <div className="h-3 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-505 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-500 stroke-none" />
                ))}
              </div>
              <span className="text-[11px] font-extrabold text-slate-700 tracking-tight font-sans">
                750m+ Organic Views Workspace
              </span>
            </div>
          </div>
        </div>

        {/* CORE PRICING BOARD CARD (Zoomed and tightly packed) */}
        <section className="max-w-5xl mx-auto px-4 mb-10 transform scale-[1.01] sm:scale-[1.02] hover:scale-[1.03] transition-transform duration-500">
          <div className="relative rounded-[28px] p-5 sm:py-8 sm:px-9 border-2 border-indigo-200 bg-white shadow-[0_15px_45px_rgba(99,102,241,0.08)]">
            
            {/* Glowing card border tag */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black tracking-wider px-4 py-1 rounded-full shadow-lg uppercase">
              ✨ RECOMMENDED CO-PILOT
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              
              {/* Left Division: Price point & Subscription actions */}
              <div className="lg:col-span-5 flex flex-col justify-between pt-4 lg:pt-0 pb-6 lg:pb-0 lg:pr-8 text-center lg:text-left">
                <div className="space-y-4">
                  <span className="inline-block bg-indigo-50 text-indigo-700 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-md">
                    Growth on auto-pilot
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-sans">
                    All in One
                  </h3>
                  
                  {/* Price node */}
                  <div className="flex items-baseline justify-center lg:justify-start gap-4 py-2">
                    <span className="text-5xl sm:text-6.5xl font-black text-slate-950 font-sans tracking-tight">
                      $99
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-semibold text-slate-400 line-through leading-tight">
                        $200
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        /mo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <button 
                    onClick={onLaunchApp}
                    className="w-full py-4.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-base font-black rounded-2xl shadow-xl shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-2 transform active:scale-98 transition-all hover:scale-[1.01]"
                  >
                    <span>Get Started for Free</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  
                  <p className="text-[11px] text-slate-400 font-bold text-center">
                    Cancel anytime. No questions asked!
                  </p>
                </div>
              </div>

              {/* Right Division: What's Included features loop */}
              <div className="lg:col-span-7 pt-8 lg:pt-0 lg:pl-10">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6">
                  What's included:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "30 Articles a month generated and published on auto-pilot",
                    "Unlimited Users in your Organization",
                    "Auto Keyword Research made for you hands-free",
                    "Connects to WordPress, Webflow, Shopify, Framer and more",
                    "High DR Backlinks built for you on auto-pilot through our Backlink Exchange",
                    "AI Images generated in different styles",
                    "Relevant YouTube videos integrated into articles",
                    "Articles generated in 150+ languages",
                    "Unlimited AI Rewrites",
                    "Custom Features requests"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="h-5 w-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0 border border-indigo-100 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-semibold text-slate-700 leading-snug">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* VOLUME DISCOUNTS BAND */}
        <section className="max-w-5xl mx-auto px-4 mb-10">
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-[28px] p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden">
            
            {/* Background texture spark */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <span className="text-9xl font-black select-none">%</span>
            </div>

            <div className="flex items-center gap-4 text-center lg:text-left">
              <div className="h-12 w-12 bg-white text-indigo-600 border border-indigo-150 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm shrink-0">
                %
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                  More sites, less per site!
                </h4>
                <p className="text-slate-500 text-xs mt-0.5 font-medium">
                  Volume discounts apply automatically to organization billing.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-indigo-100/50 shadow-2xs text-center min-w-[100px]">
                <p className="text-[10px] font-bold text-slate-400">2–4 sites</p>
                <p className="text-xs font-extrabold text-indigo-600">10% off</p>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-indigo-100/50 shadow-2xs text-center min-w-[100px]">
                <p className="text-[10px] font-bold text-slate-400">5–19 sites</p>
                <p className="text-xs font-extrabold text-indigo-600">15% off</p>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-indigo-100/50 shadow-2xs text-center min-w-[100px]">
                <p className="text-[10px] font-bold text-slate-400">20–25 sites</p>
                <p className="text-xs font-extrabold text-indigo-600">20% off</p>
              </div>

              <div className="h-6 w-px bg-indigo-200 hidden sm:block" />

              <div className="text-center lg:text-right">
                <p className="text-[10px] text-slate-400 font-semibold mb-1">Running 25+ sites?</p>
                <button 
                  onClick={onLaunchApp}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>Talk to us</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* FAQ WORKSPACE (pricing FAQ section toggles: expand/collapse) */}
        <section className="max-w-3xl mx-auto px-4 mb-14">
          <div className="text-center mb-6 space-y-1">
            <h3 className="text-lg md:text-xl font-sans font-extrabold tracking-tight text-slate-950">
              Have Questions?
            </h3>
            <p className="text-slate-500 text-[11px] sm:text-xs font-semibold">
              If you can't find what you're looking for, feel free to reach out!
            </p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, i) => (
              <div 
                key={i}
                className="bg-white border border-slate-200 shadow-3xs rounded-xl overflow-hidden transition-all duration-300"
              >
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full py-3.5 px-4.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50/40 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-850 pr-4">
                    {faq.question}
                  </span>
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 shrink-0 transition-colors">
                    {faqOpen[i] ? (
                      <Minus className="h-3 w-3" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </span>
                </button>

                {faqOpen[i] && (
                  <div className="px-4.5 pb-3.5 pt-1 text-[11px] text-slate-500 font-medium leading-relaxed border-t border-slate-50 animate-fade-in">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* BRAND PROMO BLOCK & OG IMAGE WITH LET'S TRY! */}
        <section className="max-w-4xl mx-auto px-4">
          <div className="relative rounded-[36px] overflow-hidden bg-slate-950 text-white p-8 sm:p-12 border border-[#1e2e26]/30 shadow-2xl flex flex-col items-center text-center">
            
            {/* Interesting background graphics: grids, glows */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none z-0" 
              style={{
                backgroundImage: `
                  linear-gradient(to right, #4f46e5 1px, transparent 1px),
                  linear-gradient(to bottom, #4f46e5 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px'
              }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none z-0" />

            <div className="relative z-10 space-y-6 max-w-lg">
              
              <span className="inline-block bg-indigo-900/40 text-indigo-300 text-[10px] font-black uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full border border-indigo-500/20">
                Let's Try!
              </span>

              <h3 className="text-3xl sm:text-4xl font-sans font-black tracking-tight leading-tight">
                Start creating magic today with a free trial!
              </h3>
              
              <p className="text-slate-400 text-xs sm:text-sm font-semibold max-w-md mx-auto">
                Join thousands of solopreneurs and content teams dominating search rankings in real-time.
              </p>

              <div>
                <button 
                  onClick={onLaunchApp}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-xl transition duration-300 shadow-xl shadow-indigo-600/20 cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Get Started for Free</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                            {/* Simulated/Mock Real-Time OG Image Card of RankSyncer with logo */}
              {/* Size modified: Reduced vertical size, expanded horizontal size for a wider cinematic landscape aspect ratio */}
              <div className="pt-6 w-full max-w-xl sm:max-w-2xl mx-auto">
                <div className="bg-slate-950 rounded-2xl border border-indigo-500/15 p-4 text-left shadow-2xl select-none transform hover:scale-[1.01] transition-transform duration-350">
                  <div className="flex items-center justify-between border-b border-indigo-950 pb-2 mb-3">
                    <RankSyncerLogo theme="dark" />
                    <span className="text-[8px] font-bold text-indigo-400 font-mono tracking-widest uppercase">RankSyncer Live Optimizer OG Link Preset</span>
                  </div>
                  
                  {/* Mock dashboard screenshot display - compressed height style to look landscape */}
                  <div className="bg-[#040a0c] rounded-xl border border-slate-850 p-3 h-20 overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="h-2 w-28 bg-slate-800 rounded animate-pulse" />
                        <div className="h-1 text-[7px] text-slate-500 font-bold opacity-60">Connected Channel Status Live</div>
                      </div>
                      <span className="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-400 font-extrabold text-[7px] rounded flex items-center justify-center font-mono uppercase">
                        SEO AUTOPILOT ACTIVE
                      </span>
                    </div>

                    {/* Chart preview in grid */}
                    <div className="flex items-end gap-1.5 h-6 pt-1">
                      <div className="h-[20%] w-full bg-indigo-950 rounded-xs" />
                      <div className="h-[35%] w-full bg-indigo-900 rounded-xs" />
                      <div className="h-[55%] w-full bg-indigo-800 rounded-xs" />
                      <div className="h-[40%] w-full bg-slate-850 rounded-xs" />
                      <div className="h-[75%] w-full bg-indigo-600 rounded-xs" />
                      <div className="h-[95%] w-full bg-indigo-550 rounded-xs" />
                      <div className="h-[80%] w-full bg-indigo-500 rounded-xs" />
                      <div className="h-[100%] w-full bg-emerald-500 rounded-xs animate-pulse" />
                    </div>

                    <div className="flex justify-between items-center text-[7px] text-slate-500 font-mono">
                      <span>PROJECT INDEX ACTIVE</span>
                      <span className="text-emerald-400 font-bold">100% HEALTH SYNCED</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed font-bold font-sans">
                    Autonomous platform syncing SERP metrics direct to Webflow, Shopify & WordPress.
                  </p>
                </div>
              </div>  </div>

            </div>

          </div>
        </section>

      </main>

      {/* COMPACT CLEAN FOOTER (Kept exactly as it is now) */}
      <footer className="bg-slate-900 text-slate-400 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 border-b border-slate-800">
          
          <div className="cursor-pointer" onClick={onBackToLanding}>
            <RankSyncerLogo theme="dark" />
          </div>

          <p className="text-xs font-medium text-center sm:text-right">
            Replicating the gorgeous premium Outrank layouts with customizable Green-Teal assets.
          </p>

        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row justify-between text-[11px] text-slate-500 gap-4 text-center">
          <p>© 2026 RankSyncer.co. All rights reserved. Platform seeded by RankSyncer state manager.</p>
          <div className="flex justify-center space-x-4">
            <button onClick={onBackToLanding} className="hover:underline hover:text-white cursor-pointer bg-transparent border-none">Terms of Service</button>
            <span>•</span>
            <button onClick={onBackToLanding} className="hover:underline hover:text-white cursor-pointer bg-transparent border-none">Privacy Policy</button>
            <span>•</span>
            <button onClick={onLaunchApp} className="hover:underline hover:text-white cursor-pointer bg-transparent border-none">Launch Console Demo</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
