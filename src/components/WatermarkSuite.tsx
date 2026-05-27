import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Sparkles, 
  Download, 
  Lock, 
  Unlock, 
  Database, 
  RefreshCw, 
  Flame, 
  Layers, 
  FileText, 
  CheckCircle, 
  FileCode, 
  AlertTriangle, 
  Settings, 
  BadgeCheck, 
  History, 
  Sliders, 
  ArrowRight,
  Monitor,
  Eye,
  Info,
  Check,
  Globe,
  DollarSign
} from 'lucide-react';
import { Article } from '../types';

interface WatermarkSuiteProps {
  activeArticle: Article | null;
  activePlan: 'free' | 'premium';
  onPlanChange: (plan: 'free' | 'premium') => void;
  userId?: string;
}

export default function WatermarkSuite({ 
  activeArticle, 
  activePlan: propActivePlan, 
  onPlanChange,
  userId = 'anonymous' 
}: WatermarkSuiteProps) {
  // Backend State
  const [subStatus, setSubStatus] = useState<'free' | 'premium'>(propActivePlan);
  const [dbSettings, setDbSettings] = useState({
    footerText: '',
    inlineText: '',
    floatingBadgeHtml: '',
    commentText: ''
  });
  
  const [watermarkLogs, setWatermarkLogs] = useState<any[]>([]);
  const [exportMeta, setExportMeta] = useState<any[]>([]);
  const [billingAccessLogs, setBillingAccessLogs] = useState<any[]>([]);
  const [renderingSessions, setRenderingSessions] = useState<any[]>([]);
  
  // Local Control states
  const [watermarkType, setWatermarkType] = useState<string>('all');
  const [exportType, setExportType] = useState<'html' | 'markdown' | 'pdf' | 'docx'>('html');
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [renderedHash, setRenderedHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<any | null>(null);
  
  // Customization input settings
  const [footerInput, setFooterInput] = useState('');
  const [inlineInput, setInlineInput] = useState('');
  const [floatingInput, setFloatingInput] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  
  // Notification banner inside component
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'info' | 'error', text: string } | null>(null);
  const [activeLogTab, setActiveLogTab] = useState<'watermark' | 'exports' | 'billing' | 'sessions'>('watermark');
  const [previewMode, setPreviewMode] = useState<'visual' | 'code' | 'raw'>('visual');

  // Upgrade Modal Toggle
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Auto clear toasts
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Fetch State from the server
  const fetchState = async (silently = false) => {
    if (!silently) setIsLoading(true);
    try {
      const res = await fetch(`/api/watermark/state?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        if (data.subscription) {
          setSubStatus(data.subscription.status);
          onPlanChange(data.subscription.status);
        }
        if (data.settings) {
          setDbSettings(data.settings);
          setFooterInput(data.settings.footerText);
          setInlineInput(data.settings.inlineText);
          setFloatingInput(data.settings.floatingBadgeHtml);
          setCommentInput(data.settings.commentText);
        }
        setWatermarkLogs(data.logs || []);
        setExportMeta(data.exportMetadata || []);
        setBillingAccessLogs(data.billingAccessLogs || []);
        setRenderingSessions(data.renderingSessions || []);
      }
    } catch (e) {
      console.error("Could not load backend watermark state", e);
      setToastMsg({ type: 'error', text: 'Failed to synchronize with server-side Watermark Service.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, [activeArticle, userId]);

  // Call render endpoint when article or settings change to show real preview
  useEffect(() => {
    if (activeArticle) {
      renderActivePreview();
    }
  }, [activeArticle, watermarkType, subStatus, dbSettings]);

  const renderActivePreview = async () => {
    if (!activeArticle) return;
    try {
      const res = await fetch('/api/watermark/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: activeArticle.id,
          userId,
          watermarkType,
          content: activeArticle.content,
          title: activeArticle.title,
          metaDescription: activeArticle.metaDescription
        })
      });
      const data = await res.json();
      if (data.renderedContent) {
        setRenderedContent(data.renderedContent);
        setRenderedHash(data.hash || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Switch Subscription Tier Safely
  const handleSubscriptionToggle = async (targetPlan: 'free' | 'premium') => {
    try {
      const res = await fetch('/api/watermark/subscription/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: targetPlan })
      });
      const data = await res.json();
      if (data.success) {
        setSubStatus(targetPlan);
        onPlanChange(targetPlan);
        setToastMsg({
          type: targetPlan === 'premium' ? 'success' : 'info',
          text: targetPlan === 'premium' ? 
            'Premium activated! Watermark layers bypassed instantly.' : 
            'Returned to Free tier. Watermarks and attribution re-asserted.'
        });
        fetchState(true);
      }
    } catch (err) {
      console.error(err);
      setToastMsg({ type: 'error', text: 'Billing communication failed.' });
    }
  };

  // Compile export document
  const triggerExport = async () => {
    if (!activeArticle) {
      setToastMsg({ type: 'error', text: 'Select an article to compile exports.' });
      return;
    }
    setIsExporting(true);
    setExportResult(null);

    try {
      const res = await fetch('/api/watermark/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: activeArticle.id,
          userId,
          exportType,
          content: activeArticle.content,
          title: activeArticle.title
        })
      });
      const data = await res.json();
      if (data.success) {
        setExportResult(data);
        setToastMsg({ type: 'success', text: `Compiled ${exportType.toUpperCase()} file securely.` });
        fetchState(true); // update logs
      } else {
        setToastMsg({ type: 'error', text: data.error || 'Export failed.' });
      }
    } catch (err) {
      console.error(err);
      setToastMsg({ type: 'error', text: 'Secure export compilation rejected by server.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Save Settings to server
  const saveCustomSettings = async () => {
    try {
      const res = await fetch('/api/watermark/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          footerText: footerInput,
          inlineText: inlineInput,
          floatingBadgeHtml: floatingInput,
          commentText: commentInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setDbSettings(data.settings);
        setToastMsg({ type: 'success', text: 'Watermark patterns training compiled!' });
        setShowSettingsDrawer(false);
      }
    } catch (e) {
      setToastMsg({ type: 'error', text: 'Could not apply settings.' });
    }
  };

  // Clear Logs
  const clearLogsOnServer = async () => {
    if (!confirm('Are you sure you want to flush all relational watermark activity & access logs?')) return;
    try {
      await fetch('/api/rewrites/logs/clear', { method: 'POST', body: JSON.stringify({ article_id: '' }), headers: { 'Content-Type': 'application/json' } });
      setToastMsg({ type: 'info', text: 'Cleared logging arrays.' });
      fetchState(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      
      {/* HEADER SECTION WITH SaaS STATUS BRAGGING */}
      <div className="p-6 bg-radial-at-t from-slate-900 via-slate-950 to-slate-950 border-b border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-violet-600/10 text-violet-400 rounded-lg border border-violet-800/40">
              <Shield className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">Security Watermark & Attribution Governance</h2>
          </div>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">
            Authorize dynamic attribution injection based on secure cryptographically signed backend plans. Free tier users receive mandatory SEO watermarks, premium users receive clean white-labeled exports.
          </p>
        </div>

        {/* Real-time Tier Controller */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => handleSubscriptionToggle('free')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              subStatus === 'free' ? 'bg-amber-500/20 text-amber-300 border border-amber-600/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="h-3 w-3" />
            FREE TIER
          </button>
          <button
            onClick={() => handleSubscriptionToggle('premium')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              subStatus === 'premium' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-600/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Unlock className="h-3 w-3" />
            PREMIUM PLAN
          </button>
        </div>
      </div>

      {/* TOAST PANEL */}
      {toastMsg && (
        <div className="px-6 pt-4">
          <div className={`p-3 rounded-2xl flex items-center gap-2 text-xs font-bold border transition-all animate-bounce ${
            toastMsg.type === 'success' ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400' :
            toastMsg.type === 'error' ? 'bg-rose-950/40 border-rose-800/40 text-rose-400' :
            'bg-blue-950/40 border-blue-800/50 text-blue-400'
          }`}>
            <Info className="h-4 w-4 shrink-0" />
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* THREE-COLUMN DENSE MASTER CONTROL BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* COL 1: SETTINGS / COMPARISONS / CONTROLLERS (lg:col-span-4) */}
        <div className="p-6 border-r border-slate-850 lg:col-span-4 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            
            {/* ARTICLE PREVIEW TARGET */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Active Render Target</label>
              {activeArticle ? (
                <div className="p-3.5 bg-slate-900/50 border border-slate-850 rounded-2xl flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-800/40 text-[10px] font-black shrink-0">
                    SEO
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{activeArticle.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">KW: {activeArticle.targetKeyword} • {activeArticle.wordCount} words</p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                  ⚠️ No active article loaded in writer.
                </div>
              )}
            </div>

            {/* UPSELL BILLING PROPAGANDA HERO */}
            {subStatus === 'free' ? (
              <div className="p-4 bg-radial-at-t from-violet-950/40 via-slate-900 to-slate-900 border border-violet-900/40 rounded-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-violet-500/10 blur-xl"></div>
                
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-800/30 text-[9px] font-bold font-mono">
                  <Flame className="h-2 w-2 text-violet-400" /> RECOMMENDED
                </span>
                <h3 className="text-sm font-black text-white mt-1.5 tracking-tight flex items-center gap-1">
                  Remove Attribution Custom Brand
                </h3>
                <p className="text-[10px] text-slate-400 leading-normal mt-1">
                  Free articles publish to CMS and document exports with watermarks. Level up to fully clear, white-labeled, signature-free SEO files with automated GSC autopilot.
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold py-2 px-3 rounded-xl transition-all shadow-md group flex items-center justify-center gap-1"
                  >
                    <span>Upgrade to White-Label</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button 
                    onClick={() => handleSubscriptionToggle('premium')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold py-2 px-2.5 rounded-xl transition-all border border-slate-750"
                  >
                    Fast Dev Demo
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl flex items-start gap-3">
                <span className="p-1.5 bg-emerald-600/10 text-emerald-400 rounded-lg border border-emerald-800/40 shrink-0 mt-0.5">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">White-Label Access Active</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    Your account holds verified RankSyncer Pro status. CMS integrations (WordPress, Webflow) and all file downloads will execute without any watermarks or brand links.
                  </p>
                  <button 
                    onClick={() => handleSubscriptionToggle('free')}
                    className="text-violet-400 hover:text-violet-300 text-[9px] font-bold font-mono underline mt-2 block"
                  >
                    Downgrade Account for Sandbox Testing
                  </button>
                </div>
              </div>
            )}

            {/* PREVIEW SELECTION */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                Watermark Layers Preview
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setWatermarkType('all')}
                  className={`p-2 rounded-xl text-[10px] font-bold border transition-all text-left ${
                    watermarkType === 'all' ? 'bg-slate-800 text-white border-violet-500' : 'bg-slate-900/40 text-slate-300 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-mono text-[9px] text-violet-400 mb-0.5">01. FULL SUITE</div>
                  Complete Branding
                </button>
                <button
                  onClick={() => setWatermarkType('footer')}
                  className={`p-2 rounded-xl text-[10px] font-bold border transition-all text-left ${
                    watermarkType === 'footer' ? 'bg-slate-800 text-white border-violet-500' : 'bg-slate-900/40 text-slate-300 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-mono text-[9px] text-violet-400 mb-0.5">02. APPEND</div>
                  Footer Link
                </button>
                <button
                  onClick={() => setWatermarkType('inline')}
                  className={`p-2 rounded-xl text-[10px] font-bold border transition-all text-left ${
                    watermarkType === 'inline' ? 'bg-slate-800 text-white border-violet-500' : 'bg-slate-900/40 text-slate-300 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-mono text-[9px] text-violet-400 mb-0.5">03. EMBED</div>
                  Inline Paragraph
                </button>
                <button
                  onClick={() => setWatermarkType('floating')}
                  className={`p-2 rounded-xl text-[10px] font-bold border transition-all text-left ${
                    watermarkType === 'floating' ? 'bg-slate-800 text-white border-violet-500' : 'bg-slate-900/40 text-slate-300 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-mono text-[9px] text-violet-400 mb-0.5">04. CORNER</div>
                  Floating Badge
                </button>
              </div>

              {subStatus === 'premium' && (
                <div className="pt-1 text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle className="h-3 w-3 shrink-0" />
                  Premium active: Selected watermarks will hide in outputs
                </div>
              )}
            </div>

            {/* SEED PARAMETERS DRAWER TOGGLE */}
            <div>
              <button
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                className="w-full py-2 px-3 border border-slate-850 hover:border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl text-xs font-bold text-slate-300 transition-all flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-violet-400" />
                  Watermark Patterns Setup
                </span>
                <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  {showSettingsDrawer ? "CLOSE" : "TRAIN"}
                </span>
              </button>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-900">
            <span className="text-[10px] text-slate-500 font-mono tracking-wide uppercase block">Authority Node Checked</span>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`h-2.5 w-2.5 rounded-full ${subStatus === 'premium' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-pulse'}`}></div>
              <span className="text-xs font-bold text-white uppercase font-mono">{subStatus} TIER COMPILER ACTIVE</span>
            </div>
          </div>
        </div>

        {/* COL 2: LIVE WATERMARK PREVIEW FRAME (lg:col-span-5) */}
        <div className="border-r border-slate-850 lg:col-span-5 flex flex-col min-w-0">
          
          {/* Header Controls for Editor Preview Grid */}
          <div className="p-4 bg-slate-900/40 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold text-white">Live Pipeline Preview Panel</span>
            </div>

            {/* Preview style selectors */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                onClick={() => setPreviewMode('visual')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono transition-all ${
                  previewMode === 'visual' ? 'bg-slate-850 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                VISUAL
              </button>
              <button
                onClick={() => setPreviewMode('code')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono transition-all ${
                  previewMode === 'code' ? 'bg-slate-850 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                HTML COMMENT
              </button>
              <button
                onClick={() => setPreviewMode('raw')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono transition-all ${
                  previewMode === 'raw' ? 'bg-slate-850 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                RAW PREVIEW
              </button>
            </div>
          </div>

          {/* Actual Document canvas */}
          <div className="p-5 flex-1 overflow-y-auto bg-slate-900/10 min-h-[350px] max-h-[500px]">
            {activeArticle ? (
              <div className="space-y-4">
                
                {/* Visual Banner upsell for free users */}
                {subStatus === 'free' && (
                  <div className="p-3 bg-gradient-to-r from-amber-600/15 to-violet-600/15 border border-amber-500/20 rounded-xl text-[11px] leading-normal text-amber-200 flex items-start gap-2.5">
                    <span className="p-1 bg-amber-500/20 text-amber-300 rounded shrink-0">⚠️</span>
                    <div>
                      <strong>Free Tier Preview Enabled:</strong> The text rendering shows active watermarks as it will sync to CMS publishing ports or export down to documents. Upgrade to remove attribution layers.
                    </div>
                  </div>
                )}

                {/* VISUAL LAYOUT RENDERING STYLE */}
                {previewMode === 'visual' && (
                  <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-inner text-xs space-y-3 relative prose max-w-none overflow-hidden select-none">
                    
                    {/* Header signed badge check */}
                    <div className="border-b border-slate-100 pb-2 mb-3 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                      <span>DOC ID: {activeArticle.id}</span>
                      <span className="flex items-center gap-1 text-slate-500 font-bold">
                        <Shield className="h-3 w-3 text-violet-500" />
                        SECURED VIA SERVER ENGINE
                      </span>
                    </div>

                    <h1 className="text-sm font-black text-slate-900 border-none m-0 leading-tight">
                      {activeArticle.title}
                    </h1>

                    <div className="text-[10px] text-slate-400 mt-1 mb-2">
                      Meta Description: <em>{activeArticle.metaDescription}</em>
                    </div>

                    {/* Pre-render content paragraph by paragraph with injection if FREE */}
                    <div className="text-slate-600 leading-relaxed space-y-3 pt-2">
                      <p>
                        Optimizing search index domains requires persistent target tracking and editorial sync. 
                        As RankSyncer processes organic visibility grids, we index semantic layouts dynamically.
                      </p>

                      {subStatus === 'free' && (watermarkType === 'inline' || watermarkType === 'all') && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 text-[10px] text-amber-800 rounded-xl font-medium tracking-tight text-center my-3 animate-pulse">
                          👉 {dbSettings.inlineText.replace(/\*/g, '')}
                        </div>
                      )}

                      <p>
                        Our direct live publishing gateways eliminate the friction of manually copying markup drafts. 
                        By synchronizing blog caches to WordPress, Webflow, and Shopify natively, publishers maintain domain velocity.
                      </p>

                      {subStatus === 'free' && (watermarkType === 'footer' || watermarkType === 'all') && (
                        <div className="border-t border-slate-250 pt-3 mt-4 text-center">
                          <p className="text-[10px] text-slate-400 italic">
                            {dbSettings.footerText}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Floating Corner Badge simulator */}
                    {subStatus === 'free' && (watermarkType === 'floating' || watermarkType === 'all') && (
                      <div className="border border-emerald-500/30 bg-slate-900 text-emerald-400 py-1.5 px-3 rounded-full flex items-center justify-center gap-1 mx-auto mt-4 w-fit select-none font-sans font-bold text-[9px]">
                        <span>🛡️ Powered by RankSyncer AI</span>
                      </div>
                    )}
                  </div>
                )}

                {/* SHOW CODE WATERMARKS */}
                {previewMode === 'code' && (
                  <div className="bg-slate-950 p-4 rounded-2xl font-mono text-[10px] text-indigo-300 border border-slate-850 overflow-x-auto space-y-2">
                    <div className="text-slate-500 font-bold">// Mandatory backend-appended HTML comment injection for all files:</div>
                    <div className="text-emerald-400 select-all p-2.5 bg-slate-900/50 rounded-xl border border-slate-800 select-all">
                      &lt;!-- {dbSettings.commentText} --&gt;
                    </div>
                    <div className="text-slate-500 font-bold pt-2">// Injected dynamically under the covers to prevent frontend scraping bypass of watermarks:</div>
                    <div className="text-slate-300 text-[9px]">
                      {`const checksum = "${renderedHash.substring(0, 32)}";`}
                    </div>
                  </div>
                )}

                {/* RAW PREVIEW */}
                {previewMode === 'raw' && (
                  <textarea
                    readOnly
                    className="w-full h-80 bg-slate-950 border border-slate-850 rounded-2xl p-4 font-mono text-[11px] text-slate-300 focus:outline-none select-all"
                    value={renderedContent || 'Loading compilation streams...'}
                  />
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>SHA-256 HASH: {renderedHash ? renderedHash.substring(0, 24) : 'COMPLETING'}...</span>
                  <span className="text-slate-400">Length: {renderedContent.length} chars</span>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-2">
                <FileText className="h-10 w-10 text-slate-700" />
                <p className="text-xs font-bold">No active engine preview stream.</p>
                <p className="text-[10px] text-slate-600">Select or write an article in the primary tab first.</p>
              </div>
            )}
          </div>
        </div>

        {/* COL 3: SECURE RELATIONAL COMPILER / EXPORTER / UTILS (lg:col-span-3) */}
        <div className="p-6 lg:col-span-3 flex flex-col justify-between space-y-6">
          
          {/* SECURE DISPATCH */}
          <div className="space-y-6">
            
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                Secure Export Pipeline
              </span>
              <p className="text-[10px] text-slate-500 leading-normal">
                Generates a unique signed validator token server-side upon download compilation.
              </p>
            </div>

            {/* EXPORT SELECTOR */}
            <div className="space-y-3">
              <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block font-mono">Export Format Format</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'html', label: 'HTML File' },
                  { id: 'markdown', label: 'Markdown' },
                  { id: 'pdf', label: 'PDF Print' },
                  { id: 'docx', label: 'MS Word' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setExportType(item.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                      exportType === item.id 
                        ? 'bg-violet-600 border-violet-500 text-white' 
                        : 'bg-slate-900 border-slate-850 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    .{item.id.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* TRIGGERS */}
            <div>
              <button
                disabled={isExporting || !activeArticle}
                onClick={triggerExport}
                className="w-full bg-slate-100 hover:bg-slate-50 text-slate-950 text-xs font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 text-violet-600" />
                )}
                <span>Compile Export Bundle</span>
              </button>
            </div>

            {/* EXPORT SUCCESS RESULT */}
            {exportResult && (
              <div className="p-3.5 bg-slate-900 border border-emerald-800/40 rounded-xl space-y-3 animate-fade-in text-[11px]">
                <div className="flex items-center gap-2 text-emerald-450 font-bold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>Validated successfully!</span>
                </div>
                
                <div className="font-mono text-[9px] text-slate-400 space-y-1">
                  <div>TOKEN: <span className="text-slate-200 block truncate">{exportResult.signed_token}</span></div>
                  <div>FILE: <span className="text-slate-200 block truncate">{exportResult.fileName}</span></div>
                </div>

                <a
                  href={exportResult.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2 px-3 rounded-lg text-center block transition-all"
                >
                  Download Compiled File
                </a>
              </div>
            )}

            {/* Billing locks indicator if Free */}
            {subStatus === 'free' && (
              <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[10px]">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span>BILLING LOCKS APPLIED</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Free downloads contain mandatory attribution. Stripe-activated White label is required for pure clean production logs.
                </p>
              </div>
            )}

          </div>

          {/* Quick Stats overview */}
          <div className="pt-4 border-t border-slate-900 space-y-2 text-[10px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Attribution Logs:</span>
              <span className="text-white font-bold">{watermarkLogs.length} traces</span>
            </div>
            <div className="flex justify-between">
              <span>Exports Generated:</span>
              <span className="text-white font-bold">{exportMeta.length} files</span>
            </div>
            <div className="flex justify-between">
              <span>Cache Invalidation:</span>
              <span className="text-emerald-400 font-bold">Authorized</span>
            </div>
          </div>

        </div>

      </div>

      {/* PARAMETERS SETTINGS COLLAPSIBLE PANEL */}
      {showSettingsDrawer && (
        <div className="p-6 bg-slate-900/90 border-t border-slate-850 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-white flex items-center gap-2">
              <Settings className="h-4 w-4 text-violet-400" />
              Watermark Pattern Training Parameters
            </h4>
            <span className="text-[10px] bg-violet-900/40 text-violet-300 font-bold font-mono px-2 py-0.5 rounded border border-violet-800/40">
              System Admin Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold font-mono block">FOOTER WATERMARK TEXT</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                value={footerInput}
                onChange={(e) => setFooterInput(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold font-mono block">INLINE WATERMARK CLAUSE</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                value={inlineInput}
                onChange={(e) => setInlineInput(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold font-mono block">HTML COMMENT INVISI-WATERMARK</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold font-mono block">CORNER FLOATING BADGE (HTML CODE)</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                value={floatingInput}
                onChange={(e) => setFloatingInput(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={() => {
                setShowSettingsDrawer(false);
                fetchState(true);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 text-xs font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveCustomSettings}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md"
            >
              Save Custom Parameters
            </button>
          </div>
        </div>
      )}

      {/* HISTORICAL RELATIONAL DECOY REGISTRY LOG DETAILS TAB */}
      <div className="border-t border-slate-850 bg-slate-950/50">
        
        {/* Toggle selectors */}
        <div className="flex border-b border-slate-850 overflow-x-auto">
          {[
            { id: 'watermark', label: 'Watermark Activity Audits', icon: History, count: watermarkLogs.length },
            { id: 'exports', label: 'Exported Files Registry', icon: FileCode, count: exportMeta.length },
            { id: 'billing', label: 'Billing Access Logs', icon: Database, count: billingAccessLogs.length },
            { id: 'sessions', label: 'Active Rendering Sessions', icon: Layers, count: renderingSessions.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveLogTab(tab.id as any)}
              className={`px-5 py-4 text-xs font-bold font-mono transition-all flex items-center gap-2 shrink-0 border-b-2 cursor-pointer ${
                activeLogTab === tab.id 
                  ? 'border-violet-500 bg-slate-900/30 text-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded-md font-bold">
                {tab.count}
              </span>
            </button>
          ))}

          <div className="ml-auto flex items-center pr-4">
            <button
              onClick={clearLogsOnServer}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-mono font-bold hover:underline cursor-pointer"
            >
              Flush Database Logs
            </button>
          </div>
        </div>

        {/* LOG CONTENT LISTING */}
        <div className="p-5 max-h-[250px] overflow-y-auto">
          
          {/* TAB 1: WATERMARK LOGS */}
          {activeLogTab === 'watermark' && (
            <div className="space-y-2.5">
              {watermarkLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs font-mono">
                  No watermark generations logged yet. Apply preview modes to trigger compiler.
                </div>
              ) : (
                watermarkLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] font-mono hover:border-slate-800 transition-colors">
                    <div className="flex items-start md:items-center gap-2.5 min-w-0">
                      <span className={`p-1 rounded shrink-0 ${
                        log.subscription_status === 'premium' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                      }`}>
                        {log.subscription_status === 'premium' ? 'PREMIUM' : 'FREE'}
                      </span>
                      <div className="min-w-0">
                        <div className="text-slate-200 font-medium truncate">{log.message}</div>
                        <div className="text-slate-500 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                          <span>Article: <strong className="text-slate-400">{log.article_id}</strong></span>
                          <span>Format: <strong className="text-slate-400">{log.export_type.toUpperCase()}</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-slate-400 text-[9px]">{new Date(log.export_timestamp).toLocaleTimeString()}</div>
                      <div className="text-[9px] text-violet-400/80 truncate mt-0.5 max-w-[120px] md:max-w-xs">{log.generated_output_hash.substring(0, 16)}...</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: EXPORT REGISTRY */}
          {activeLogTab === 'exports' && (
            <div className="space-y-2.5">
              {exportMeta.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs font-mono">
                  No export metadata files compiled yet.
                </div>
              ) : (
                exportMeta.map((exp) => (
                  <div key={exp.id} className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-[11px] font-mono hover:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-1 rounded bg-violet-950 text-violet-400 border border-violet-800/30 shrink-0 uppercase">
                        .{exp.export_type}
                      </span>
                      <div className="min-w-0">
                        <div className="text-slate-200 font-bold truncate">{exp.file_name}</div>
                        <div className="text-slate-500 mt-0.5 truncate">
                          Signed Token Verify: <span className="text-violet-400 font-black">{exp.signed_token.substring(0, 24)}...</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-slate-350">{Math.round((exp.file_size || 0) / 10.24) / 100} KB</div>
                      <a
                        href={exp.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-violet-400 hover:text-violet-300 underline font-extrabold mt-0.5 block"
                      >
                        RE-DOWNLOAD
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: BILLING TELEMETRY */}
          {activeLogTab === 'billing' && (
            <div className="space-y-2.5">
              {billingAccessLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs font-mono">
                  No billing actions recorded. Toggle pricing modes to write entries.
                </div>
              ) : (
                billingAccessLogs.map((bl) => (
                  <div key={bl.id} className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl flex items-start gap-2.5 text-[11px] font-mono hover:border-slate-800">
                    <span className={`p-1 rounded uppercase shrink-0 text-[9px] ${
                      bl.status === 'success' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' :
                      bl.status === 'warn' ? 'bg-amber-950/80 text-amber-400 border border-amber-850' :
                      bl.status === 'info' ? 'bg-blue-950/80 text-blue-400 border border-blue-800' :
                      'bg-rose-950/80 text-rose-450 border border-rose-800'
                    }`}>
                      {bl.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 leading-normal">{bl.message}</div>
                      <div className="text-slate-500 text-[9px] mt-1">{new Date(bl.timestamp).toLocaleString()} • User: {bl.user_id}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: RENDERING SESSIONS */}
          {activeLogTab === 'sessions' && (
            <div className="space-y-2.5">
              {renderingSessions.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs font-mono">
                  No active rendering sessions found.
                </div>
              ) : (
                renderingSessions.map((rs) => (
                  <div key={rs.id} className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl flex items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="min-w-0">
                      <div className="text-slate-200 font-bold flex items-center gap-1.5 truncate">
                        <span>Session Tracker: <strong className="text-slate-100">{rs.id}</strong></span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                          {rs.active_plan_snapshot.toUpperCase()} TIER
                        </span>
                      </div>
                      <div className="text-slate-500 mt-1 font-mono">
                        Article: <span className="text-slate-350">{rs.article_id}</span> • Type Enforced: <span className="text-violet-400">{rs.watermark_type}</span>
                      </div>
                    </div>
                    <div className="text-right text-slate-500 text-[9px] shrink-0">
                      {new Date(rs.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* DIALOG MODAL: UPGRADE OPTIONS SHEET */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-slate-100 space-y-6 relative font-sans">
            
            <div className="text-center space-y-1">
              <span className="h-12 w-12 bg-violet-600/10 text-violet-400 rounded-2xl flex items-center justify-center border border-violet-800 mx-auto text-xl font-bold">
                🚀
              </span>
              <h3 className="text-base font-black text-white mt-3">RankSyncer White-Label Upgrade Suite</h3>
              <p className="text-[11px] text-slate-450">Unlock clean blog production & seamless automatic search indexing sync</p>
            </div>

            {/* FREE VS PREMIUM GRID */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden text-[11px]">
              
              {/* Table header */}
              <div className="grid grid-cols-3 bg-slate-950 border-b border-slate-800 p-3 text-slate-400 font-bold font-mono text-[10px]">
                <span>CAPABILITY</span>
                <span className="text-center text-amber-450">FREE SUBS</span>
                <span className="text-center text-emerald-450">PREMIUM VIP</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-800/60 bg-slate-900/60">
                <div className="grid grid-cols-3 p-3">
                  <span className="font-bold text-slate-200">SEO Footers</span>
                  <span className="text-center text-slate-500">Watermarked</span>
                  <span className="text-center text-emerald-400 font-bold">White-Label</span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-bold text-slate-200">Export Formats</span>
                  <span className="text-center text-slate-500">Forced Brand</span>
                  <span className="text-center text-emerald-400 font-bold">100% Clean Files</span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-bold text-slate-200">CMS publishing</span>
                  <span className="text-center text-slate-500 font-medium">Attribution injected</span>
                  <span className="text-center text-emerald-450 font-bold">Clean Deploy</span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-bold text-slate-200">GSC Autopilot</span>
                  <span className="text-center text-slate-500">7 Days Outline</span>
                  <span className="text-center text-emerald-400 font-bold">30 Days Pro Rank</span>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <span className="font-bold text-slate-200">Relational Sync</span>
                  <span className="text-center text-slate-500">Offline Mock</span>
                  <span className="text-center text-emerald-400 font-bold">API Authoursed</span>
                </div>
              </div>
            </div>

            {/* Billing locks simulator trigger */}
            <div className="p-3 bg-violet-950/20 border border-violet-800/40 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">RankSyncer Pro License</span>
                <span className="text-[10px] text-slate-400 font-mono">$49/month recurring sandbox</span>
              </div>
              <button
                onClick={() => {
                  handleSubscriptionToggle('premium');
                  setShowUpgradeModal(false);
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[11px] py-2 px-4 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Activate Pro Sandbox
              </button>
            </div>

            {/* Cancel btn */}
            <div className="flex justify-end pt-2 border-t border-slate-800/50">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
              >
                No thank you, continue on free version
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
