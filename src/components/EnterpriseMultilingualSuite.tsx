import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Languages, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Trash2, 
  Sparkles, 
  Coins, 
  Search, 
  Settings, 
  BarChart2, 
  TrendingUp, 
  ArrowRight,
  Eye,
  Info,
  ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Article, SupportedLanguage, ArticleTranslation, MultilingualKeyword, MultilingualGenerationLog, MultilingualQueueItem, MultilingualConfigState } from '../types';

interface EnterpriseMultilingualSuiteProps {
  activeArticle: Article | null;
  onTranslationLoaded?: (translation: ArticleTranslation) => void;
  onRefreshArticles?: () => void;
}

export default function EnterpriseMultilingualSuite({ 
  activeArticle, 
  onTranslationLoaded,
  onRefreshArticles 
}: EnterpriseMultilingualSuiteProps) {
  
  // Enterprise states loaded from real backend DB REST nodes
  const [config, setConfig] = useState<MultilingualConfigState>({
    default_language: "en",
    premium_only_advanced_localization: true,
    automatic_translation_on_publish: false,
    credits_limit: 1000000,
    credits_used: 12500
  });
  
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);
  const [translations, setTranslations] = useState<ArticleTranslation[]>([]);
  const [keywords, setKeywords] = useState<MultilingualKeyword[]>([]);
  const [logs, setLogs] = useState<MultilingualGenerationLog[]>([]);
  const [queue, setQueue] = useState<MultilingualQueueItem[]>([]);
  
  // Interactive Front-end states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLangCode, setSelectedLangCode] = useState('es');
  const [customLangCode, setCustomLangCode] = useState('');
  const [customLangName, setCustomLangName] = useState('');
  const [customLangDir, setCustomLangDir] = useState<'ltr' | 'rtl'>('ltr');
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [activeTab, setActiveTab] = useState<'translate' | 'queue' | 'analytics' | 'settings'>('translate');
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewTranslationId, setPreviewTranslationId] = useState<string | null>(null);

  // Load state from API
  const fetchState = async () => {
    try {
      setErrorMsg('');
      const response = await fetch('/api/multilingual/state');
      if (!response.ok) throw new Error('Failed to retrieve core localization database schemas');
      const data = await response.json();
      
      setConfig(data.config);
      setSupportedLanguages(data.supported_languages || []);
      setTranslations(data.article_translations || []);
      setKeywords(data.multilingual_keywords || []);
      setLogs(data.multilingual_generation_logs || []);
      setQueue(data.queue || []);
    } catch (err: any) {
      setErrorMsg(`Connection error: ${err.message}. Ensure backend proxy worker is booted.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    // Poll queue status every 12 seconds to provide live background worker telemetry
    const interval = setInterval(fetchState, 12000);
    return () => clearInterval(interval);
  }, []);

  // Update backend config toggles
  const handleUpdateConfig = async (updatedFields: Partial<MultilingualConfigState>) => {
    try {
      const response = await fetch('/api/multilingual/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, ...updatedFields })
      });
      const data = await response.json();
      if (data.success) {
        setConfig(prev => ({ ...prev, ...updatedFields }));
        setSuccessMsg('Global localization metrics synced successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(`Configuration sync error: ${err.message}`);
    }
  };

  // Instant Translate pipeline
  const handleInstantTranslate = async () => {
    if (!activeArticle) {
      setErrorMsg('Choose an active draft, review, or published post to optimize.');
      return;
    }
    
    setIsTranslating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/multilingual/translate-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: activeArticle.id,
          language_code: selectedLangCode,
          content: activeArticle.content,
          title: activeArticle.title,
          targetKeyword: activeArticle.targetKeyword,
          metaDescription: activeArticle.metaDescription
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'The Google Translation server pipeline timed out');
      }

      const result = await response.json();
      if (result.success) {
        setSuccessMsg(`Deep localized translation completed in target BCP-47 node! [Adapted keyword: "${result.localizedKeyword}"]`);
        // Notify Parent callbacks
        if (onTranslationLoaded) {
          onTranslationLoaded(result.data);
        }
        if (onRefreshArticles) {
          onRefreshArticles();
        }
        fetchState();
      }
    } catch (err: any) {
      setErrorMsg(`Translation system boundary clicked: ${err.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // Queue background pipeline
  const handleQueueTranslate = async () => {
    if (!activeArticle) {
      setErrorMsg('Choose an active draft to queue.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/multilingual/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: activeArticle.id,
          language_code: selectedLangCode,
          article_content: activeArticle.content,
          article_title: activeArticle.title,
          original_keyword: activeArticle.targetKeyword,
          meta_desc: activeArticle.metaDescription
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccessMsg(`Asynchronous generation task successfully registered. Queue ID: ${result.item.id}`);
        fetchState();
        setActiveTab('queue');
      }
    } catch (err: any) {
      setErrorMsg(`Failed submission to automated worker pool: ${err.message}`);
    }
  };

  // Trigger manual retry
  const handleRetryJob = async (jobId: string) => {
    try {
      setErrorMsg('');
      const response = await fetch('/api/multilingual/translate/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_id: jobId })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Job successfully re-entered active processing states.');
        fetchState();
      }
    } catch (err: any) {
      setErrorMsg(`Retry command failed: ${err.message}`);
    }
  };

  // Delete translation cache
  const handleDeleteTranslation = async (articleId: string, langCode: string) => {
    if (!confirm('Are you sure you want to delete this translation content cache?')) return;
    try {
      const response = await fetch('/api/multilingual/translate/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, language_code: langCode })
      });
      if (response.ok) {
        setSuccessMsg('Deleted target translation data matrices.');
        fetchState();
      }
    } catch (err: any) {
      setErrorMsg(`Deletion error: ${err.message}`);
    }
  };

  // Create Custom Language configuration to hit 150+ target nodes
  const handleAddCustomLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLangCode || !customLangName) {
      setErrorMsg('Provide both ISO designation and localized title label.');
      return;
    }
    
    setIsAddingLanguage(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/multilingual/languages/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: customLangCode.trim(),
          name: customLangName.trim(),
          nativeName: customLangName.trim(),
          dir: customLangDir
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'API insertion rejected configuration');
      }

      setSuccessMsg(`Added new site targeting scope node: ${customLangName}`);
      setCustomLangCode('');
      setCustomLangName('');
      fetchState();
    } catch (err: any) {
      setErrorMsg(`Schema insertion error: ${err.message}`);
    } finally {
      setIsAddingLanguage(false);
    }
  };

  // Sim credits refill
  const handleRechargeCredits = async () => {
    try {
      const response = await fetch('/api/multilingual/credits/recharge', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setConfig(prev => ({ ...prev, credits_used: Math.max(0, prev.credits_used - 100000) }));
        setSuccessMsg('Recharged 100,000 premium translation credits!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Search filtered languages list
  const filteredLanguages = supportedLanguages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLangInfo = supportedLanguages.find(l => l.code === selectedLangCode);

  // Dynamic calculations for enterprise chart widgets
  const getLanguageChartData = () => {
    const langCounts: Record<string, number> = {};
    translations.forEach(t => {
      langCounts[t.language_code] = (langCounts[t.language_code] || 0) + 1;
    });

    const data = Object.keys(langCounts).map(code => {
      const info = supportedLanguages.find(l => l.code === code);
      return {
        name: info ? info.name : code,
        value: langCounts[code]
      };
    });

    if (data.length === 0) {
      return [{ name: 'English (Primary)', value: 1 }];
    }
    return data;
  };

  const getShorthandLogCount = () => logs.length;
  const getQueueFailCount = () => queue.filter(q => q.status === 'failed').length;

  return (
    <div id="enterprise-multilingual-suite" className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
      
      {/* Upper Status Panel */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0e2119] text-white px-6 py-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1.5 w-fit font-mono">
              <Sparkles className="h-3 w-3 shadow-sm fill-emerald-400" />
              Enterprise Localization Node Active
            </span>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-400 animate-spin-slow" />
              Multilingual Article Localizer
            </h1>
            <p className="text-slate-400 text-xs max-w-xl">
              Automatically translate, optimize, localize and map global keyword strategies for 150+ target economies with full UTF-8 and RTL formatting bounds.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 shadow-inner">
            <Coins className="h-6 w-6 text-yellow-400 shrink-0" />
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enterprise Credit Pool Usage</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-white">
                  {config.credits_used.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">/</span>
                <span className="font-mono text-xs text-slate-400">
                  {config.credits_limit.toLocaleString()} words
                </span>
              </div>
              <div className="w-40 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (config.credits_used / config.credits_limit) * 100)}%` }}
                />
              </div>
            </div>
            <button 
              onClick={handleRechargeCredits}
              className="p-1.5 bg-slate-700 hover:bg-slate-650 rounded-lg text-slate-300 hover:text-white transition cursor-pointer self-end text-[10px] font-mono font-bold border border-slate-600 ml-1"
              title="Reset Simulated Quota Limits"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Global Notifications Panel */}
        {successMsg && (
          <div className="mt-4 bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl flex items-center gap-3 text-xs animate-fade-in shadow-xs">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <p className="font-medium text-slate-200">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 bg-rose-950/90 border border-rose-500/30 text-rose-300 p-3 rounded-xl flex items-center gap-3 text-xs animate-fade-in shadow-xs">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <p className="font-medium text-slate-200">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Tabs selectors bar */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 py-1.5 overflow-x-auto gap-1">
        <button 
          onClick={() => setActiveTab('translate')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${activeTab === 'translate' ? 'bg-white text-slate-950 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Languages className="h-3.5 w-3.5 text-indigo-500" />
          Translation Pipeline
        </button>
        <button 
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition cursor-pointer relative shrink-0 ${activeTab === 'queue' ? 'bg-white text-slate-950 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          Async Queue Worker
          {queue.filter(q => q.status === 'pending' || q.status === 'processing').length > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse border border-white" />
          )}
          {getQueueFailCount() > 0 && (
            <span className="bg-rose-100 text-rose-700 text-[9px] px-1.5 py-0.5 rounded-full font-black animate-bounce ml-1">{getQueueFailCount()} failed</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <BarChart2 className="h-3.5 w-3.5 text-emerald-500" />
          Language Analytics
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Settings className="h-3.5 w-3.5 text-slate-500" />
          Localization Settings
        </button>
      </div>

      {/* Main Tab Render Workspace */}
      <div className="p-6">
        
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
            <p className="text-slate-500 text-xs font-mono">Connecting to active micro tenant databases...</p>
          </div>
        ) : (
          <>
            
            {/* TAB: PIPELINE */}
            {activeTab === 'translate' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Visual Article Translator Selector Form */}
                <div className="lg:col-span-5 space-y-6">
                  
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse fill-emerald-100" />
                      1. Select Localization Target
                    </h3>
                    
                    {/* Search Picker */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search 150+ global languages..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-slate-400"
                        />
                      </div>
                      
                      {/* Interactive Dropdown / Fast Selector Box */}
                      <div className="border border-slate-200 bg-white rounded-xl max-h-40 overflow-y-auto p-1 text-xs divide-y divide-slate-100 divide-dashed">
                        {filteredLanguages.length === 0 ? (
                          <div className="p-3 text-slate-400 text-center text-xs font-mono">No localized nodes match query. Try adding one in settings!</div>
                        ) : (
                          filteredLanguages.map(lang => (
                            <button
                              key={lang.code}
                              onClick={() => setSelectedLangCode(lang.code)}
                              className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition cursor-pointer ${selectedLangCode === lang.code ? 'bg-slate-100/80 font-black text-emerald-600' : 'hover:bg-slate-50 text-slate-700'}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded text-[10px] font-mono">{lang.code.toUpperCase()}</span>
                                <span>{lang.name} <span className="text-slate-400 text-[10px]">({lang.nativeName})</span></span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {lang.dir === 'rtl' && (
                                  <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded font-black">RTL FLOW</span>
                                )}
                                {lang.isPremium && (
                                  <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.2 rounded font-extrabold uppercase">ADVANCED</span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Active target preview */}
                    {selectedLangInfo && (
                      <div className="bg-white p-3.5 rounded-xl border border-slate-250 flex items-center justify-between text-xs font-sans">
                        <div>
                          <p className="font-extrabold text-slate-800">Target Locale: {selectedLangInfo.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Direction: <span className="font-mono uppercase font-black text-slate-700">{selectedLangInfo.dir}</span> | Code: <span className="font-mono text-slate-700">{selectedLangInfo.code}</span>
                          </p>
                        </div>
                        <span className="h-3 w-3 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                      </div>
                    )}
                  </div>

                  {/* Translator Controls Container */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      2. Process Model Architecture
                    </h3>

                    {activeArticle ? (
                      <div className="space-y-4 text-xs">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1 relative">
                          <span className="absolute top-2 right-2 bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-md font-mono">Original Source</span>
                          <p className="font-extrabold text-slate-900 truncate pr-16">{activeArticle.title}</p>
                          <p className="text-slate-400 font-mono text-[10.5px]">Keyword: {activeArticle.targetKeyword}</p>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <button
                            onClick={handleInstantTranslate}
                            disabled={isTranslating}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-black text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                          >
                            {isTranslating ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                                <span>Generating Cultural Adaptations...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 text-slate-950 fill-white" />
                                <span>Generate Instant Localized Post</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleQueueTranslate}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
                          >
                            <Clock className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Queue in Background Worker Pool</span>
                          </button>
                        </div>
                        
                        <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 leading-relaxed text-[10.5px] font-sans flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <p>
                            Both flows run authentic localized SEO algorithms. Natural translations avoid word-for-word patterns, finding regional LSI keyword search engines instantly.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-400 space-y-2">
                        <Languages className="h-8 w-8 mx-auto text-slate-300" />
                        <p className="text-xs font-medium">Please select an Article in the workspace editor to enable target localized optimization.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side translations cache & lists */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center gap-4 border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">Site Translated Asset Inventory</h3>
                        <p className="text-[10px] text-slate-400">Manage all existing page versions mapped to search nodes</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] px-2 py-0.5 rounded font-black border border-emerald-200">{translations.length} Versions</span>
                    </div>

                    {translations.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <Globe className="h-10 w-10 text-slate-200 mx-auto" />
                        <p className="text-xs">No translated files generated yet. Select an article on the left side to compile native layouts.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {translations.map((trans) => {
                          const langInfo = supportedLanguages.find(l => l.code === trans.language_code);
                          const isShowingPreview = previewTranslationId === trans.id;
                          
                          return (
                            <div key={trans.id} className="bg-white p-4.5 rounded-2xl border border-slate-200 hover:border-slate-300 transition shadow-inner">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[9.5px] px-2 py-0.5 rounded-md uppercase font-black tracking-wide">
                                      {langInfo ? `${langInfo.name} (${trans.language_code.toUpperCase()})` : trans.language_code.toUpperCase()}
                                    </span>
                                    {langInfo?.dir === 'rtl' && (
                                      <span className="bg-rose-50 text-rose-700 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">RTL Flow Layout</span>
                                    )}
                                    <span className="bg-emerald-50 text-emerald-700 text-[9.5px] px-2 py-0.2 rounded-md font-mono border border-emerald-100 font-bold">Completed</span>
                                  </div>
                                  <h4 className="font-extrabold text-slate-900 text-sm leading-snug mt-1">{trans.translated_title}</h4>
                                  <p className="text-[11px] text-slate-400 font-mono">Slug: /{trans.translated_slug}</p>
                                </div>
                                <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                                  <button
                                    onClick={() => setPreviewTranslationId(isShowingPreview ? null : trans.id)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-slate-150"
                                    title="Examine formatted output"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>{isShowingPreview ? 'Close RTL Preview' : 'RTL Preview'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTranslation(trans.article_id, trans.language_code)}
                                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-100"
                                    title="Purge cache versions"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Local Keyword & SEO tags indicators */}
                              <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
                                <div className="space-y-1">
                                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Localized Core Keyword Match</p>
                                  {keywords.filter(k => k.article_id === trans.article_id && k.language_code === trans.language_code).map(k => (
                                    <div key={k.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-150 font-mono">
                                      <span className="text-slate-900 font-bold">"{k.localized_term}"</span>
                                      <span className="text-[10px] text-emerald-600 font-black">Score: {k.search_volume ? `~${k.search_volume}` : 'N/A'} vol</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider font-sans">Click Meta Description Localization</p>
                                  <p className="bg-slate-50 p-2 rounded-lg border border-slate-150 text-[10.5px] italic text-slate-500 leading-relaxed truncate" title={trans.localized_meta_description}>
                                    {trans.localized_meta_description || 'No description localized yet.'}
                                  </p>
                                </div>
                              </div>

                              {/* RTL PREVIEW PANEL SUPPORT (Arabic, Hebrew, Persian etc) */}
                              {isShowingPreview && (
                                <div 
                                  className="mt-4 p-4 border border-rose-100 rounded-xl bg-orange-50/20 text-slate-800 space-y-3 shadow-inner"
                                  dir={langInfo?.dir || 'ltr'}
                                >
                                  <div className="flex items-center justify-between border-b border-rose-100/40 pb-2 flex-row-reverse">
                                    <span className="text-[9.5px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-black uppercase font-mono">
                                      {langInfo?.dir === 'rtl' ? 'Right-To-Left Flow Preview' : 'Standard Flow Preview'}
                                    </span>
                                    <p className="text-slate-400 font-bold text-[10px] font-mono">BCP-47 Layout Framework Preview</p>
                                  </div>
                                  <h3 className="font-extrabold text-base md:text-lg border-b border-slate-100 pb-2">{trans.translated_title}</h3>
                                  <div className="space-y-2 text-xs leading-relaxed max-h-60 overflow-y-auto text-slate-755 whitespace-pre-wrap">
                                    {trans.translated_content}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: QUEUE */}
            {activeTab === 'queue' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-200">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Background Thread Queue States</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Automated queue processing simulates scalable enterprise pipelines with safe retries limits</p>
                  </div>
                  <button 
                    onClick={fetchState}
                    className="self-start sm:self-auto px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 hover:text-slate-900 font-bold text-xs cursor-pointer flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Poll Monitor Status</span>
                  </button>
                </div>

                {queue.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 space-y-2">
                    <Clock className="h-10 w-10 mx-auto text-slate-200 animate-pulse" />
                    <p className="text-xs">Translation queue is currently empty. Run or schedule generations inside the translator panel.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs text-slate-600 bg-white">
                      <thead className="bg-slate-50 font-bold border-b border-slate-200 text-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-extrabold pb-3 pt-3">Article Context</th>
                          <th className="px-4 py-3 font-extrabold pb-3 pt-3">Language Target</th>
                          <th className="px-4 py-3 font-bold pb-3 pt-3">Status</th>
                          <th className="px-4 py-3 font-bold pb-3 pt-3">Retry Metrics</th>
                          <th className="px-4 py-3 font-bold pb-3 pt-3">Update Timestamp</th>
                          <th className="px-4 py-3 font-bold pb-3 pt-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {queue.map(job => {
                          const langInfo = supportedLanguages.find(l => l.code === job.language_code);
                          
                          return (
                            <tr key={job.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3.5 font-extrabold text-slate-900 truncate max-w-[170px] sm:max-w-xs">
                                Article ID: {job.article_id}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="bg-slate-100 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-700">
                                  {langInfo ? `${langInfo.name} (${job.language_code.toUpperCase()})` : job.language_code.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                {job.status === 'completed' && (
                                  <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-black border border-emerald-100 flex items-center gap-1 w-fit">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Completed
                                  </span>
                                )}
                                {job.status === 'processing' && (
                                  <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-black border border-indigo-100 flex items-center gap-1 w-fit animate-pulse">
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> Under Synthesis
                                  </span>
                                )}
                                {job.status === 'pending' && (
                                  <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold border border-amber-100 flex items-center gap-1 w-fit">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Queueing
                                  </span>
                                )}
                                {job.status === 'failed' && (
                                  <span className="bg-rose-50 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-black border border-rose-100 flex items-center gap-1 w-fit">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Blocked/Error
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-slate-500">
                                {job.retries}/3 attempts
                              </td>
                              <td className="px-4 py-3.5 text-slate-400 font-mono text-[10.5px]">
                                {new Date(job.updated_at).toLocaleTimeString()}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {job.status === 'failed' ? (
                                  <button
                                    onClick={() => handleRetryJob(job.id)}
                                    className="p-1 px-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 hover:text-rose-900 border border-rose-200 transition text-[10.5px] font-black rounded-lg cursor-pointer inline-flex items-center gap-1 self-center"
                                  >
                                    <RefreshCw className="h-3 w-3 animate-spin-slow" />
                                    <span>Force Retry</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-350 text-[10.5px] italic">Dynamic Queue Monitor</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Worker log events stream */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5">
                  <div className="flex justify-between items-center gap-2 border-b border-slate-200 pb-2">
                    <h4 className="text-slate-900 font-extrabold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      Multilingual Localization Engine Daemon Log Nodes
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{getShorthandLogCount()} Entries mapped</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[10.5px] text-emerald-400/90 space-y-2 max-h-48 overflow-y-auto shadow-inner leading-relaxed select-all">
                    {logs.length === 0 ? (
                      <p className="text-slate-500 italic">No task operations emitted yet.</p>
                    ) : (
                      logs.map(log => (
                        <div key={log.id} className="flex items-start gap-2 border-b border-slate-800/60 pb-1 w-full text-ellipsis overflow-hidden">
                          <span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className={`shrink-0 uppercase font-bold text-[9.5px] px-1 py-0.1 rounded ${log.status === 'success' ? 'bg-emerald-950 text-emerald-400' : log.status === 'error' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                            {log.action}
                          </span>
                          <span className="text-slate-300 text-ellipsis overflow-hidden">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ANALYTICS */}
            {activeTab === 'analytics' && (
              <div className="space-y-8 animate-fade-in text-slate-700">
                
                {/* Metrics top raw bento row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-indigo-50/40 p-4.5 rounded-2xl border border-indigo-150/40 space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Top Target Language</p>
                    <p className="text-2xl font-black text-slate-900">Spanish (es)</p>
                    <p className="text-[10px] text-slate-400 font-medium">Leading localized CTR node</p>
                  </div>
                  
                  <div className="bg-emerald-50/40 p-4.5 rounded-2xl border border-emerald-150/40 space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Localized SEO Indexed Pages</p>
                    <p className="text-2xl font-black text-slate-900">{translations.length + 3} versions</p>
                    <p className="text-[10px] text-slate-400 font-medium">94.2% Indexation success rates</p>
                  </div>

                  <div className="bg-amber-50/40 p-4.5 rounded-2xl border border-amber-150/40 space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Task Completion Rate</p>
                    <p className="text-2xl font-black text-slate-900">100%</p>
                    <p className="text-[10px] text-slate-400 font-medium">Automatic fallback server active</p>
                  </div>

                  <div className="bg-rose-50/40 p-4.5 rounded-2xl border border-rose-150/40 space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Engaged Session Lifespan</p>
                    <p className="text-2xl font-black text-slate-900">+4m 12s</p>
                    <p className="text-[10px] text-slate-400 font-medium">With localized inline widgets</p>
                  </div>
                </div>

                {/* Graph Analytics Visual Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Recharts Bar Chart: SEO ranks projection */}
                  <div className="lg:col-span-8 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Target Locale Audience Engagement Metrics</h4>
                        <p className="text-[10.5px] text-slate-400">Total estimated monthly traffic index by localized translation nodes</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono font-bold">150+ Regions Simulated</span>
                      </div>
                    </div>

                    <div className="h-64 mt-4 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { language: 'Spanish (es)', traffic: 4800, score: 92 },
                            { language: 'French (fr)', traffic: 3200, score: 88 },
                            { language: 'German (de)', traffic: 2900, score: 91 },
                            { language: 'Hindi (hi)', traffic: 7100, score: 85 },
                            { language: 'Chinese (zh)', traffic: 6300, score: 89 },
                            { language: 'Arabic (ar)', traffic: 3900, score: 90 },
                            { language: 'Japanese (ja)', traffic: 5120, score: 93 }
                          ]}
                          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                        >
                          <XAxis dataKey="language" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: 'white', fontSize: '11px' }} 
                            labelStyle={{ color: '#10b981', fontWeight: 'black' }}
                          />
                          <Bar dataKey="traffic" fill="#10b981" radius={[8, 8, 0, 0]}>
                            <Cell fill="#10b981" />
                            <Cell fill="#6366f1" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ec4899" />
                            <Cell fill="#14b8a6" />
                            <Cell fill="#8b5cf6" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recharts Pie Chart: Language counts distribution */}
                  <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Translation Node Proportions</h4>
                      <p className="text-[10.5px] text-slate-400">Relative allocation percentages across active multilingual nodes</p>
                    </div>

                    <div className="h-44 mt-2 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getLanguageChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {getLanguageChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: '10.5px', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-1.5 text-[10.5px] border-t border-slate-200 pt-3">
                      {getLanguageChartData().slice(0, 3).map((lang, index) => (
                        <div key={lang.name} className="flex justify-between items-center text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][index % 5] }} />
                            <span>{lang.name}</span>
                          </div>
                          <span className="font-mono text-slate-900">{lang.value} pages</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SETTINGS & ADD LOCALE */}
            {activeTab === 'settings' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Form to add customized translation targeting scope (reaches up to 150+) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Add High-Authority Local Targeting Node</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Scale RankSyncer up to 150+ regional markets dynamically by defining standard locale codes.</p>
                    </div>

                    <form onSubmit={handleAddCustomLanguage} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700">BCP-47 / Locale Language Code</label>
                        <input 
                          type="text" 
                          placeholder="e.g. ar-EG, ja-JP, zh-CN, it-IT"
                          value={customLangCode}
                          onChange={(e) => setCustomLangCode(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700">Language Title Display Label</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Arabic (Egypt), Italian (Rome)"
                          value={customLangName}
                          onChange={(e) => setCustomLangName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-extrabold text-slate-700">Typographic Flow Direction</label>
                        <select 
                          value={customLangDir}
                          onChange={(e) => setCustomLangDir(e.target.value as 'ltr' | 'rtl')}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="ltr">ltr - Left To Right (Default)</option>
                          <option value="rtl">rtl - Right To Left (Arabic/Hebrew/Persian/Urdu)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isAddingLanguage}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        {isAddingLanguage ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Adding targeted locale node...</span>
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4" />
                            <span>Register Localized Subdomain Node</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* General settings panel parameters */}
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-5">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Localization Architecture Policy Options</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Configure default engine policies, fallbacks, and advanced cultural adaptability parameters</p>
                    </div>

                    <div className="space-y-4 text-xs font-sans text-slate-700">
                      
                      {/* Premium Toggle */}
                      <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900">Premium-Only Advanced Localizations</p>
                          <p className="text-[10px] text-slate-400">Strictly apply advanced semantic search adapters on premium locales</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={config.premium_only_advanced_localization}
                            onChange={(e) => handleUpdateConfig({ premium_only_advanced_localization: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                        </label>
                      </div>

                      {/* Transatlantic Fallback */}
                      <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-900">Automatic translation on core post publish</p>
                          <p className="text-[10px] text-slate-400">Trigger async generation queue as soon as primary English copy is finalized</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={config.automatic_translation_on_publish}
                            onChange={(e) => handleUpdateConfig({ automatic_translation_on_publish: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                        </label>
                      </div>

                      {/* Default Global website language setting selection */}
                      <div className="space-y-1.5 p-3.5 bg-white border border-slate-200 rounded-2xl">
                        <p className="font-extrabold text-slate-900">Default Site Core Language</p>
                        <p className="text-[10px] text-slate-400">Base locale which content engines ingest before translation processes</p>
                        <select
                          value={config.default_language}
                          onChange={(e) => handleUpdateConfig({ default_language: e.target.value })}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none mt-1 text-slate-800 font-medium"
                        >
                          <option value="en">English (default_lang_en)</option>
                          <option value="es">Spanish (es)</option>
                          <option value="fr">French (fr)</option>
                          <option value="de">German (de)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
