import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  TrendingUp, 
  Lock, 
  Mail, 
  User, 
  Download, 
  Printer, 
  ExternalLink, 
  RefreshCw,
  Globe2,
  ListFilter,
  BarChart2,
  CornerDownRight,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

interface SeoAuditToolProps {
  onBackToLanding: () => void;
  onLaunchApp: () => void;
  onPricingClick: () => void;
  projectsCount?: number;
}

export default function SeoAuditTool({ onBackToLanding, onLaunchApp, onPricingClick, projectsCount = 0 }: SeoAuditToolProps) {
  // Analytical & historical states
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState<'audit' | 'analytics'>('audit');

  // Audit Flow States
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorText, setErrorText] = useState('');
  const [currentReport, setCurrentReport] = useState<any>(null);

  // Lead Gate Modal state
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadName, setLeadName] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [unlockedReport, setUnlockedReport] = useState<any>(null);
  const [conversionSuccessInfo, setConversionSuccessInfo] = useState<any>(null);

  // Load audit statistics
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await fetch('/api/seo-audit/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        setRecentAudits(data.recent_audits || []);
      }
    } catch (e) {
      console.error("Failed to load audit analytics stats:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Run Crawl Simulation Handler
  const handleInitiateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setCurrentReport(null);
    setUnlockedReport(null);
    setConversionSuccessInfo(null);

    if (!websiteUrl || websiteUrl.trim().length < 4) {
      setErrorText("Please enter a valid website domain address (e.g., mysite.com).");
      return;
    }

    setAuditLoading(true);
    setAuditProgress(5);
    setProgressMessage("Resolving DNS of host...");

    // Staggered interactive progress animation
    const progressIntervals = [
      { prg: 20, msg: "Connecting to server port 443..." },
      { prg: 35, msg: "Crawling HTML index file..." },
      { prg: 50, msg: "Evaluating title tag metrics & meta descriptions..." },
      { prg: 65, msg: "Running Technical checklist validators..." },
      { prg: 80, msg: "Analyzing text readability and content gaps..." },
      { prg: 92, msg: "Consulting Gemini AI optimizer engine..." },
      { prg: 100, msg: "Compiling SEO Score matrix..." }
    ];

    for (let i = 0; i < progressIntervals.length; i++) {
      const step = progressIntervals[i];
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
      setAuditProgress(step.prg);
      setProgressMessage(step.msg);
    }

    try {
      const res = await fetch('/api/seo-audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: websiteUrl.trim() })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Crawl interrupted.");
      }

      const data = await res.json();
      setCurrentReport(data.report);
      
      // Keep report locked first unless they supplied email during initial submission, 
      // or if report already has email populated from a previous analysis lookup.
      if (data.report.email) {
        setUnlockedReport(data.report);
      } else {
        setShowLeadGate(true);
      }

      // Refresh admin stats log list
      fetchAnalytics();
    } catch (err: any) {
      setErrorText(err.message || "Failed to finalize crawler check.");
    } finally {
      setAuditLoading(false);
    }
  };

  // Submit Lead Gate Handler (Unlocks detailed matrices)
  const handleUnlockDetailedReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail || !leadEmail.includes("@")) {
      alert("Please enter a valid email address first.");
      return;
    }

    setIsSubmittingLead(true);
    try {
      const res = await fetch('/api/seo-audit/save-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId: currentReport.audit_id,
          email: leadEmail.trim(),
          name: leadName.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUnlockedReport(data.report);
        setConversionSuccessInfo(data);
        setShowLeadGate(false);
        fetchAnalytics(); // reload stats
      } else {
        alert("Authorization failed, please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Network failure unlocking report records.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 50) return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
    return 'text-red-500 border-red-500/20 bg-red-500/5';
  };

  return (
    <div id="seo-audit-tool-view" className="min-h-screen bg-[#060c09] text-slate-100 font-sans selection:bg-[#10b981]/20 selection:text-[#4ade80]">
      
      {/* HEADER SECTION */}
      <header className="border-b border-[#11251e] bg-[#060c09]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onBackToLanding}>
            <span className="font-sans font-black tracking-tighter text-lg text-slate-100 flex items-center gap-1.5">
              <span className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]">R</span>
              RankSyncer<span className="text-[#4ade80] font-black">.</span>
            </span>
          </div>

          <nav className="hidden lg:flex items-center space-x-6 text-xs font-bold text-slate-400">
            <button onClick={onBackToLanding} className="hover:text-[#4ade80] transition-colors cursor-pointer">How It Works</button>
            <button onClick={onBackToLanding} className="hover:text-[#4ade80] transition-colors cursor-pointer">Features</button>
            <button onClick={onBackToLanding} className="hover:text-[#4ade80] transition-colors cursor-pointer">Integrations</button>
            <button onClick={onBackToLanding} className="hover:text-[#4ade80] transition-colors cursor-pointer">AI Playground</button>
            <button onClick={onPricingClick} className="hover:text-[#4ade80] transition-colors cursor-pointer">Pricing</button>
            <button onClick={onLaunchApp} className="hover:text-[#4ade80] transition-colors cursor-pointer text-[#4ade80] bg-emerald-900/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              Control Panel ({projectsCount} Site{projectsCount !== 1 ? 's' : ''})
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setActiveSegment(activeSegment === 'audit' ? 'analytics' : 'audit')}
              className="text-xs font-bold bg-[#11271f] hover:bg-[#1a382d] border border-[#1d3d31] text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {activeSegment === 'audit' ? (
                <>
                  <BarChart2 className="h-3.5 w-3.5 text-[#4ade80]" />
                  Analytics Live Stats
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5 text-[#4ade80]" />
                  Run Audit Tool
                </>
              )}
            </button>
            <button 
              onClick={onLaunchApp}
              className="bg-[#10b981] hover:bg-[#059669] text-[#060c09] font-black text-xs px-4 py-2 rounded-xl transition-all shadow-[0_4px_14px_rgba(16,185,129,0.2)] hover:scale-[1.02] cursor-pointer"
            >
              Launch Console
            </button>
          </div>
        </div>
      </header>

      {/* CORE WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {activeSegment === 'audit' ? (
          <div>
            
            {/* HERO HERO SECTION */}
            <div className="text-center max-w-3xl mx-auto mb-10 mt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[#4ade80] rounded-full text-xs font-bold mb-4 animate-pulse">
                <Sparkles className="h-3 w-3" />
                Next-Gen SEO Crawler & Authority Audit
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent leading-tight font-sans">
                Free SEO Audit Tool
              </h1>
              <p className="text-sm md:text-base text-slate-400 font-sans leading-relaxed">
                Analyze your website and discover SEO issues, ranking opportunities, and growth recommendations in minutes.
              </p>
            </div>

            {/* URL SUBMISSION FORM */}
            <div className="max-w-2xl mx-auto mb-14">
              <form onSubmit={handleInitiateAudit} className="bg-[#0b1411] p-2.5 rounded-2xl border border-[#142820] shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex flex-col md:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Globe2 className="absolute left-3.5 top-3.5 h-4 w-4 text-emerald-500/60" />
                  <input 
                    type="text" 
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="Enter website domain address (e.g., coolproduct.io)"
                    className="w-full bg-slate-950/60 text-slate-100 outline-none placeholder:text-slate-500 pl-11 pr-4 py-3 border border-[#14261f] focus:border-[#4ade80] rounded-xl text-sm transition-all"
                    disabled={auditLoading}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={auditLoading}
                  className="bg-[#10b981] hover:bg-[#059669] text-[#060c09] font-black text-sm px-6 py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {auditLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-[#060c09]" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze Website
                      <ArrowRight className="h-4 w-4 text-[#060c09]" />
                    </>
                  )}
                </button>
              </form>

              {errorText && (
                <div className="mt-4 p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorText}</span>
                </div>
              )}

              {/* PROGRESS VIEW SCREEN */}
              {auditLoading && (
                <div className="mt-8 bg-[#0b1411] border border-[#12251e] p-6 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-between text-xs font-bold mb-2.5">
                    <span className="text-emerald-400 flex items-center gap-2">
                      <Cpu className="h-3.5 w-3.5 animate-spin" />
                      {progressMessage}
                    </span>
                    <span className="text-slate-400 font-mono">{auditProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-[#11241d]">
                    <div 
                      className="bg-gradient-to-r from-[#10b981] to-[#4ade80] h-full transition-all duration-300"
                      style={{ width: `${auditProgress}%` }}
                    />
                  </div>
                  <div className="mt-4 text-[11px] text-slate-500 text-center uppercase tracking-wider font-semibold font-mono">
                    Do not close this page. Crawlers are executing active document nodes.
                  </div>
                </div>
              )}
            </div>

            {/* AUDIT SUMMARY DISPLAY */}
            {currentReport && (
              <div id="seo-audit-report-node" className="space-y-6 animate-fadeIn">
                
                {/* MATRICES TITLE */}
                <div className="bg-[#0b1411] border border-[#13271f] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                      <span>Crawl Matrix for:</span>
                      <span className="text-[#4ade80] font-mono tracking-tight underline">{currentReport.website_url}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-mono font-bold">
                      Diagnostic report id: SECURE_ID_{currentReport.audit_id.slice(0, 12).toUpperCase()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.open(`/api/seo-audit/download-report/${currentReport.audit_id}`, '_blank')}
                      className="p-2.5 bg-slate-950 hover:bg-[#11231c] border border-[#14261f] hover:border-emerald-500/20 text-slate-200 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 text-emerald-400" />
                      Print / PDF Export
                    </button>
                    {conversionSuccessInfo?.trial_link && (
                      <a 
                        href={conversionSuccessInfo.trial_link}
                        className="p-2.5 bg-[#10b981] hover:bg-[#059669] text-[#060c09] rounded-xl transition-all text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[#060c09]" />
                        Claim Free Trial
                      </a>
                    )}
                  </div>
                </div>

                {/* OVERALL RATING BOXES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="bg-[#0a110e] border border-emerald-950 rounded-2xl p-5 text-center flex flex-col justify-between shadow-md">
                    <div className="text-xs uppercase font-bold text-slate-400">SEO Rank Score</div>
                    <div className="my-3 text-4xl font-black text-emerald-400 font-mono">{currentReport.seo_score}%</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Indexed Grade</div>
                  </div>
                  
                  <div className="bg-[#0a110e] border border-slate-900 rounded-2xl p-5 text-center flex flex-col justify-between shadow-md">
                    <div className="text-xs uppercase font-bold text-slate-400">Technical Checks</div>
                    <div className={`my-3 text-3xl font-black font-mono ${currentReport.technical_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{currentReport.technical_score}%</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Structural Checks</div>
                  </div>

                  <div className="bg-[#0a110e] border border-slate-900 rounded-2xl p-5 text-center flex flex-col justify-between shadow-md">
                    <div className="text-xs uppercase font-bold text-slate-400">Content Quality</div>
                    <div className={`my-3 text-3xl font-black font-mono ${currentReport.content_score >= 80 ? 'text-indigo-400' : 'text-amber-400'}`}>{currentReport.content_score}%</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Depth & Topics</div>
                  </div>

                  <div className="bg-[#0a110e] border border-slate-900 rounded-2xl p-5 text-center flex flex-col justify-between shadow-md">
                    <div className="text-xs uppercase font-bold text-slate-400">UX & Performance</div>
                    <div className="my-3 text-3xl font-[#ec4899] text-pink-400 font-black font-mono">{currentReport.performance_score}%</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Page Speed Load</div>
                  </div>

                  <div className="bg-[#0a110e] border border-slate-900 rounded-2xl p-5 text-center flex flex-col justify-between shadow-md">
                    <div className="text-xs uppercase font-bold text-slate-400">Moz Authority</div>
                    <div className="my-3 text-3xl text-purple-400 font-black font-mono">{currentReport.authority_score}%</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Static Backlinks</div>
                  </div>

                  <div className="bg-[#0a110e] border border-slate-900 rounded-2xl p-5 text-center flex flex-col justify-between shadow-md">
                    <div className="text-xs uppercase font-bold text-slate-400">Keyword Slots</div>
                    <div className="my-3 text-3xl text-amber-500 font-black font-mono">{currentReport.keyword_opportunity_score}%</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Unclaimed Niche</div>
                  </div>
                </div>

                {/* AI EXECUTIVE INSIGHTS PANEL */}
                <div className="bg-gradient-to-r from-[#11241c] to-[#0d1613] border border-emerald-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl" />
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-[#4ade80] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider mb-2">AI Summary Insights & Diagnostics</h3>
                      <p className="text-sm text-slate-300 leading-relaxed italic font-sans">
                        "{currentReport.ai_growth_insights?.plain_language_summary || "Our AI model identifies micro niches to outrank existing search page slots for this domain. Authenticate detailed reports below."}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* THE LEAD GENERATION GATING MECHANISM */}
                {!unlockedReport ? (
                  <div className="bg-[#0b1411] border-2 border-dashed border-[#1a382d] rounded-2xl p-8 relative overflow-hidden shadow-xl text-center">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6">
                      <div className="max-w-md bg-[#070e0b] border border-[#152e24] rounded-2xl p-6.5 shadow-2xl relative">
                        <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Lock className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-2 leading-tight">Unlock Executive Core Audit</h3>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                          We found <span className="text-red-400 font-bold">{currentReport.critical_issues.length} critical SEO errors</span> and <span className="text-amber-400 font-bold">{currentReport.warnings.length} structure warnings</span> on your site. Unlock detailed recommendations lists & content drift analysis instantly.
                        </p>

                        <form onSubmit={handleUnlockDetailedReport} className="space-y-3 text-left">
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <input 
                              type="email" 
                              required
                              value={leadEmail}
                              onChange={(e) => setLeadEmail(e.target.value)}
                              placeholder="Your business email address (required)"
                              className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-500 text-xs pl-10 pr-4 py-2.5 border border-[#11241c] rounded-xl outline-none focus:border-[#10b981]"
                            />
                          </div>
                          
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <input 
                              type="text" 
                              value={leadName}
                              onChange={(e) => setLeadName(e.target.value)}
                              placeholder="Your name (optional)"
                              className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-500 text-xs pl-10 pr-4 py-2.5 border border-[#11241c] rounded-xl outline-none focus:border-[#10b981]"
                            />
                          </div>

                          <button 
                            type="submit"
                            disabled={isSubmittingLead}
                            className="w-full bg-[#10b981] hover:bg-[#059669] text-[#060c09] font-black text-xs py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {isSubmittingLead ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin text-[#060c09]" />
                                Syncing Secure Certificate...
                              </>
                            ) : (
                              <>
                                Unlock Detailed SEO Audit
                                <ChevronRight className="h-4 w-4 text-[#060c09]" />
                              </>
                            )}
                          </button>
                        </form>

                        <div className="mt-4 text-[10px] text-zinc-500 text-center uppercase tracking-wider font-semibold">
                          🔒 No Credit Card required. Unlocks printable PDF and actions checklist.
                        </div>
                      </div>
                    </div>

                    {/* BLURRED MOCK CONTENT - FEELS IMMERSIVE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 pointer-events-none select-none blur-xs filter">
                      <div className="bg-[#0b1411] border border-slate-900 rounded-xl p-5 text-left h-52">
                        <div className="h-4 w-28 bg-slate-800 rounded-md mb-2" />
                        <div className="h-2 w-full bg-slate-800 rounded-md mb-2" />
                        <div className="h-2 w-full bg-slate-800 rounded-md mb-2" />
                        <div className="h-2 w-full bg-slate-800 rounded-md" />
                      </div>
                      <div className="bg-[#0b1411] border border-slate-900 rounded-xl p-5 text-left h-52">
                        <div className="h-4 w-28 bg-slate-800 rounded-md mb-2" />
                        <div className="h-2 w-full bg-slate-800 rounded-md mb-2" />
                        <div className="h-2 w-full bg-slate-800 rounded-md mb-2" />
                        <div className="h-2 w-full bg-slate-800 rounded-md" />
                      </div>
                    </div>
                  </div>
                ) : (
                  
                  // DETAILED UNLOCKED FINDINGS CARD LISTS!
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* CRITICAL VS WARNING FINDINGS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* CRITICAL ISSUES */}
                      <div className="bg-[#0b1411] border border-red-950/40 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-2 border-b border-[#11241a] pb-3 mb-4">
                          <CheckCircle2 className="h-4 w-4 text-red-500" />
                          Critical Technical Blockers ({unlockedReport.critical_issues.length})
                        </h3>

                        <div className="space-y-4">
                          {unlockedReport.critical_issues.map((item: any, i: number) => (
                            <div key={i} className="p-4 bg-red-950/10 border border-red-500/20 rounded-xl text-xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-red-400 uppercase tracking-wider">⚠️ {item.title}</span>
                                <span className="text-[10px] text-red-500/80 font-mono font-bold uppercase tracking-wider">Action Required</span>
                              </div>
                              <p className="text-slate-300 leading-relaxed">{item.message}</p>
                              <div className="pt-2 border-t border-red-900/30 text-emerald-400 mt-2">
                                <span className="font-black text-slate-400 uppercase font-mono tracking-wide">💡 AI Recommendation:</span> {item.fix}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* WARNINGS */}
                      <div className="bg-[#0b1411] border border-amber-950/40 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 border-b border-[#11241a] pb-3 mb-4">
                          <CheckCircle2 className="h-4 w-4 text-amber-500" />
                          Structural Improvements & Gaps ({unlockedReport.warnings.length})
                        </h3>

                        <div className="space-y-4">
                          {unlockedReport.warnings.map((item: any, i: number) => (
                            <div key={i} className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl text-xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-amber-500 uppercase tracking-wider">🔸 {item.title}</span>
                                <span className="text-[10px] text-amber-500/80 font-mono font-bold uppercase tracking-wider">Optimize</span>
                              </div>
                              <p className="text-slate-300 leading-relaxed">{item.message}</p>
                              <div className="pt-2 border-t border-amber-900/30 text-emerald-400 mt-2">
                                <span className="font-black text-slate-400 uppercase font-mono tracking-wide">💡 Proposed Fix:</span> {item.fix}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* CONTENT DRIFT & AUDIT METRICS */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* CONTENT HEALTH */}
                      <div className="bg-[#0b1411] border border-[#142820] rounded-2xl p-6 shadow-xl lg:col-span-7">
                        <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest flex items-center gap-2 border-b border-[#11241a] pb-3 mb-4">
                          <Cpu className="h-4 w-4 text-emerald-400" />
                          On-Page Content Drift Analysis
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="bg-[#060c09] p-4 border border-[#11221b] rounded-xl text-center">
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Topical Quality</div>
                            <div className="text-lg font-black text-[#4ade80] uppercase tracking-wide">{unlockedReport.content_analysis.quality}</div>
                            <div className="text-[9px] text-slate-500 font-mono italic mt-1">Authority Index: {unlockedReport.content_analysis.topical_authority_index}/100</div>
                          </div>
                          
                          <div className="bg-[#060c09] p-4 border border-[#11221b] rounded-xl text-center">
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Standard Readability Level</div>
                            <div className="text-lg font-black text-indigo-400 font-mono">{unlockedReport.content_analysis.readability_score}</div>
                            <div className="text-[9px] text-slate-500 font-mono italic mt-1">Optimal target scale is 60 - 80</div>
                          </div>
                        </div>

                        <div className="space-y-4 text-xs">
                          <div className="bg-[#060c09] p-4 border border-[#11221b] rounded-xl">
                            <span className="font-extrabold text-slate-300 font-sans block mb-1">Keyword Optimization density:</span>
                            <p className="text-slate-400 leading-relaxed font-sans">{unlockedReport.content_analysis.keyword_density}</p>
                          </div>

                          <div className="p-4 border border-[#11221b] rounded-xl">
                            <span className="font-extrabold text-slate-300 block mb-2 font-sans">Identified Content Gaps & Drift warnings:</span>
                            <ul className="space-y-2">
                              {unlockedReport.content_analysis.content_gaps.map((gap: string, idx: number) => (
                                <li key={idx} className="flex gap-2 items-start text-slate-300">
                                  <CornerDownRight className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                  <span>{gap}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* AI CONTENT PLANNERS */}
                      <div className="bg-[#0b1411] border border-[#142820] rounded-2xl p-6 shadow-xl lg:col-span-5 flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest flex items-center gap-2 border-b border-[#11241a] pb-3 mb-4">
                            <Cpu className="h-4 w-4 text-indigo-400" />
                            AI-Triggered Search Page Clusters
                          </h3>
                          <p className="text-xs text-slate-450 mb-4 font-sans leading-relaxed">
                            Based on competitor drift metrics of <span className="text-[#4ade80] underline">{currentReport.website_url}</span>, outrank them on Google by publishing optimized content briefs directly into our private backlink networks targeting these terms:
                          </p>

                          <div className="space-y-2.5 text-xs">
                            {unlockedReport.ai_growth_insights.content_ideas.map((idea: string, idx: number) => (
                              <div key={idx} className="p-3 bg-indigo-950/10 border border-indigo-500/15 rounded-xl text-indigo-200 flex items-center justify-between hover:border-indigo-500/20 transition-all">
                                <span className="font-sans font-semibold leading-snug">{idea}</span>
                                <ExternalLink className="h-3 w-3 text-slate-500 flex-shrink-0 ml-2" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* FINAL CONVERSION CALL-TO-ACTION CARDS */}
                        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-900/20 to-indigo-950/10 border border-emerald-500/15 text-center space-y-3.5 shadow-md">
                          <div>
                            <span className="text-[10px] text-[#4ade80] tracking-widest font-bold uppercase block mb-1">Automation ready!</span>
                            <h4 className="text-xs font-black text-white">Outrank Competitors Automatically</h4>
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                              Connect with Webmasters and Search Console API under our 14-day premium free trial period.
                            </p>
                          </div>
                          
                          <button 
                            onClick={onPricingClick}
                            className="w-full bg-[#10b981] hover:bg-[#059669] text-[#060c09] font-black text-xs py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all hover:scale-[1.01] cursor-pointer"
                          >
                            Claim 14-Day Free Trial
                            <ArrowRight className="h-3.5 w-3.5 text-[#060c09]" />
                          </button>
                        </div>

                      </div>

                    </div>


                    {/* PASSED CHECKS SUMMARY BOARD */}
                    <div className="bg-[#0b1411] border border-[#142820] rounded-2xl p-6 shadow-xl">
                      <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest flex items-center gap-2 border-b border-[#11241a] pb-3 mb-4">
                        <CheckCircle2 className="h-4 w-4 text-[#4ade80]" />
                        Passed Crawl Benchmarks ({unlockedReport.passed_checks.length})
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unlockedReport.passed_checks.map((pcheck: string, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-950/40 border border-[#11241a] text-slate-300 text-xs rounded-xl flex items-center gap-2.5">
                            <span className="h-4.5 w-4.5 rounded-full bg-emerald-500/10 text-[#4ade80] flex items-center justify-center text-[10px] font-black flex-shrink-0 border border-emerald-500/20">✓</span>
                            <span className="font-sans leading-tight">{pcheck}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* FREQUENTLY ASKED QUESTIONS FAQ */}
            <div className="border-t border-[#11241d] pt-14 text-center mt-20 max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-400 mb-8 leading-relaxed font-sans max-w-xl mx-auto">
                Got questions about SEO check systems or RankSyncer's capabilities? Here are the facts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-5 rounded-2xl bg-[#0b1411] border border-[#13271e] text-xs space-y-1.5 shadow-md">
                  <h4 className="font-extrabold text-[#4ade80] flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-emerald-400" />
                    How deep does this SEO Audit scan?
                  </h4>
                  <p className="text-slate-350 leading-relaxed font-sans">
                    Our scanner acts as an active crawler tracing standard H1/H2 structured layout hierarchies, HTML index files, XML sitemap validation status, viewport tags, assets load times, keyword density levels, and competitive search engine drift benchmarks.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0b1411] border border-[#13271e] text-xs space-y-1.5 shadow-md">
                  <h4 className="font-extrabold text-[#4ade80] flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-emerald-400" />
                    Can I export this report snapshot?
                  </h4>
                  <p className="text-slate-350 leading-relaxed font-sans">
                    Yes! Click "Print / PDF Export" at the top of an audited report. Our template prints neatly on letter-sized papers or saves directly context-aware PDF certified summaries inside standard system print dialog configurations.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0b1411] border border-[#13271e] text-xs space-y-1.5 shadow-md">
                  <h4 className="font-extrabold text-[#4ade80] flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-emerald-400" />
                    How does RankSyncer auto-fix issues?
                  </h4>
                  <p className="text-slate-350 leading-relaxed font-sans">
                    By syncing directly with your Search Console API, WordPress native portals, Ghost nodes, Framer collections, or headless targets, our AI models rewrite poor articles, generate topical indexing folders, and inject safe organic matches automatically.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0b1411] border border-[#13271e] text-xs space-y-1.5 shadow-md">
                  <h4 className="font-extrabold text-[#4ade80] flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-emerald-400" />
                    Is my website information secure?
                  </h4>
                  <p className="text-slate-350 leading-relaxed font-sans">
                    RankSyncer processes public crawler audits strictly on standard read-only elements. No underlying server parameters are accessed, and we never expose proprietary logs without authorized OAuth connections.
                  </p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          
          // REGSITRED ADMINS/USERS LIVE LEAD ANALYTICS CONSOLE SEGMENT!
          <div className="space-y-6">
            
            {/* STATS TITLE */}
            <div className="bg-[#0b1411] border border-[#13271f] rounded-2xl p-6.5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <BarChart2 className="h-6 w-6 text-[#4ade80]" />
                  Lead Conversion & SEO Auditing Engine Analytics
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-0.5">
                  Track crawler workloads, lead captures, top audited scopes, and free trial conversion success ratios.
                </p>
              </div>

              <button 
                onClick={fetchAnalytics}
                className="p-2.5 bg-slate-950 hover:bg-[#11231c] border border-[#14261f] text-slate-200 rounded-xl transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                Reload Telemetry
              </button>
            </div>

            {/* TELEMETRY MATRIX GRID */}
            {analyticsLoading ? (
              <div className="py-20 text-center text-xs text-slate-400 uppercase tracking-widest font-bold">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-3" />
                Syncing audit telemetry databases...
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                
                {/* 3 COUNTER HIGHLIGHTS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-[#0b1411] border border-emerald-950 rounded-2xl p-6 shadow-md text-center">
                    <div className="text-xs uppercase font-extrabold text-slate-400 mb-1">Crawl Workloads Executed</div>
                    <div className="text-3xl font-mono font-black text-[#4ade80] my-2">{analytics.audits_generated}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total SEO evaluations logged</div>
                  </div>

                  <div className="bg-[#0b1411] border border-indigo-950 rounded-2xl p-6 shadow-md text-center">
                    <div className="text-xs uppercase font-extrabold text-slate-400 mb-1">Qualified Leads Captured</div>
                    <div className="text-3xl font-mono font-black text-indigo-400 my-2">{analytics.leads_captured}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Real-time email signups secured</div>
                  </div>

                  <div className="bg-[#0b1411] border border-slate-900 rounded-2xl p-6 shadow-md text-center">
                    <div className="text-xs uppercase font-extrabold text-slate-400 mb-1">Evaluation Conversion Target</div>
                    <div className="text-3xl font-mono font-black text-pink-500 my-2">{analytics.conversion_rate_percentage}%</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Lead generation funnel percentage</div>
                  </div>
                </div>

                {/* DOMAINS & RECENT RUNS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* TOP AUDITED DOMAINS */}
                  <div className="bg-[#0b1411] border border-[#14261f] rounded-2xl p-6 shadow-xl lg:col-span-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-[#11241b] pb-3 mb-4 flex items-center gap-1.5">
                      <Globe2 className="h-4 w-4 text-emerald-400" />
                      Top Audited Domains
                    </h3>

                    <div className="space-y-3.5">
                      {analytics.top_audited_domains && analytics.top_audited_domains.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-950/40 border border-[#14281e] rounded-xl text-xs flex justify-between items-center">
                          <span className="font-mono text-slate-350 truncate pr-2">{item.domain}</span>
                          <span className="h-5.5 px-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#4ade80] font-mono text-[10px] font-extrabold flex items-center justify-center">
                            {item.count} hits
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RECENT HISTORIES */}
                  <div className="bg-[#0b1411] border border-[#14261f] rounded-2xl p-6 shadow-xl lg:col-span-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-[#11241b] pb-3 mb-4 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      Recent Evaluation Workloads Chronology
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#152c22] text-slate-400 uppercase tracking-wider font-extrabold bg-slate-950/40 font-mono text-[10px]">
                            <th className="p-3">Target Domain</th>
                            <th className="p-3 text-center">Score Grade</th>
                            <th className="p-3">Converted Lead</th>
                            <th className="p-3 text-right">Audited Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#152c22]/40">
                          {recentAudits.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-3 font-mono text-[#4ade80] truncate max-w-xs">{item.website_url}</td>
                              <td className="p-3 text-center font-mono">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                  item.seo_score >= 80 ? 'bg-emerald-500/10 text-[#4ade80]' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {item.seo_score}%
                                </span>
                              </td>
                              <td className="p-3 select-all truncate text-slate-350">
                                {item.email ? (
                                  <span className="text-indigo-400 font-semibold">{item.email}</span>
                                ) : (
                                  <span className="text-slate-500 italic uppercase text-[9px] font-semibold flex items-center gap-1">
                                    <Lock className="h-2.5 w-2.5" /> Anonymous
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right text-slate-500 text-[10px]">
                                {new Date(item.generated_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-xs text-red-400">Database failed to load correctly.</div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER SECTION */}
      <footer className="border-t border-[#11251e] bg-[#030605] py-10 text-center text-xs text-slate-500 mt-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            &copy; 2026 <span className="font-extrabold text-slate-350">RankSyncer Inc.</span> All rights reserved. Outrank and automate search lists seamlessly.
          </div>
          <div className="flex space-x-4">
            <button onClick={onBackToLanding} className="hover:text-emerald-400 transition-colors">Privacy Policy</button>
            <button onClick={onBackToLanding} className="hover:text-emerald-400 transition-colors">Terms of Use</button>
            <button onClick={onPricingClick} className="hover:text-emerald-400 transition-colors">Direct Support</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
