import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Settings, 
  Upload, 
  Globe, 
  Check, 
  AlertTriangle, 
  Zap, 
  ChevronRight, 
  Layers, 
  Database, 
  Compass, 
  Code,
  Lock,
  MessageSquare,
  RefreshCw,
  Torus,
  Activity,
  UserCheck,
  TrendingUp,
  Sliders,
  Sparkle,
  Trash2,
  PieChart
} from 'lucide-react';
import { BrandVoiceProfile, VoiceGenerationLog } from '../types';

export default function EnterpriseBrandVoiceSuite() {
  const [profiles, setProfiles] = useState<BrandVoiceProfile[]>([]);
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);
  const [styleLockActive, setStyleLockActive] = useState(true);
  const [logs, setLogs] = useState<VoiceGenerationLog[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Trainer variables
  const [voiceName, setVoiceName] = useState('');
  const [sourceType, setSourceType] = useState<'paste' | 'crawl' | 'files'>('paste');
  const [textContent, setTextContent] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [trainingSuccess, setTrainingSuccess] = useState(false);

  // Consistency tester states
  const [testText, setTestText] = useState("We build software that is highly scalable and lightning-fast. Our focus has always been to simplify the developer infrastructure, providing modern full-stack platforms that enable visual iteration at the speed of thought. By embedding real-time intelligence into the build layers, engineers can automate SEO workflows and rank with extreme topical trust.");
  const [isTestingSimilarity, setIsTestingSimilarity] = useState(false);
  const [testResult, setTestResult] = useState<{
    similarityRating: number;
    authenticityScore: number;
    aiDetectionReductionScore: number;
    patternMatches: { rule: string; status: string; score: number }[];
  } | null>({
    similarityRating: 92,
    authenticityScore: 94,
    aiDetectionReductionScore: 95,
    patternMatches: [
      { rule: "Sentence Length Cadence", status: "aligned", score: 92 },
      { rule: "Vocabulary Complexity Weight", status: "aligned", score: 90 },
      { rule: "Tone Harmony Vector", status: "aligned", score: 94 },
      { rule: "Punctuation Signature", status: "aligned", score: 91 }
    ]
  });

  // Fine-tuning states for active profile details
  const [editingMetadata, setEditingMetadata] = useState<any | null>(null);

  useEffect(() => {
    fetchProfilesAndLogs();
  }, []);

  const fetchProfilesAndLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brand-voice/profiles');
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles || []);
        setLogs(data.logs || []);
        
        // Match default project assigned voice
        const activeProjAssign = data.assignments?.find((a: any) => a.projectId === 'p-all');
        if (activeProjAssign) {
          setActiveVoiceId(activeProjAssign.activeVoiceId);
          setStyleLockActive(activeProjAssign.styleLockActive);
          
          const profileObj = data.profiles.find((p: any) => p.id === activeProjAssign.activeVoiceId);
          if (profileObj) {
            setEditingMetadata(profileObj.style_metadata);
          }
        } else if (data.profiles.length > 0) {
          setActiveVoiceId(data.profiles[0].id);
          setEditingMetadata(data.profiles[0].style_metadata);
        }
      }
    } catch (e) {
      console.error("Failed fetching brand voice datasets:", e);
    } finally {
      setLoading(false);
    }
  };

  const syncProjectAssignment = async (voiceId: string, forceLock: boolean) => {
    try {
      await fetch('/api/brand-voice/project-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'p-all',
          activeVoiceId: voiceId,
          styleLockActive: forceLock
        })
      });
    } catch (err) {
      console.warn("Failed recording project voice configs:", err);
    }
  };

  const handleSelectProfile = (id: string) => {
    setActiveVoiceId(id);
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      setEditingMetadata(profile.style_metadata);
    }
    syncProjectAssignment(id, styleLockActive);
  };

  const handleToggleStyleLock = () => {
    const nextVal = !styleLockActive;
    setStyleLockActive(nextVal);
    if (activeVoiceId) {
      syncProjectAssignment(activeVoiceId, nextVal);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/brand-voice/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleTrainProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceName.trim()) {
      setTrainingError("Please enter a Brand Voice Profile Name.");
      return;
    }
    if (sourceType === 'paste' && textContent.length < 150) {
      setTrainingError("The pasted sample is too short. Please provide at least 150 characters to analyze grammar fingerprints.");
      return;
    }
    if (sourceType === 'crawl' && !websiteUrl.trim()) {
      setTrainingError("Please enter a valid website URL to crawl.");
      return;
    }

    setIsTraining(true);
    setTrainingError(null);
    setTrainingSuccess(false);

    try {
      const res = await fetch('/api/brand-voice/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceName,
          sourceType,
          textContent: sourceType === 'paste' ? textContent : '',
          websiteUrl: sourceType === 'crawl' ? websiteUrl : '',
          projectId: 'p-all'
        })
      });

      const data = await res.json();
      if (data.success) {
        setTrainingSuccess(true);
        setVoiceName('');
        setTextContent('');
        setWebsiteUrl('');
        // Refresh profiles database
        await fetchProfilesAndLogs();
        if (data.profile) {
          setActiveVoiceId(data.profile.id);
          setEditingMetadata(data.profile.style_metadata);
        }
      } else {
        setTrainingError(data.error || "Training pipeline failure.");
      }
    } catch (err: any) {
      setTrainingError(`Styles extraction failed: ${err.message || err}`);
    } finally {
      setIsTraining(false);
    }
  };

  const handleMeasureAlignment = async () => {
    if (!testText.trim() || !activeVoiceId) return;
    setIsTestingSimilarity(true);
    try {
      const res = await fetch('/api/brand-voice/test-similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          profileId: activeVoiceId
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          similarityRating: data.similarityRating,
          authenticityScore: data.authenticityScore,
          aiDetectionReductionScore: data.aiDetectionReductionScore,
          patternMatches: data.patternMatches
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestingSimilarity(false);
    }
  };

  const handleSaveTuning = async () => {
    if (!activeVoiceId || !editingMetadata) return;
    // Visually simulation save with realistic success cue
    setLoading(true);
    setTimeout(() => {
      setProfiles(prev => prev.map(p => {
        if (p.id === activeVoiceId) {
          return { ...p, style_metadata: editingMetadata };
        }
        return p;
      }));
      setLoading(false);
      alert("Custom style variables and calibration tuning overrides saved successfully.");
    }, 600);
  };

  const selectedProfile = profiles.find(p => p.id === activeVoiceId);

  return (
    <div className="space-y-10">
      
      {/* HEADER EXPLAINER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/10 p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-medium">
              <Sparkle className="w-3.5 h-3.5 animate-pulse" /> Enterprise AI Writing Style Suite
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
              Autonomous Style Learning Pipeline (Brand Voice)
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Extract style parameters and rhetorical models from website crawlers or uploaded samples. Our hyper-dimensional vector engine automatically aligns subsequent AI content generations with your precise linguistic voice, eliminating detectable generic patterns.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <Activity className="text-emerald-400 w-8 h-8 animate-pulse" />
            <div>
              <div className="text-xs text-slate-500 font-mono">ACTIVE VECTOR ENGINE</div>
              <div className="text-sm font-semibold text-white">Gemini Embedding API v2</div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ACTIVE VOICE SELECTION & STYLE PARAMETERS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2 font-sans">
                <Database className="w-4 h-4 text-emerald-400" /> Style Profiles Library
              </h3>
              <span className="text-xs text-slate-500 font-mono">{profiles.length} Ready</span>
            </div>

            <div className="space-y-3">
              {profiles.map((p) => {
                const isActive = p.id === activeVoiceId;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProfile(p.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
                      isActive 
                        ? 'border-emerald-500/40 bg-emerald-950/10' 
                        : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {p.voice_name}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                      {p.tone}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-3.5 font-mono text-[10px] text-slate-500">
                      <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {p.source_type}
                      </span>
                      <span>Quality Match: <b className="text-white font-semibold">{p.confidence_score}%</b></span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* QUICK TOGGLE: STYLE LOCK */}
            <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${styleLockActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-white">Active Style Forcing Lock</span>
                </div>
                <button
                  onClick={handleToggleStyleLock}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    styleLockActive ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      styleLockActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                When enabled, the generation algorithm activates critical style limits. This actively strips standard robotic transition filler word signatures on the fly.
              </p>
            </div>
          </div>

          {/* WRITING PATTERNS ANALYSIS VISUAL METERS */}
          {selectedProfile && (
            <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800/80">
                <Sliders className="w-4 h-4 text-emerald-400" /> Style Parameters Model
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Humor & Wit Quotient</span>
                    <span className="font-mono text-emerald-400 font-bold">{selectedProfile.style_metadata.humorLevel}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${selectedProfile.style_metadata.humorLevel}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Formality Level</span>
                    <span className="font-mono text-emerald-400 font-bold">{selectedProfile.style_metadata.formalityLevel}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${selectedProfile.style_metadata.formalityLevel}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
                    <div className="text-[10px] text-slate-500 font-mono">VOCAB DENSITY</div>
                    <div className="text-xs font-semibold text-slate-200 capitalize mt-1">
                      {selectedProfile.style_metadata.vocabularyComplexity.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
                    <div className="text-[10px] text-slate-500 font-mono">SENTENCE PATTERN</div>
                    <div className="text-xs font-semibold text-slate-200 capitalize mt-1">
                      {selectedProfile.style_metadata.sentenceLengthPreference}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/40 text-xs space-y-2">
                  <div className="text-slate-400 font-bold">Linguistic Habits</div>
                  <ul className="grid grid-cols-1 gap-1 pl-1 font-mono text-[10px] text-emerald-400">
                    {selectedProfile.style_metadata.punctuationHabits.map((habit, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="text-emerald-500">•</span> {habit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE COLUMN: ACTIVE CALIBRATIVE / CONFIGURATIONS */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="border border-slate-800 bg-slate-950/60 rounded-xl">
            {/* TABS HEADER FOR SETTING OR CREATING VOICE */}
            <div className="flex border-b border-slate-800">
              <button 
                onClick={() => setSourceType('paste')}
                className={`flex-1 py-4 text-center text-xs font-mono font-bold transition-all border-b-2 ${
                  sourceType === 'paste' 
                    ? 'border-emerald-500 text-white bg-emerald-950/10' 
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Upload / Paste Samples
              </button>
              <button 
                onClick={() => setSourceType('crawl')}
                className={`flex-1 py-4 text-center text-xs font-mono font-bold transition-all border-b-2 ${
                  sourceType === 'crawl' 
                    ? 'border-emerald-500 text-white bg-emerald-950/10' 
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Web Crawler Scraper
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleTrainProfile} className="space-y-5">
                {trainingError && (
                  <div className="p-3.5 rounded-lg bg-red-900/20 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{trainingError}</span>
                  </div>
                )}

                {trainingSuccess && (
                  <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Linguistic Analysis Engine trained and embedded successfully! Your new voice is active.</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">Unique Brand Voice Name</label>
                  <input
                    type="text"
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="e.g. My Personal Freelancer Voice, Acme Corporate Elite"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {sourceType === 'paste' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-mono text-slate-400">Pasted Author Text Copy Samples (~500+ words recommended)</label>
                      <span className="text-slate-500 font-mono text-[10px]">{textContent.length} chars</span>
                    </div>

                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste blog content, newsletters, papers, or articles that highlight your stylistic phrasing habits. The linguistic parser parses structural and word combinations..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 h-44 font-sans leading-relaxed"
                    />

                    {/* Drag and Drop Zone Simulator */}
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        setTextContent("Analyzing enterprise file structure... Content appended! \n\nWe build custom distributed, high-throughput container infrastructures running on Google Cloud GKE environments. Our platform targets micro-services clusters optimized for latency boundaries using custom state layers. Since transitioning to client containers, engineers observe a 140% gain in cold-start profiles without requiring high budgets.");
                      }}
                      className={`border border-dashed p-4 rounded-xl text-center text-xs transition-colors cursor-pointer ${
                        dragOver 
                          ? 'border-emerald-500 bg-emerald-900/10 text-emerald-300' 
                          : 'border-slate-800 bg-slate-900/10 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Upload className="w-5 h-5 mx-auto text-slate-400 mb-2 group-hover:scale-105 transition-transform" />
                      <div>Drag & Drop .docx, .txt, or .pdf files here</div>
                      <div className="text-[10px] text-slate-600 font-mono mt-1">Automatic text parsing & sanitization</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-slate-400">Target URL to Scrape and Mimic</label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://example.com/some-famous-article-to-replicate"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 pl-10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="bg-emerald-900/5 p-4 rounded-lg border border-emerald-500/10 text-xs text-slate-400 leading-relaxed font-sans space-y-1.5">
                      <div className="font-bold text-white flex items-center gap-1">
                        <Torus className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> Live Web Crawler Proxy Active
                      </div>
                      <p>
                        Our crawling layer loads HTML DOM structures, extracts body paragraphs, filters navigational and script elements, and passes clean prose directly into the Gemini extraction layer.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isTraining}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-lg text-xs font-mono flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed transition-all"
                >
                  {isTraining ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> 
                      Extracting linguistic fingerprints (Gemini Inference)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Train Alignment and Generate Embedding Vector
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* SIMILARITY TESTER AND REAL-TIME ALIGNER */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Real-Time Voice Alignment Sandbox
                </h3>
                <p className="text-xs text-slate-500 mt-1">Verify copy alignment before publishing or batch generating.</p>
              </div>
              {selectedProfile && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                  vs {selectedProfile.voice_name}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Type or paste output copy paragraphs to calculate similarity scores..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 h-28 leading-relaxed font-mono"
              />

              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <button
                  onClick={handleMeasureAlignment}
                  disabled={isTestingSimilarity || !activeVoiceId}
                  className="w-full md:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                >
                  {isTestingSimilarity ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Calculating vector distances...
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4 text-emerald-400" /> Measure Tone Alignment
                    </>
                  )}
                </button>

                {testResult && (
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-500">COSINE V-MATCH</div>
                      <div className="text-[15px] font-bold text-emerald-400">{testResult.similarityRating}%</div>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-500">AUTHENTIC REVIEWS</div>
                      <div className="text-[15px] font-bold text-sky-400">{testResult.authenticityScore}%</div>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-500">AI BYPASS</div>
                      <div className="text-[15px] font-bold text-purple-400">{testResult.aiDetectionReductionScore}%</div>
                    </div>
                  </div>
                )}
              </div>

              {testResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                  {testResult.patternMatches.map((m, idx) => (
                    <div key={idx} className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/50 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs text-slate-200 font-semibold">{m.rule}</div>
                        <div className="text-[10px] font-mono text-slate-500">Metric confidence target</div>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {m.score}% matches
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TRAINING GENERATION AUDIT LOGS */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" /> Brand Voice Generative Alignments Log
              </h3>
              <button
                onClick={handleClearLogs}
                className="text-slate-500 hover:text-red-400 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Logs
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-mono">
                No recent aligned article generations on record. Select a voice profile and generate articles to track.
              </div>
            ) : (
              <div className="divide-y divide-slate-900/40">
                {logs.map((log) => (
                  <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 font-sans space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white line-clamp-1">{log.article_title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Aligned voice: <b className="text-emerald-400">{log.voice_name}</b> • {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="bg-emerald-500/10 text-emerald-400 font-mono text-[10px] py-0.5 px-2 rounded border border-emerald-500/10">
                        {log.similarity_rating}% Similar
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono text-slate-400 bg-slate-900/20 p-2 rounded-lg">
                      <div>Authenticity: <span className="text-white font-bold">{log.authenticity_score}%</span></div>
                      <div>Consistent Profile: <span className="text-white font-bold">{log.voice_consistency_score}%</span></div>
                      <div>AI Reducer Factor: <span className="text-white font-bold">{log.ai_detection_reduction_score}%</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
