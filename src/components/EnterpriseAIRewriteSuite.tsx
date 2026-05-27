import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  History, 
  Sliders, 
  Eye, 
  BookOpen, 
  Zap, 
  Check, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  SlidersHorizontal, 
  ArrowRight, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Languages, 
  Activity, 
  FileCheck,
  Search,
  CheckCircle,
  Clock,
  ChevronRight,
  Database,
  Layers,
  ArrowRightLeft,
  Trash2
} from 'lucide-react';
import { Article, RewriteVersion, RewriteLog, RewriteJob } from '../types';

interface EnterpriseAIRewriteSuiteProps {
  activeArticle: Article;
  onApplyChanges: (newFields: { title: string; content: string; metaDescription: string }) => void;
  brandVoiceProfiles?: Array<{ id: string; name: string; audienceTone: string; vocabularyComplexity: string; customPatterns?: string }>;
}

export default function EnterpriseAIRewriteSuite({ 
  activeArticle, 
  onApplyChanges,
  brandVoiceProfiles = []
}: EnterpriseAIRewriteSuiteProps) {
  // Config state triggers
  const [voiceProfiles, setVoiceProfiles] = useState<any[]>(brandVoiceProfiles);
  const [rewriteType, setRewriteType] = useState<string>('seo_rewrite');
  const [intensity, setIntensity] = useState<number>(65);
  const [aiSlider, setAiSlider] = useState<number>(75);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [targetKeywords, setTargetKeywords] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  const [selectedVoiceProfileId, setSelectedVoiceProfileId] = useState<string>('');

  useEffect(() => {
    fetch('/api/brand-voice/profiles')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profiles) {
          setVoiceProfiles(data.profiles);
          if (data.profiles.length > 0) {
            setSelectedVoiceProfileId(data.profiles[0].id);
          }
        }
      })
      .catch(err => console.error("Could not fetch brand voice profiles:", err));
  }, []);

  // Content targeting (full article vs. selected block only)
  const [selectedTextOnly, setSelectedTextOnly] = useState<boolean>(false);
  const [targetSelection, setTargetSelection] = useState<string>('');

  // Active loaded states
  const [loading, setLoading] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<RewriteJob | null>(null);
  const [historyVersions, setHistoryVersions] = useState<RewriteVersion[]>([]);
  const [logs, setLogs] = useState<RewriteLog[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'analytics'>('editor');

  // Side-by-side comparisons
  const [versionAId, setVersionAId] = useState<string>('');
  const [versionBId, setVersionBId] = useState<string>('');
  const [diffTokens, setDiffTokens] = useState<Array<{ type: 'added' | 'removed' | 'equal'; value: string }>>([]);
  const [calculatingDiff, setCalculatingDiff] = useState<boolean>(false);
  
  // Quick previews
  const [previewPaneMode, setPreviewPaneMode] = useState<'original' | 'rewritten' | 'diff'>('diff');

  // Trigger load stats
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/rewrites/history/${activeArticle.id}`);
      const data = await res.json();
      if (data.success) {
        setHistoryVersions(data.versions || []);
        setLogs(data.logs || []);
        
        // Auto-select latest version for comparison if available
        if (data.versions && data.versions.length > 0) {
          setVersionBId(data.versions[0].id);
          if (data.versions.length > 1) {
            setVersionAId(data.versions[1].id);
          } else {
            // fallback to itself or seed
            setVersionAId(data.versions[0].id);
          }
        }
      }
    } catch (e) {
      console.error("Could not fetch rewrite records:", e);
    }
  }, [activeArticle.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Poll for background worker updates
  const pollJobStatus = useCallback((jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rewrites/job-status/${jobId}`);
        const data = await res.json();
        if (data.success && data.job) {
          const job = data.job;
          setActiveJob(job);
          
          if (job.status === 'completed') {
            clearInterval(interval);
            setLoading(false);
            fetchHistory();
            // Trigger automatic preview view mapping
            if (job.rewritten_result) {
              setPreviewPaneMode('rewritten');
            }
          } else if (job.status === 'failed') {
            clearInterval(interval);
            setLoading(false);
            fetchHistory();
          }
        }
      } catch (err) {
        console.error("Error polling rewrite job:", err);
        clearInterval(interval);
        setLoading(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [fetchHistory]);

  // Trigger standard write trigger endpoint
  const handleTriggerRewrite = async () => {
    setLoading(true);
    setActiveJob(null);

    // Baseline autosave check
    // Ensure we have a baseline snapshot saved first in versioning list if empty
    if (historyVersions.length === 0) {
      try {
        await fetch('/api/rewrites/version-snap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article_id: activeArticle.id,
            title: activeArticle.title,
            content: activeArticle.content,
            meta_description: activeArticle.metaDescription,
            rewrite_type: 'original',
            change_description: 'Original Import Snapshot'
          })
        });
      } catch (err) {
        console.error("Could not save initial recovery snap:", err);
      }
    }

    // Capture inputs
    const chosenProfile = voiceProfiles.find(v => v.id === selectedVoiceProfileId);
    const splitKeywords = targetKeywords ? targetKeywords.split(',').map(k => k.trim()) : [];
    const contentToRewrite = selectedTextOnly ? targetSelection : activeArticle.content;

    try {
      const res = await fetch('/api/rewrites/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: activeArticle.id,
          rewrite_type: rewriteType,
          original_content: contentToRewrite,
          original_title: activeArticle.title,
          original_meta_description: activeArticle.metaDescription,
          intensity,
          ai_slider: aiSlider,
          custom_prompt: customPrompt,
          brand_voice_profile: chosenProfile,
          target_keywords: splitKeywords,
          language
        })
      });
      
      const data = await res.json();
      if (data.success && data.jobId) {
        pollJobStatus(data.jobId);
      } else {
        setLoading(false);
        alert(data.error || "Could not launch rewrite daemon.");
      }
    } catch (e: any) {
      console.error(e);
      setLoading(false);
      alert("Pipeline communication failure.");
    }
  };

  // Perform premium side-by-side diff recalculation
  const handleCalculateDiff = useCallback(async (vAId: string, vBId: string) => {
    if (!vAId || !vBId) return;
    setCalculatingDiff(true);
    
    const verA = historyVersions.find(v => v.id === vAId);
    const verB = historyVersions.find(v => v.id === vBId);
    
    if (!verA || !verB) {
      setCalculatingDiff(false);
      return;
    }

    try {
      const res = await fetch('/api/rewrites/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_a_content: verA.content,
          version_b_content: verB.content
        })
      });
      const data = await res.json();
      if (data.success) {
        setDiffTokens(data.diffs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCalculatingDiff(false);
    }
  }, [historyVersions]);

  useEffect(() => {
    if (versionAId && versionBId && activeTab === 'history') {
      handleCalculateDiff(versionAId, versionBId);
    }
  }, [versionAId, versionBId, activeTab, handleCalculateDiff]);

  // Apply target content to core editor
  const handleApplyCommit = (title?: string, content?: string, metaDesc?: string, message?: string) => {
    if (!content) return;
    onApplyChanges({
      title: title || activeArticle.title,
      content: content,
      metaDescription: metaDesc || activeArticle.metaDescription
    });

    // Write manual success snap
    fetch('/api/rewrites/version-snap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article_id: activeArticle.id,
        title: title || activeArticle.title,
        content: content,
        meta_description: metaDesc || activeArticle.metaDescription,
        rewrite_type: 'manual_restore',
        change_description: message || `Restore snapshot requested by operator`
      })
    }).then(() => fetchHistory());
  };

  // Clear log logs
  const handleClearHistoryLogs = async () => {
    if (!confirm("Are you sure you want to clean the rewrite logging history mapping this workspace?")) return;
    try {
      await fetch('/api/rewrites/logs/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: activeArticle.id })
      });
      fetchHistory();
    } catch (e) {
      console.error(e);
    }
  };

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + Enter triggers rewrite trigger when in editor tab and loaded
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!loading && activeTab === 'editor') {
          handleTriggerRewrite();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, activeTab, rewriteType, intensity, aiSlider, customPrompt, targetKeywords, language]);

  // Quick helper to categorize types
  const categories = [
    {
      group: "SEO AI Engine Mode",
      types: [
        { id: "seo_rewrite", name: "Premium Full-Optimised SEO", desc: "Injects NLP keywords, increases topical authority, and cleans layouts naturally" },
        { id: "semantic_enhance", name: "Semantic Term Maximiser", desc: "Adds rich multi-word vector synonyms to rank for deep search queries" },
        { id: "topical_enhance", name: "Contextual Depth Booster", desc: "Spins related paragraphs showing thorough knowledge of technical issues" },
        { id: "featured_snippet", name: "Rank #1 Snippet Orchestrator", desc: "Adapts definition paragraphs to fit search result Q&A features safely" }
      ]
    },
    {
      group: "Human-Scale Styles Adaptation",
      types: [
        { id: "humanized", name: "100% Humanised / Safe Bypass", desc: "Disrupts standard AI fingerprints, varies cadence, introduces natural textures" },
        { id: "persuasive", name: "High-CTR Conversion Story", desc: "Focuses on benefits, solves user paint points, uses bold active speech" },
        { id: "conversational", name: "Casual Dialogue / Reddit Style", desc: "Writes as an expert sharing secrets directly in first person format" },
        { id: "storytelling", name: "SaaS Narrative Hook", desc: "Introduces interesting metaphors and anecdotes to increase page time" },
        { id: "technical", name: "Expert Developer / Engineer", desc: "Rigorous technical terms, explicit mock definitions, pristine syntax flow" }
      ]
    },
    {
      group: "Adaptive Sizing & Parity",
      types: [
        { id: "expand", name: "Intelligent Long-Form Expansion", desc: "Enriches shallow content blocks with real analytical statistics and guidelines" },
        { id: "shorten", name: "Concise Executive Summary", desc: "Distills content down to essential points to fit newsletter digests" },
        { id: "simplify_content", name: "Flesch grade 7 Simplifier", desc: "Breaks complex items into clean lists and easily understandable analogies" },
        { id: "anti_duplicate", name: "Uniqueness Guard (Anti-Duplicate)", desc: "Paraphrases structures completely to bypass plagiarism matching algorithms" },
        { id: "freshness_update", name: "2026 Freshness Injection", desc: "Weaves fresh seasonal search facts and references to improve index authority" }
      ]
    }
  ];

  return (
    <div className="bg-slate-905 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-slate-100 min-h-[700px] w-full">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-950/60 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full font-mono">
              Enterprise Suite
            </span>
            <span className="text-slate-500 text-xs font-mono">Cluster Active: US_RUNNER_1</span>
          </div>
          <h2 className="text-xl font-bold font-sans text-white mt-1.5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" /> RankSyncer Core AI Rewrite Engine
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Improve article quality, adjust writing voice profiles, bypass watermarks, and keep headings intact at scale.
          </p>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === 'editor' 
                ? 'bg-slate-800 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" /> Core Controls
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-slate-800 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-400" /> Version Diff Timeline ({historyVersions.length})
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-slate-800 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Quality Audits & Logs
          </button>
        </div>
      </div>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[500px]">
        {/* TAB 1: ACTIVE EDITOR & CONTROLS */}
        {activeTab === 'editor' && (
          <>
            {/* Control Sidebar Block */}
            <div className="w-full md:w-[380px] bg-slate-950/20 p-6 border-r border-slate-800 flex flex-col gap-5 overflow-y-auto">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono mb-2">
                  1. Content Scope targeting
                </label>
                <div className="grid grid-cols-2 bg-slate-900/60 p-1 border border-slate-800 rounded-xl mb-3">
                  <button
                    onClick={() => setSelectedTextOnly(false)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      !selectedTextOnly 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Entire Article
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTextOnly(true);
                      // Fallback: Populate with first 200 character excerpt if selection empty
                      if (!targetSelection) {
                        setTargetSelection(activeArticle.content.substring(0, 350) + "...");
                      }
                    }}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedTextOnly 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Selective Section
                  </button>
                </div>

                {selectedTextOnly && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="block text-[10px] text-slate-400 font-semibold font-mono">
                      Paragraph / Sentence focus content block:
                    </label>
                    <textarea
                      value={targetSelection}
                      onChange={(e) => setTargetSelection(e.target.value)}
                      placeholder="Paste specific paragraph, CTA block, list, or headlines to rewrite here..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                      rows={5}
                    />
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>{targetSelection.split(/\s+/).filter(Boolean).length} Target Words</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Lock className="w-3 h-3" /> Outer layout locked
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono mb-2">
                  2. Choose Rewrite Strategy Model
                </label>
                <select
                  value={rewriteType}
                  onChange={(e) => setRewriteType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((cat, ci) => (
                    <optgroup key={ci} label={cat.group} className="bg-slate-900 text-slate-300 font-bold">
                      {cat.types.map((type, t_idx) => (
                        <option key={t_idx} value={type.id} className="text-white bg-slate-955">
                          {type.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="bg-slate-900/30 border border-slate-800/60 p-3 rounded-xl mt-2">
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    {categories.flatMap(c => c.types).find(t => t.id === rewriteType)?.desc}
                  </p>
                </div>
              </div>

              {/* Brand Voice Injection Panel */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
                    3. Match Brand voice profile
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono">Enterprise ONLY</span>
                </div>
                {voiceProfiles.length === 0 ? (
                  <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-xl text-[10px] text-slate-500 leading-normal">
                    No active brand voice profiles compiled. Go to <strong className="text-slate-400">Brand Identity Centre</strong> to train AI writing models.
                  </div>
                ) : (
                  <select
                    value={selectedVoiceProfileId}
                    onChange={(e) => setSelectedVoiceProfileId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No custom voice constraints (Natural) --</option>
                    {voiceProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.audienceTone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Target keywords */}
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono mb-1.5">
                  4. Keyword insertion & targeting
                </label>
                <input
                  type="text"
                  placeholder="e.g. saas, micro-saas ideas, build solo (comma separated)"
                  value={targetKeywords}
                  onChange={(e) => setTargetKeywords(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[9px] text-slate-500 mt-1 block">
                  Ensures natural density targets are kept or inserted seamlessly.
                </span>
              </div>

              {/* Sliders Block */}
              <div className="space-y-4 pt-2 border-t border-slate-850">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                    <span>Rewrite Intensity Strength</span>
                    <span className="text-emerald-400 font-bold">{intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>Light Touch</span>
                    <span>Complete Refactor</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                    <span>AI Bypass Humanization level</span>
                    <span className="text-emerald-400 font-bold">{aiSlider}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={aiSlider}
                    onChange={(e) => setAiSlider(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
                    <span>Standard NLP</span>
                    <span>Max Cadence Diversity</span>
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-500 font-mono mb-1">Target Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-xl p-1.5 text-[11px] text-slate-300 focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="German">German</option>
                    <option value="Japanese">Japanese</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-500 font-mono mb-1">Keyboard Hint</label>
                  <div className="bg-slate-900/40 text-center text-[10px] p-1.5 rounded-xl text-slate-400 font-bold border border-slate-800 font-mono">
                    Ctrl + Enter
                  </div>
                </div>
              </div>

              {/* Custom Directives Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
                  5. Optional Custom command directives
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Injected real statistical references to solo creator trends from 2026. Keep conclusion strict."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  rows={2}
                />
              </div>

              {/* ACTION EXECUTE BUTTON */}
              <button
                onClick={handleTriggerRewrite}
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white text-xs font-bold font-mono py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-emerald-500/10 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Processing in Background...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                    <span>Spin High-performance Rewrite</span>
                  </>
                )}
              </button>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="flex-1 p-6 flex flex-col min-w-0 bg-slate-950/40">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold font-mono text-slate-200">
                    Active Rewrite Sandbox Preview
                  </h3>
                  {loading && (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                {/* Switch pre views */}
                {activeJob?.status === 'completed' && activeJob.rewritten_result && (
                  <div className="flex bg-slate-900 border border-slate-805 p-1 rounded-lg">
                    <button
                      onClick={() => setPreviewPaneMode('original')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md font-mono ${
                        previewPaneMode === 'original' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setPreviewPaneMode('rewritten')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md font-mono ${
                        previewPaneMode === 'rewritten' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      AI Optimized Draft
                    </button>
                  </div>
                )}
              </div>

              {/* MAIN PREVIEW CONTENT BLOCK */}
              <div className="flex-1 flex flex-col bg-slate-900/40 rounded-2xl border border-slate-800/80 p-5 overflow-y-auto max-h-[580px] text-slate-300 font-sans leading-relaxed text-sm">
                
                {/* 1. Loading active queue task */}
                {loading && activeJob && (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center py-10">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      {/* double circular loader */}
                      <div className="absolute inset-0 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-2 border-4 border-slate-800 border-b-indigo-500 rounded-full animate-spin [animation-duration:1.2s]"></div>
                      <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
                    </div>

                    <div className="space-y-2 max-w-sm">
                      <h4 className="text-white font-bold text-sm tracking-wide font-mono">
                        Asynchronous Worker Cluster Enqueued
                      </h4>
                      <p className="text-slate-400 text-xs leading-normal">
                        Your request is being processed on premium queue. Currently translating structures, assessing keyword weights and generating model options...
                      </p>
                    </div>

                    {/* Progress details */}
                    <div className="w-full max-w-xs space-y-1.5 font-mono">
                      <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                        <span>Job Thread Node: {activeJob.id.substring(4, 12)}</span>
                        <span>{activeJob.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-full transition-all duration-300"
                          style={{ width: `${activeJob.progress}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-emerald-400 animate-pulse font-semibold">
                        {activeJob.progress < 30 && "⚡ Spawning container instance..."}
                        {activeJob.progress >= 30 && activeJob.progress < 60 && "⚙️ Feeding custom Brand Voice patterns to Gemini system instruct..."}
                        {activeJob.progress >= 60 && activeJob.progress < 85 && "🔮 Streaming model generation from gemini-3.5-flash..."}
                        {activeJob.progress >= 85 && "📈 Calculating similarity metrics & Flesch readability indices..."}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Loading idle state */}
                {!loading && !activeJob && (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                    <Database className="w-12 h-12 text-slate-700 mb-3" />
                    <p className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                      Sandbox Idle Space
                    </p>
                    <p className="max-w-xs text-xs text-slate-500 mt-1 leading-normal">
                      Adjust your target parameters in the sidebar control grid and click <strong className="text-slate-400">Spin Rewrite</strong> to execute container job tasks.
                    </p>
                  </div>
                )}

                {/* 3. Render Output after completion */}
                {!loading && activeJob?.status === 'completed' && activeJob.rewritten_result && (
                  <div className="space-y-6">
                    
                    {/* STATS HUD BANNER */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 shrink-0 select-none">
                      <div className="space-y-1 border-r border-slate-800 pr-1">
                        <span className="text-[9px] uppercase font-bold text-slate-505 block tracking-widest font-mono">
                          Readability Level
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-white font-mono">
                            {activeJob.rewritten_result.scores?.readability}%
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">+12%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-none">Flesch Grade score</div>
                      </div>

                      <div className="space-y-1 border-none lg:border-r border-slate-800 pr-1">
                        <span className="text-[9px] uppercase font-bold text-slate-505 block tracking-widest font-mono">
                          SEO Authority Index
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-white font-mono">
                            {activeJob.rewritten_result.scores?.seo}%
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">+8%</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-none">NLP Target density</div>
                      </div>

                      <div className="space-y-1 border-r border-slate-800 pr-1">
                        <span className="text-[9px] uppercase font-bold text-slate-505 block tracking-widest font-mono">
                          Similarity Parity
                        </span>
                        <span className="text-lg font-bold text-slate-300 block font-mono">
                          {activeJob.rewritten_result.scores?.similarity}%
                        </span>
                        <div className="text-[10px] text-slate-400 leading-none">Topics alignment</div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-501 block tracking-widest font-mono">
                          AI Watermark Bypass
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-emerald-400 font-mono">
                            {activeJob.rewritten_result.scores?.ai_detection}%
                          </span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1 rounded-sm border border-emerald-500/20 font-mono">Safe</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-none">Patterns bypassed</div>
                      </div>
                    </div>

                    {/* RENDER FIELD WORK */}
                    {previewPaneMode === 'original' ? (
                      <div className="space-y-4">
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">Original Document Title</span>
                          <h4 className="text-slate-100 font-bold text-base mt-1">{activeArticle.title}</h4>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl whitespace-pre-wrap font-mono text-xs text-slate-400 leading-relaxed">
                          {activeArticle.content}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 block font-mono">AI Optimized Title Heading</span>
                          <h4 className="text-slate-100 font-black text-base mt-1">
                            {activeJob.rewritten_result.title}
                          </h4>
                        </div>
                        <div className="bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 block font-mono font-mono mb-1">CTR Meta Description Snippet</span>
                          <p className="text-slate-300 text-xs leading-normal">
                            {activeJob.rewritten_result.meta_description}
                          </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl whitespace-pre-wrap font-sans text-slate-200 leading-relaxed text-sm select-text border-t-2 border-t-emerald-500">
                          {activeJob.rewritten_result.content}
                        </div>
                      </div>
                    )}

                    {/* CORE BUTTON BAR */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800 shrink-0">
                      <button
                        onClick={() => handleApplyCommit(
                          activeJob.rewritten_result?.title,
                          activeJob.rewritten_result?.content,
                          activeJob.rewritten_result?.meta_description,
                          `Optimized via '${activeJob.rewrite_type}' (Intensity: ${activeJob.intensity}%)`
                        )}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all text-xs font-mono py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4 text-slate-950" /> Commit & Live-Apply to Main Draft
                      </button>
                      <button
                        onClick={() => {
                          setActiveJob(null);
                          setPreviewPaneMode('diff');
                        }}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs font-mono py-3 px-5 rounded-xl transition-all cursor-pointer"
                      >
                        Reset Workspace
                      </button>
                    </div>

                    {/* METADATA SYSTEM */}
                    <div className="flex flex-wrap justify-between text-[11px] text-slate-500 font-mono pt-2">
                      <span>Telemetry processing: {activeJob.rewritten_result.processing_time}ms</span>
                      <span>Estimated cloud token load: {activeJob.rewritten_result.token_usage} units</span>
                    </div>

                  </div>
                )}

              </div>
            </div>
          </>
        )}

        {/* TAB 2: COMPARE VERSIONS DIFF TIMELINE */}
        {activeTab === 'history' && (
          <div className="flex-1 p-6 flex flex-col gap-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0 bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono mb-2">
                  Select historic Version A (Target Base reference)
                </label>
                <select
                  value={versionAId}
                  onChange={(e) => setVersionAId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="">-- Choose Base version --</option>
                  {historyVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      State v{v.version_number} - {v.change_description} ({new Date(v.created_at).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 font-mono mb-2">
                  Compare with Version B (Rewritten Optimized Variant)
                </label>
                <select
                  value={versionBId}
                  onChange={(e) => setVersionBId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
                >
                  <option value="">-- Choose modified version --</option>
                  {historyVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      State v{v.version_number} - {v.change_description} ({new Date(v.created_at).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PREVIEW CONTAINER FOR HISTORIC COMPARE */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono font-bold flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> High-Performance Visual Diff Output (Word Analyzer)
                </span>
                
                {historyVersions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500">Quick restore active:</span>
                    <button
                      onClick={() => {
                        const targetV = historyVersions.find(v => v.id === versionBId);
                        if (targetV) {
                          handleApplyCommit(
                            targetV.title,
                            targetV.content,
                            targetV.meta_description,
                            `Rolled back to Snapshot State #v${targetV.version_number}`
                          );
                          alert(`Success: Swapped draft content back to Snapshot v${targetV.version_number}!`);
                        }
                      }}
                      disabled={!versionBId}
                      className="bg-indigo-600 hover:bg-indigo-500 font-bold px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] rounded hover:text-white transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3 text-indigo-400" /> Restore v{historyVersions.find(v => v.id === versionBId)?.version_number || "target"}
                    </button>
                  </div>
                )}
              </div>

              {/* LITERAL WORD COMPILER BLOCK */}
              <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 overflow-y-auto max-h-[460px] font-sans leading-relaxed text-sm select-text text-slate-300">
                {calculatingDiff ? (
                  <div className="flex items-center justify-center p-20 text-slate-500 font-mono">
                    <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin mr-2" />
                    Calculating word-level difference mapping...
                  </div>
                ) : diffTokens.length === 0 ? (
                  <div className="text-center p-20 text-slate-550 font-mono text-xs">
                    Please select both historical states from the drop-down selectors to calculate structural word diff maps.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-400 border-b border-slate-850 pb-2 mb-2 flex flex-wrap gap-4 select-none">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> 
                        <span className="text-emerald-400 font-bold font-mono">Green text</span> = Words added in optimized variant
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-rose-500" /> 
                        <span className="text-rose-400 font-bold font-mono line-through">Red text</span> = Words removed from base draft
                      </span>
                    </div>

                    <div className="whitespace-pre-wrap leading-loose font-sans font-normal text-slate-200">
                      {diffTokens.map((t, idx) => {
                        if (t.type === 'added') {
                          return (
                            <span 
                              key={idx} 
                              className="bg-emerald-900/40 text-emerald-300 px-1 py-0.5 rounded-sm border-b border-b-emerald-500/50 font-semibold"
                            >
                              {t.value}
                            </span>
                          );
                        } else if (t.type === 'removed') {
                          return (
                            <span 
                              key={idx} 
                              className="bg-rose-955/40 text-rose-400 line-through px-0.5"
                            >
                              {t.value}
                            </span>
                          );
                        } else {
                          return <span key={idx}>{t.value}</span>;
                        }
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SNAPSHOTS TIMELINE ROW CARDS */}
            <div className="shrink-0 space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider">
                Historical Version Snapshots ({historyVersions.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 overflow-x-auto pb-2">
                {historyVersions.map((v, idx) => (
                  <div 
                    key={v.id} 
                    className="bg-slate-900 p-4 border border-slate-800 rounded-xl relative hover:border-slate-700 transition"
                  >
                    <div className="flex justify-between items-start">
                      <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                        v{v.version_number}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-200 text-xs mt-2 font-mono truncate">
                      {v.change_description}
                    </h5>

                    <div className="grid grid-cols-3 gap-1 mt-3 pt-2 text-[10px] text-slate-400 border-t border-slate-850 font-mono">
                      <div>
                        <span className="block text-slate-500 text-[9px] uppercase">SEO Score</span>
                        <span className="font-bold text-emerald-400">{v.seo_score || 85}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[9px] uppercase">Readability</span>
                        <span className="font-bold text-white">{v.readability_score || 80}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 text-[9px] uppercase">Bypass</span>
                        <span className="font-bold text-emerald-400">{v.ai_detection_score || 90}%</span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setVersionAId(v.id);
                        }}
                        className="text-[9px] font-bold font-mono px-2 py-1 border border-slate-800 hover:border-slate-600 rounded text-slate-400 hover:text-white"
                      >
                        Set A
                      </button>
                      <button
                        onClick={() => {
                          setVersionBId(v.id);
                        }}
                        className="text-[9px] font-bold font-mono px-2 py-1 border border-slate-800 hover:border-slate-600 rounded text-slate-400 hover:text-white"
                      >
                        Set B
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: QUALITY AUDITS & DEEP PERFORMANCE LOGS */}
        {activeTab === 'analytics' && (
          <div className="flex-1 p-6 flex flex-col gap-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 select-none">
              <div className="bg-gradient-to-br from-emerald-950/20 to-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">Avg Quality Score</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono text-white">92.4</span>
                  <span className="text-xs text-emerald-400 font-bold font-mono">+14.6%</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Weighted metrics spanning structured readability, search keywords preservation, layout alignment, and plagiarism checks.
                </p>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/10 to-slate-900 border border-slate-800/80 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">AI Content reduction</span>
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono text-white">88%</span>
                  <span className="text-xs text-indigo-405 font-bold font-mono">Watermark free</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Linguistic cadence variance filters applied. Highly randomized initial phrase tokens and custom verb distributions successfully deployed.
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider">Premium Credits Remaining</span>
                  <Database className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black font-mono text-white">Uncapped</span>
                  <span className="bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/20 font-bold font-mono">Priority VIP</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Your team is registered under SaaS Enterprise unlimited thread queue workers. Processing runs on dedicated, fast containers.
                </p>
              </div>
            </div>

            {/* LOG ENGINE CONTAINER */}
            <div className="flex-1 flex flex-col bg-slate-950 border border-slate-850 rounded-2xl p-5 min-h-[300px]">
              <div className="flex justify-between items-center pb-3 border-b border-slate-850 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-300">
                    Audit Logs Cluster Pipeline
                  </h4>
                </div>
                <button
                  onClick={handleClearHistoryLogs}
                  className="flex items-center gap-1 bg-slate-900 p-2 rounded-lg text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 text-[10px] font-mono font-bold transition duration-150 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-450" /> Clear Logs
                </button>
              </div>

              {/* LOG ENTRIES SCROLLER */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[290px] font-mono text-xs select-text">
                {logs.length === 0 ? (
                  <div className="text-center p-12 text-slate-600 text-xs">
                    No execution telemetry logged in current cycle.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-3 bg-slate-900/60 rounded-lg hover:bg-slate-900 border border-slate-850/40 flex flex-col md:flex-row md:items-center justify-between gap-2"
                    >
                      <div className="flex items-start md:items-center gap-2">
                        {log.status === 'success' && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] uppercase font-bold py-0.5 px-2 rounded shrink-0">
                            Success
                          </span>
                        )}
                        {log.status === 'info' && (
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[9px] uppercase font-bold py-0.5 px-2 rounded shrink-0">
                            Info
                          </span>
                        )}
                        {log.status === 'warn' && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] uppercase font-bold py-0.5 px-2 rounded shrink-0">
                            Warn
                          </span>
                        )}
                        {log.status === 'error' && (
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[9px] uppercase font-bold py-0.5 px-2 rounded shrink-0">
                            Failure
                          </span>
                        )}
                        
                        <p className="text-slate-300 font-sans leading-relaxed text-xs">
                          {log.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 shrink-0 self-end md:self-auto font-mono">
                        {log.token_usage > 0 && <span>Tokens: {log.token_usage}</span>}
                        {log.processing_time > 0 && <span>Timer: {log.processing_time}ms</span>}
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
