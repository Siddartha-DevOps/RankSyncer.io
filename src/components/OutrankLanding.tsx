import React, { useState, useEffect } from 'react';
import RankSyncerLogo from './RankSyncerLogo';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  X, 
  Star, 
  Key, 
  Calendar, 
  Image as ImageIcon, 
  LineChart, 
  Search, 
  TrendingUp, 
  FileText, 
  Maximize2, 
  Lock,
  MessageSquare,
  Globe,
  RefreshCw,
  Clock,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface OutrankLandingProps {
  onLaunchApp: () => void;
  projectsCount: number;
  onPricingClick?: () => void;
  onIntegrationsClick?: () => void;
}

export default function OutrankLanding({ onLaunchApp, projectsCount, onPricingClick, onIntegrationsClick }: OutrankLandingProps) {
  // Interactive States for landing page features
  const [typedKeyword, setTypedKeyword] = useState('best micro saas ideas 2026');
  const [playgroundKeyword, setPlaygroundKeyword] = useState('');
  const [playgroundLoading, setPlaygroundLoading] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState<any | null>(null);
  
  // Interactive state for floating widget clicks
  const [contentScore, setContentScore] = useState(97);
  const [showActiveKeywordDetails, setShowActiveKeywordDetails] = useState(false);
  const [activeCompetitorCheck, setActiveCompetitorCheck] = useState(false);
  const [competitorProgress, setCompetitorProgress] = useState(0);
  const [showSampleArticle, setShowSampleArticle] = useState(false);

  // Auto-scroller or simulator state
  const [activeNicheTab, setActiveNicheTab] = useState<'saas' | 'vegan' | 'solopreneur'>('saas');

  // Trigger competitor scan simulation
  const handleCompetitorScan = () => {
    if (activeCompetitorCheck) return;
    setActiveCompetitorCheck(true);
    setCompetitorProgress(10);
    const interval = setInterval(() => {
      setCompetitorProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 15;
      });
    }, 250);
  };

  // Reset competitor scan
  useEffect(() => {
    if (competitorProgress === 100) {
      const timeout = setTimeout(() => {
        setActiveCompetitorCheck(false);
        setCompetitorProgress(0);
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [competitorProgress]);

  // Simulate AI generated seo briefing report
  const handlePlaygroundGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playgroundKeyword.trim()) return;
    setPlaygroundLoading(true);
    setPlaygroundResult(null);

    setTimeout(() => {
      setPlaygroundLoading(false);
      setPlaygroundResult({
        keyword: playgroundKeyword,
        difficulty: Math.floor(Math.random() * 45) + 20,
        volume: (Math.floor(Math.random() * 8) + 1) * 1200,
        topicCluster: `${playgroundKeyword.charAt(0).toUpperCase() + playgroundKeyword.slice(1)} Hub`,
        suggestedOutlines: [
          `Ultimate step-by-step tutorial on ${playgroundKeyword}`,
          `Why conventional approaches fail for ${playgroundKeyword}`,
          `7 secrets to scale your results today`
        ],
        seoPotential: Math.floor(Math.random() * 15) + 82
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#faf8f9] text-slate-800 font-sans relative overflow-x-hidden selection:bg-emerald-150 selection:text-emerald-900">
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(16, 185, 129, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Hero background radial highlight glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-100/30 to-teal-100/20 rounded-full filter blur-[100px] pointer-events-none z-0" />

      {/* Announcement banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-semibold py-2 px-4 text-center relative z-20">
        <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded mr-2 animate-pulse">New Release</span>
        RankSync v1.2 is live with Topical Flow Analysis & SEO Code Writing Engine.
        <button onClick={onLaunchApp} className="ml-2 underline font-bold hover:text-emerald-100 transition-colors cursor-pointer">
          Try Launch Demo App &rarr;
        </button>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#faf8f9]/85 backdrop-blur-md border-b border-emerald-100/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="cursor-pointer" onClick={onLaunchApp}>
            <RankSyncerLogo theme="light" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <button 
              onClick={onIntegrationsClick} 
              className="hover:text-emerald-600 transition-colors cursor-pointer text-left bg-transparent border-none font-semibold text-sm text-slate-600"
            >
              Integrations
            </button>
            <a href="#playground" className="hover:text-emerald-600 transition-colors">AI Playground</a>
            <button 
              onClick={() => onPricingClick ? onPricingClick() : document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} 
              className="hover:text-emerald-600 transition-colors cursor-pointer text-left bg-transparent border-none font-semibold text-sm text-slate-600"
            >
              Pricing
            </button>
            <button onClick={onLaunchApp} className="hover:text-emerald-600 transition-colors text-slate-650 cursor-pointer">
              Control Panel ({projectsCount} site{projectsCount !== 1 ? 's' : ''})
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={onLaunchApp}
              className="text-sm font-bold text-slate-700 hover:text-emerald-600 px-3.5 py-2 transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={onLaunchApp}
              className="bg-slate-900 text-white hover:bg-emerald-600 font-bold text-sm px-4.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer hover:shadow-emerald-500/10 hover:scale-[1.02]"
            >
              Launch Platform
            </button>
          </div>

        </div>
      </header>

      {/* HERO HERO SECTION */}
      <section className="relative pt-16 pb-24 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 flex flex-col items-center">
        
        {/* Absolute floating decorations corresponding to the Outrank screenshot but themed in green-teal */}
        <div className="relative w-full max-w-5xl">
          
          {/* Card 1: Top Left - SEO Content Score (Interactive) */}
          <div 
            onClick={() => setContentScore(prev => prev === 97 ? 100 : 97)}
            className="hidden md:flex absolute top-2 md:-left-24 lg:-left-36 xl:-left-44 rotate-[-6deg] bg-white p-4.5 rounded-2xl border border-emerald-100/50 shadow-md hover:shadow-lg transition-all duration-300 w-52 select-none cursor-pointer hover:scale-105"
            title="Click to recalculate score!"
          >
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-tight">SEO Content Score</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="relative h-18 w-18 flex items-center justify-center">
                  <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                    <circle cx="36" cy="36" r="28" className="stroke-slate-100 fill-none" strokeWidth="6" />
                    <circle 
                      cx="36" 
                      cy="36" 
                      r="28" 
                      className="stroke-emerald-500 fill-none transition-all duration-1000" 
                      strokeWidth="6" 
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - contentScore / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-lg font-black text-slate-800">{contentScore}%</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs font-bold text-emerald-700">Perfect Content</p>
                  <p className="text-[10px] text-slate-400">Target placements matching high-rank SERP metrics.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Top Right - Personal Images (Interactive) */}
          <div className="hidden md:flex absolute top-6 md:-right-24 lg:-right-36 xl:-right-44 rotate-[8deg] bg-white px-4 py-3 rounded-xl border border-emerald-100/50 shadow-sm hover:shadow-md transition-all duration-300 select-none items-center gap-2.5 cursor-pointer hover:scale-105">
            <span className="p-1 px-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm">
              <ImageIcon className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-slate-800">Auto Generated Images</span>
            <span className="bg-teal-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">✓</span>
          </div>

          {/* Card 3: Middle Left - Power keywords (Interactive) */}
          <div 
            onClick={() => setShowActiveKeywordDetails(!showActiveKeywordDetails)}
            className="hidden md:flex absolute top-[38%] md:-left-32 lg:-left-44 xl:-left-56 rotate-[-9deg] bg-white px-4.5 py-3 rounded-xl border border-emerald-100/50 shadow-sm hover:shadow-md transition-all duration-300 items-center justify-between w-60 select-none cursor-pointer hover:scale-105"
          >
            <div className="flex items-center space-x-2.5">
              <span className="p-1.5 rounded-lg bg-teal-550 bg-emerald-500 text-white text-xs">
                <Key className="h-3.5 w-3.5" />
              </span>
              <div className="text-left">
                <p className="text-xs font-black text-slate-800">Power keywords</p>
                <p className="text-[10px] text-slate-400">Intent analysis unlocked</p>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Card 4: Middle Right - Content Schedule Item (Interactive) */}
          <div className="hidden md:flex absolute top-[36%] md:-right-32 lg:-right-48 xl:-right-56 rotate-[5deg] bg-white p-5 rounded-3xl border border-emerald-100/50 shadow-lg hover:shadow-xl transition-all duration-300 w-72 select-none cursor-pointer hover:scale-[1.03]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-slate-900 text-white text-center rounded-xl p-1.5 w-10 h-11 flex flex-col justify-center">
                  <span className="text-xs font-extrabold leading-none">4</span>
                  <span className="text-[8px] uppercase tracking-wider font-bold">Sat</span>
                </div>
                <div>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-1.5">
                    Published
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Autopilot</span>
            </div>

            <div className="text-left space-y-2 mb-4">
              <h4 className="text-xs font-black text-slate-900 leading-snug">how to write blog posts</h4>
              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                <div>Volume: <strong className="text-slate-800">2154</strong></div>
                <div>Difficulty: <strong className="text-slate-800">9</strong></div>
              </div>
            </div>

            <button 
              onClick={() => setShowSampleArticle(true)}
              className="w-full py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Visit Article</span> &rarr;
            </button>
          </div>

          {/* Card 5: Bottom Left - Calendar Node 5 Sun (Interactive) */}
          <div className="hidden md:flex absolute -bottom-16 md:-left-28 lg:-left-36 xl:-left-44 rotate-[-12deg] bg-white p-4.5 rounded-3xl border border-emerald-100/40 shadow-md hover:shadow-lg transition-all duration-300 w-64 select-none">
            <div className="flex items-start gap-2.5 mb-3">
              <div className="bg-emerald-50 text-emerald-700 text-center rounded-xl p-1 w-9 h-10 flex flex-col justify-center border border-emerald-100">
                <span className="text-xs font-black leading-none">5</span>
                <span className="text-[8px] uppercase font-bold text-emerald-500">Sun</span>
              </div>
              <div className="text-left">
                <h5 className="text-[10px] font-mono text-slate-400">Scheduled Sprint</h5>
                <h4 className="text-[11px] font-extrabold text-slate-800 -mt-0.5 max-w-[150px] truncate">how to monetize blog</h4>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-100">
              <span>Vol: <strong>1950</strong></span>
              <span>Diff: <span className="text-emerald-600 font-extrabold">12</span></span>
            </div>
          </div>

          {/* Card 6: Bottom Right - Competitors analysis (Interactive) */}
          <div 
            onClick={handleCompetitorScan}
            className="hidden md:flex absolute -bottom-12 md:-right-24 lg:-right-36 rotate-[8deg] bg-white p-4.5 rounded-2xl border border-emerald-100/50 shadow-md hover:shadow-lg transition-all duration-300 w-64 select-none cursor-pointer hover:scale-105"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded bg-teal-50 text-teal-600">
                  <LineChart className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-black text-slate-800">Competitors analysis</span>
              </div>
              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 rounded uppercase">Live</span>
            </div>

            {activeCompetitorCheck ? (
              <div className="space-y-2 py-1 text-left">
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>Outranking target logs...</span>
                  <span>{competitorProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${competitorProgress}%` }} />
                </div>
                <p className="text-[9px] text-emerald-600 font-extrabold leading-tight">Searching backlink gaps automatically...</p>
              </div>
            ) : (
              <div className="space-y-1.5 text-left py-1 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">1. rivaldomain.com</span>
                  <span className="text-rose-500 font-bold">Pos #1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-805 font-bold">2. RankSyncer.co (You)</span>
                  <span className="text-emerald-600 font-extrabold">Outranking +4</span>
                </div>
                <p className="text-[9px] text-slate-400 text-center mt-1 pt-1 border-t border-slate-100">Click to run instant SERP outrank audit scan</p>
              </div>
            )}
          </div>

          {/* Core Hero Center Text Block */}
          <div className="text-center space-y-6 relative z-10 py-4 max-w-2xl mx-auto">
            
            {/* Soft high-contrast micro target pill */}
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-250/30 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-black tracking-normal">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Autopilot SEO Integration Platform</span>
            </div>

            {/* Main Header Display - exact text from screenshot */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-black text-slate-900 tracking-tight leading-[1.08]">
              Grow Organic Traffic <br />
              on <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 bg-clip-text text-transparent inline-block relative px-1">
                Auto-Pilot
                <span className="absolute -bottom-1.5 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
              </span>
            </h1>

            {/* Exact subtext from outrank request */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto font-medium">
              Get traffic and outrank competitors with automatic SEO-optimized content generation while you sleep.
            </p>

            {/* Action buttons exactly centered */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onLaunchApp}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-450"
              >
                <span>Get Started – Free</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
              
              <a 
                href="#playground"
                className="w-full sm:w-auto px-6 py-4 text-slate-700 hover:text-emerald-700 font-bold text-sm bg-slate-200/50 hover:bg-slate-200/80 rounded-2xl transition-all cursor-pointer text-center"
              >
                Run Free SEO Audit
              </a>
            </div>

            {/* Five Star User Rating Block exactly from screenshot */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex -space-x-2.5 overflow-hidden">
                <img className="inline-block h-8.5 w-8.5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" alt="User" />
                <img className="inline-block h-8.5 w-8.5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop" alt="User" />
                <img className="inline-block h-8.5 w-8.5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=256&auto=format&fit=crop" alt="User" />
                <img className="inline-block h-8.5 w-8.5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format&fit=crop" alt="User" />
              </div>
              <div className="flex flex-col items-center sm:items-start text-xs">
                <div className="flex text-amber-500">
                  <Star className="h-4.5 w-4.5 fill-current text-amber-400" />
                  <Star className="h-4.5 w-4.5 fill-current text-amber-400" />
                  <Star className="h-4.5 w-4.5 fill-current text-amber-400" />
                  <Star className="h-4.5 w-4.5 fill-current text-amber-400" />
                  <Star className="h-4.5 w-4.5 fill-current text-amber-400" />
                </div>
                <p className="text-slate-500 font-bold mt-0.5">Loved by 154+ paying users</p>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* MODAL / BOTTOM SLIDE DRAWER FOR EXPERIMENTAL CLICKS */}
      {showActiveKeywordDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-150 text-left">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">Autopilot Niche Power Keywords</h3>
              <button 
                onClick={() => setShowActiveKeywordDetails(false)}
                className="text-slate-400 hover:text-slate-750 p-1 bg-slate-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              These terms were generated automatically by comparing competitor content hubs with your actual website's topological gaps.
            </p>

            <div className="space-y-2.5">
              {[
                { kw: 'best micro saas ideas 2026', vol: 2400, diff: 'Easy (32)', intent: 'Commercial' },
                { kw: 'convert nextjs to desktop app', vol: 980, diff: 'Very Easy (15)', intent: 'Transactional' },
                { kw: 'easy vegan dinner recipes 30 mins', vol: 18100, diff: 'Hard (74)', intent: 'Informational' },
                { kw: 'vegan cheese that melts reddit', vol: 1750, diff: 'Easy (29)', intent: 'Commercial' }
              ].map((k, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-150 hover:bg-emerald-50/40 hover:border-emerald-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-extrabold text-slate-950 font-mono">"{k.kw}"</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 rounded uppercase">
                      {k.intent}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-2 font-mono">
                    <span>Search Volume: <strong>{k.vol.toLocaleString()}</strong></span>
                    <span>DIfficulty: <strong>{k.diff}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowActiveKeywordDetails(false);
                onLaunchApp();
              }}
              className="mt-5 w-full py-3 bg-slate-900 hover:bg-[#10b981] text-white font-extrabold text-xs rounded-xl transition-all"
            >
              Seed Keyword in Content Planner App
            </button>
          </div>
        </div>
      )}

      {showSampleArticle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-150 text-left">
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <div>
                <span className="text-[10px] bg-emerald-100 text-emerald-850 font-bold px-2 py-0.5 rounded-full uppercase">
                  Live SEO Generated Sample
                </span>
                <h3 className="font-extrabold text-slate-950 text-lg mt-1 tracking-tight">WordPress Draft preview</h3>
              </div>
              <button 
                onClick={() => setShowSampleArticle(false)}
                className="text-slate-400 hover:text-slate-750 p-1.5 bg-slate-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-700 text-sm">
              <h1 className="text-2xl font-black text-slate-900 leading-tight">Top 7 Best Micro SaaS Ideas for Solo Builders in 2026</h1>
              <p className="text-xs text-slate-400 font-mono">Published automatically by RankSync Autopilot to your connected webflow site.</p>
              
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                ✓ Target Keyword density check: <strong>"best micro saas ideas 2026"</strong> appeared 4 times. Overall content audit scored <strong>97 / 100</strong>.
              </div>

              <p className="leading-relaxed">
                Starting a software business has never been more straightforward. In 2026, the trend has shifted heavily away from over-engineered mega-platforms toward target-focused, high-efficiency micro-tools. Let's delve into the absolute <strong>best micro saas ideas 2026</strong> has to offer.
              </p>

              <h2 className="text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">1. Niche API Mocking Services</h2>
              <p className="leading-relaxed">
                Developers constantly spend time crafting local backend configurations just to test frontend layouts. A dedicated mock generator with fine-tuned latency simulation can solve this in seconds, generating a high rank of organic inbound search engine placements.
              </p>

              <h2 className="text-base font-extrabold text-slate-900 pt-2">2. Dynamic SEO Crawler and Sync Utilities</h2>
              <p className="leading-relaxed">
                Automating your internal asset linking is a major win. Providing custom automated analytics reports directly to a CMS without human overhead is why micro-automation is a lucrative field.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-3xl flex items-center justify-between">
              <span className="text-xs text-slate-500">Length: <strong>1,450 words</strong></span>
              <button
                onClick={() => {
                  setShowSampleArticle(false);
                  onLaunchApp();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl"
              >
                Open inside SEO Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERACTIVE PLAYGROUND SECTION */}
      <section id="playground" className="py-20 bg-white border-y border-emerald-100/40 relative z-10 scroll-mt-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          
          <div className="max-w-xl mx-auto space-y-3 mb-10">
            <span className="text-[10px] text-emerald-600 uppercase font-black tracking-widest bg-emerald-50 p-1.5 px-3 rounded-full">
              Try It Out Right Now
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
              Instant AI Keyword Analysis Playground
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Enter any keyword niche you want to generate content for, and see how our crawler identifies structural backlink density gaps!
            </p>
          </div>

          <form onSubmit={handlePlaygroundGenerate} className="bg-[#faf8f9] p-4 rounded-3xl border border-slate-150 shadow-sm flex flex-col md:flex-row gap-3 items-center max-w-2xl mx-auto mb-8">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                required
                placeholder="e.g. scale micro saas backlinks" 
                className="w-full bg-white text-slate-800 rounded-2xl border border-slate-200 pl-11 pr-4 py-3 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-bold"
                value={playgroundKeyword}
                onChange={(e) => setPlaygroundKeyword(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={playgroundLoading}
              className="w-full md:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-2xl transition-all cursor-pointer shadow-md shadow-emerald-500/15"
            >
              {playgroundLoading ? 'Crawling SERP...' : 'Generate AI SEO Brief'}
            </button>
          </form>

          {/* Render playground output card */}
          {playgroundLoading && (
            <div className="p-8 bg-[#faf8f9]/50 rounded-3xl border border-dashed border-emerald-200/60 max-w-2xl mx-auto flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
              <div className="text-center font-bold">
                <p className="text-xs text-slate-800">Booting Headless SERP Scraping proxy...</p>
                <p className="text-[10px] text-slate-400 mt-1">Analyzing competitor heading structures & meta tag densities</p>
              </div>
            </div>
          )}

          {playgroundResult && (
            <div className="p-6 bg-[#faf8f9] rounded-3xl border border-emerald-100 text-left max-w-2xl mx-auto shadow-sm space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-150 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">Target Keyword Concept</span>
                  <h4 className="font-extrabold text-slate-900 text-sm">"{playgroundResult.keyword}"</h4>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-3 py-1 rounded-xl text-xs font-black self-start">
                  Seo potential: {playgroundResult.seoPotential}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">Monthly Volume</span>
                  <p className="text-base font-black text-emerald-800 mt-0.5">{playgroundResult.volume} queries</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-mono">KD Difficulty</span>
                  <p className="text-base font-black text-rose-600 mt-0.5">{playgroundResult.difficulty} / 100</p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">AI Generated Outline Architecture:</h5>
                <ul className="space-y-1.5">
                  {playgroundResult.suggestedOutlines.map((out: string, idx: number) => (
                    <li key={idx} className="flex items-start text-xs text-slate-600 gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 font-medium">Topical Hub: <strong>{playgroundResult.topicCluster}</strong></span>
                <button
                  type="button"
                  onClick={onLaunchApp}
                  className="px-4.5 py-2 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-emerald-600 transition-colors cursor-pointer text-center"
                >
                  Create Article Draft on Platform
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 scroll-mt-10">
        <div className="text-center space-y-3 max-w-xl mx-auto mb-16">
          <span className="text-[10px] font-black tracking-normal text-emerald-605 uppercase bg-emerald-50 p-1 py-1.5 px-3 rounded text-emerald-700">Autopilot Flow</span>
          <h2 className="text-3xl md:text-4xl font-sans font-black text-slate-900 tracking-tight leading-none">
            Scale Traffic in Three Steps
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-sm mx-auto">
            Our autonomous loop works behind the scenes, monitoring rank metrics constantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-white p-6.5 rounded-3xl border border-emerald-100/40 shadow-sm relative hover:scale-[1.01] transition-all">
            <span className="absolute top-4 right-4 text-4xl font-black text-emerald-100/60 font-mono">01</span>
            <div className="h-10 w-10 bg-emerald-100/50 text-emerald-700 rounded-xl flex items-center justify-center font-black mb-5">
              🔍
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-2">1. Connect & Crawler Scan</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Plug in your CMS URL. Our crawler scans your rank status and finds keywords with high conversion intent but low current authority.
            </p>
          </div>

          <div className="bg-white p-6.5 rounded-3xl border border-emerald-100/40 shadow-sm relative hover:scale-[1.01] transition-all">
            <span className="absolute top-4 right-4 text-4xl font-black text-emerald-100/60 font-mono">02</span>
            <div className="h-10 w-10 bg-emerald-100/50 text-emerald-700 rounded-xl flex items-center justify-center font-black mb-5">
              ✍️
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-2">2. Write & Validate</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Our editor drafts perfectly optimized content outline clusters, checking semantic target density automatically against top 10 competitors.
            </p>
          </div>

          <div className="bg-white p-6.5 rounded-3xl border border-emerald-100/40 shadow-sm relative hover:scale-[1.01] transition-all">
            <span className="absolute top-4 right-4 text-4xl font-black text-emerald-100/60 font-mono">03</span>
            <div className="h-10 w-10 bg-emerald-100/50 text-emerald-700 rounded-xl flex items-center justify-center font-black mb-5">
              🚀
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mb-2">3. Auto Sync & Rank</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Sync automatically with WordPress or Webflow. Track keyword ranking movements upwards within the intuitive charts.
            </p>
          </div>

        </div>
      </section>

      {/* VALUE BENTO GRID FEATURES SECTION */}
      <section id="features" className="py-20 bg-[#faf8f9] border-t border-emerald-100/40 relative z-10 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-md mx-auto space-y-3 mb-16">
            <span className="text-xs text-emerald-600 font-extrabold uppercase bg-emerald-50 px-3 py-1 rounded-full">Pro Features</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
              Supercharge Content Rank Cycles
            </h2>
            <p className="text-xs text-slate-505 font-semibold text-slate-500">
              Stop guessing. Every single post serves a precise semantic keyword strategy.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs lg:col-span-2">
              <h4 className="font-black text-slate-950 text-sm mb-1 uppercase tracking-wider text-emerald-750">Integrated Topic Mapping</h4>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Visual Topical Clustering Maps</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4 max-w-xl">
                 Group relevant topics together in beautiful interconnected clusters. This is what Google absolute loves to see: bulletproof context relevancy instead of standard messy blog post grids.
              </p>
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-3 text-[10px] text-slate-400 font-mono">
                  <span>Topical Relevancy Seed: "Vegan Blog"</span>
                  <span className="text-emerald-700">6 Sub-Nodes active</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white border border-slate-200 rounded-lg p-2 font-bold hover:border-emerald-500 transition-colors">"plant based nutrients" &rarr;</span>
                  <span className="bg-white border border-slate-200 rounded-lg p-2 font-bold hover:border-emerald-500 transition-colors">"vegan meal preps" &rarr;</span>
                  <span className="bg-white border border-slate-200 rounded-lg p-2 font-bold hover:border-emerald-500 transition-colors">"high protein vegan recipes" &rarr;</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="font-black text-slate-950 text-sm mb-1 uppercase tracking-wider text-emerald-750">Autonomous Pilot</h4>
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">Continuous Sync Engine</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">
                  Set target thresholds. If a key term drops out of the Google TOP 10 search results, our engine automatically rewrites and repushes with improved semantic density triggers.
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>Auto tracking: Active</span>
                <span className="h-2 w-2 rounded-full bg-emerald-555 bg-emerald-500 animate-ping" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* PRICING PLANS SECTION */}
      <section id="pricing" className="py-20 bg-white border-y border-emerald-100/40 relative z-10 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 max-w-xl mx-auto mb-16">
            <span className="text-[10px] font-black tracking-normal text-emerald-600 uppercase bg-emerald-50 p-1 py-1.5 px-3 rounded">Honest Billing</span>
            <h2 className="text-3xl md:text-4xl font-sans font-black text-slate-900 tracking-tight leading-none">
              Simple-Tier Plans Built For Growth
            </h2>
            <p className="text-slate-550 text-xs sm:text-sm font-semibold text-slate-500">
              Deploy customized content automatically today. No hidden retainers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            
            {/* Plan 1: Free Tier */}
            <div className="bg-[#faf8f9] p-7.5 rounded-3xl border border-slate-200/60 shadow-xs flex flex-col justify-between text-left hover:border-emerald-300 transition-colors">
              <div>
                <span className="text-xs font-black uppercase text-slate-400">Sandbox Pilot</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Free Trial Developer</h3>
                <p className="text-slate-500 text-xs mt-2 mb-6">Test keyword scraping, topological outlines, content editing, and simulated deployments.</p>
                
                <div className="flex items-baseline mb-6">
                  <span className="text-3xl font-black text-slate-900">$0</span>
                  <span className="text-xs text-slate-500 ml-1.5 font-bold">forever free</span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-slate-200/60 text-xs text-slate-655 space-y-3 text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>Create up to 3 Active Project Domains</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>Simulate Headless Crawler Runs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>Seeding outlines via Topical Clusters Map</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>Manual SEO Score Editor analysis</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={onLaunchApp}
                className="mt-8 w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Access Free Sandbox Launch
              </button>
            </div>

            {/* Plan 2: Pro Tier */}
            <div className="bg-gradient-to-br from-emerald-50/20 to-teal-50/10 p-7.5 rounded-3xl border-2 border-emerald-500 shadow-lg flex flex-col justify-between text-left relative hover:scale-[1.01] transition-all">
              <span className="absolute -top-3.5 right-6 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                Highly Recommended
              </span>

              <div>
                <span className="text-xs font-black uppercase text-emerald-700">Autopilot Professional</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">SEO Outrank Elite</h3>
                <p className="text-slate-500 text-xs mt-2 mb-6 text-slate-600">Unlimited automated content synchronization drafts, high-speed cron crawler intervals.</p>
                
                <div className="flex items-baseline mb-6">
                  <span className="text-3xl font-black text-slate-900">$29</span>
                  <span className="text-xs text-slate-500 ml-1.5 font-bold">per month</span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-emerald-200 text-xs text-slate-650 space-y-3 text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span><strong>Volume: Unlimited</strong> Sites & Domain Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>Real-time Google SERP Web Crawl Nodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>Instant automatic Publishing Webhooks (WordPress/Webflow)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <span>Autonomous Pilot: Drop mitigation optimizer active</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={onLaunchApp}
                className="mt-8 w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Go Elite &mdash; Get Started
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* COMPACT CLEAN FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pb-8 border-b border-slate-800">
          
          <div className="cursor-pointer" onClick={onLaunchApp}>
            <RankSyncerLogo theme="dark" />
          </div>

          <p className="text-xs font-medium text-center sm:text-right">
            Replicating the gorgeous premium Outrank layouts with customizable Green-Teal assets.
          </p>

        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row justify-between text-[11px] text-slate-500 gap-4 text-center">
          <p>© 2026 RankSyncer.co. All rights reserved. Platform seeded by RankSyncer state manager.</p>
          <div className="flex justify-center space-x-4">
            <a href="#how-it-works" className="hover:underline">Terms of Service</a>
            <span>•</span>
            <a href="#features" className="hover:underline">Privacy Policy</a>
            <span>•</span>
            <button onClick={onLaunchApp} className="hover:underline hover:text-white cursor-pointer">Launch Console Demo</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
