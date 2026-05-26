import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Info, HelpCircle, Check, Loader2, Sparkles, RefreshCw, BarChart2, ShieldAlert, Award, FileText, ChevronRight, Hash, Download, Plus, AlertCircle, Globe } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { KeywordResearchResult, SerpRankedPage } from '../lib/seo/types';

interface KeywordUsage {
  creditsLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
}

interface KeywordResearchSuiteProps {
  onTrackKeyword: (term: string, volume: number, difficulty: number, intent: string) => void;
  selectedProjectId?: string;
  projectName?: string;
  trackedKeywordTerms: string[];
}

export const KeywordResearchSuite: React.FC<KeywordResearchSuiteProps> = ({
  onTrackKeyword,
  selectedProjectId,
  projectName = 'Default Project',
  trackedKeywordTerms = []
}) => {
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('US');
  const [language, setLanguage] = useState('en');
  const [device, setDevice] = useState('desktop');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<KeywordResearchResult | null>(null);
  
  // Loader message rotations for highly professional feedback UX!
  const [loaderMessage, setLoaderMessage] = useState('Scanning live autocomplete feeds...');
  const loaderMessages = [
    'Scanning live Google suggest search APIs...',
    'Analyzing search volume & difficulty trends...',
    'Running competitive authority indexing...',
    'Triggering Gemini 3.5 semantic clustering...',
    'Finalizing rich content gap analysis...'
  ];

  // Usage tracker credits state
  const [usage, setUsage] = useState<KeywordUsage | null>(null);
  const [isResettingUsage, setIsResettingUsage] = useState(false);
  const [justTrackedKeys, setJustTrackedKeys] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    let msgIndex = 0;
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setInterval(() => {
        msgIndex = (msgIndex + 1) % loaderMessages.length;
        setLoaderMessage(loaderMessages[msgIndex]);
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // Load remaining search credits on mount
  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/keywords/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (e) {
      console.warn('Could not read credits count', e);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const handleResetUsage = async () => {
    try {
      setIsResettingUsage(true);
      const res = await fetch('/api/keywords/usage/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setUsage({
          creditsLimit: data.creditsLimit,
          creditsUsed: data.creditsUsed,
          creditsRemaining: data.creditsRemaining
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResettingUsage(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setIsLoading(true);
    setError(null);
    setResearchResult(null);

    try {
      const response = await fetch('/api/keywords/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          country,
          language,
          device
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json();
        throw new Error(errPayload.error || 'Server returned an abnormal state.');
      }

      const resultData = await response.json() as KeywordResearchResult & { quota: KeywordUsage };
      setResearchResult(resultData);
      
      if (resultData.quota) {
        setUsage(resultData.quota);
      } else {
        fetchUsage();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected query network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSearch = (term: string) => {
    setKeyword(term);
    // Fake event trigger
    setTimeout(() => {
      const mockForm = document.getElementById('search-form');
      if (mockForm) {
        mockForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  const exportToCSV = (title: string, dataArray: any[]) => {
    try {
      if (!dataArray || dataArray.length === 0) return;
      const headers = Object.keys(dataArray[0]).join(',');
      const rows = dataArray.map(obj => 
        Object.values(obj).map(val => {
          const stringified = String(val).replace(/"/g, '""');
          return `"${stringified}"`;
        }).join(',')
      );
      const csvStr = [headers, ...rows].join('\n');
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ranksyncer_${title.toLowerCase().replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('CSV generation failed');
    }
  };

  // Maps difficulty ranges to responsive color schemes
  const getDifficultyColor = (score: number) => {
    if (score < 30) return { text: 'text-emerald-500', bg: 'bg-emerald-50/50 border-emerald-100', progress: 'bg-emerald-500' };
    if (score < 50) return { text: 'text-amber-500', bg: 'bg-amber-50/50 border-amber-100', progress: 'bg-amber-500' };
    if (score < 75) return { text: 'text-orange-500', bg: 'bg-orange-50/50 border-orange-100', progress: 'bg-orange-500' };
    return { text: 'text-rose-500', bg: 'bg-rose-50/50 border-rose-100', progress: 'bg-rose-500' };
  };

  // Helper intent labeler
  const getIntentBadgeColor = (intent: string) => {
    switch (intent) {
      case 'Transactional':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Commercial':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Informational':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full bg-[#fafbfc] min-h-screen text-[#1b253b] pb-24">
      {/* Upper Context Header */}
      <div className="bg-white border-b border-gray-200/80 px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                Enterprise Tool Suite
              </span>
              {selectedProjectId && (
                <span className="text-xs text-gray-400">
                  targeting project: <strong className="text-gray-600">{projectName}</strong>
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600 fill-indigo-100" />
              Keyword Explorer
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Harvest real-time Google search volume, search metrics, related queries, content hubs, and detailed competitor outlines.
            </p>
          </div>

          {/* Credits Quota Widget */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Research Credits</div>
              {usage ? (
                <div className="text-lg font-bold text-slate-800">
                  {usage.creditsRemaining} <span className="text-xs text-gray-400 font-normal">/ {usage.creditsLimit} left</span>
                </div>
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400 mt-1" />
              )}
            </div>
            <button
              onClick={handleResetUsage}
              disabled={isResettingUsage}
              className="text-gray-500 hover:text-indigo-600 hover:bg-white border border-gray-200 hover:border-indigo-300 p-2.5 rounded-lg bg-slate-50 shadow-sm transition-all duration-150 disabled:opacity-50"
              title="Reset Search Quota Threshold for Testing"
            >
              <RefreshCw className={`w-4 h-4 ${isResettingUsage ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Workspace */}
      <div className="max-w-7xl mx-auto px-8 mt-8">
        
        {/* Search Parameter Section */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm mb-8">
          <form id="search-form" onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search input field */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter seed term (e.g. 'organic traffic', 'how to grill organic steak', 'weight loss keto')"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 hover:bg-slate-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl text-sm transition-all duration-150 placeholder-gray-400"
                  required
                />
              </div>

              {/* Advanced Target Filters */}
              <div className="flex flex-wrap gap-2.5">
                {/* Country List Selector */}
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="appearance-none font-medium text-xs bg-white border border-gray-200 hover:border-gray-300 px-4 py-3.5 pr-8 rounded-xl text-gray-700 shadow-sm transition-all cursor-pointer"
                  >
                    <option value="US">🇺🇸 United States (US)</option>
                    <option value="IN">🇮🇳 India (IN)</option>
                    <option value="GB">🇬🇧 United Kingdom (GB)</option>
                    <option value="CA">🇨🇦 Canada (CA)</option>
                    <option value="AU">🇦🇺 Australia (AU)</option>
                    <option value="DE">🇩🇪 Germany (DE)</option>
                    <option value="FR">🇫🇷 France (FR)</option>
                    <option value="JP">🇯🇵 Japan (JP)</option>
                  </select>
                </div>

                {/* Match Language Select */}
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="appearance-none font-medium text-xs bg-white border border-gray-200 hover:border-gray-300 px-4 py-3.5 pr-8 rounded-xl text-gray-700 shadow-sm transition-all cursor-pointer"
                  >
                    <option value="en">English (EN)</option>
                    <option value="es">Español (ES)</option>
                    <option value="de">Deutsch (DE)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="ja">日本語 (JA)</option>
                  </select>
                </div>

                {/* Device Type preference */}
                <div className="relative">
                  <select
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    className="appearance-none font-medium text-xs bg-white border border-gray-200 hover:border-gray-300 px-4 py-3.5 pr-8 rounded-xl text-gray-700 shadow-sm transition-all cursor-pointer"
                  >
                    <option value="desktop">Desktop Search</option>
                    <option value="mobile">Mobile Search</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-6 py-3.5 rounded-xl shadow-md shadow-indigo-100 transition-all duration-150 flex items-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Search Keyword
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Starter Terms */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-gray-400">
              <span className="font-medium text-gray-500">Popular ideas:</span>
              {['cheap organic backlinks', 'seo automation software', 'grow organic views', 'keyword search intent tracker'].map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickSearch(term)}
                  className="bg-slate-100 hover:bg-slate-200 hover:text-gray-700 border border-slate-200 text-gray-600 px-2.5 py-1 rounded-md transition-all font-medium"
                >
                  #{term}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Loading overlay panel */}
        {isLoading && (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-20 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-full animate-pulse transition-transform duration-300 mb-6">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing search intelligence...</h3>
            <p className="text-sm text-gray-500 max-w-md animate-fade-in">{loaderMessage}</p>
          </div>
        )}

        {/* Query error alert panel */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-sm flex items-start gap-4 mb-8">
            <div className="bg-rose-100 border border-rose-200 p-2 rounded-lg text-rose-700">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-rose-900">Query Unsuccessful</h3>
              <p className="text-sm text-rose-700 mt-1">{error}</p>
              {error.toLowerCase().includes('exhausted') && (
                <button
                  onClick={handleResetUsage}
                  className="text-xs bg-rose-200 hover:bg-rose-300 text-rose-900 px-3 py-1.5 rounded-lg font-semibold mt-4 transition-all"
                >
                  Reset Credit Limit for Free Testing
                </button>
              )}
            </div>
          </div>
        )}

        {/* Complete Search Results Dashboard layout */}
        {researchResult && (
          <div className="anim-fade-in space-y-8">
            
            {/* Core Metrics Bento Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Search Volume */}
              <div className="bg-white border border-gray-200/85 hover:border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Search Volume</span>
                  <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold tracking-tight text-slate-800">
                    {researchResult.searchVolume.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 block mt-1">Estimations per month</span>
                </div>
                <div className="h-1 bg-indigo-500 absolute bottom-0 left-0 right-0 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200" />
              </div>

              {/* Card 2: Keyword Difficulty */}
              {(() => {
                const colors = getDifficultyColor(researchResult.keywordDifficulty);
                return (
                  <div className="bg-white border border-gray-200/85 hover:border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty Rating</span>
                      <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" title="Difficulty level required to rank on page 1 of Google." />
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-2">
                      <span className={`text-4xl font-extrabold tracking-tight ${colors.text}`}>
                        {researchResult.keywordDifficulty}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">/ 100</span>
                    </div>
                    <div className="mt-3.5">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full ${colors.progress}`} style={{ width: `${researchResult.keywordDifficulty}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 block mt-1.5">
                        {researchResult.keywordDifficulty < 30 ? 'Easy-To-Target target' : researchResult.keywordDifficulty < 50 ? 'Moderate challenge' : 'Highly advanced difficulty'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Card 3: CPC & Value */}
              <div className="bg-white border border-gray-200/85 hover:border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">CPC (Cost Per Click)</span>
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">USD</span>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold tracking-tight text-slate-800">
                    ${researchResult.cpc ? researchResult.cpc.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-xs text-gray-400 block mt-1">Paid ad worth estimate</span>
                </div>
                <div className="h-1 bg-green-500 absolute bottom-0 left-0 right-0 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200" />
              </div>

              {/* Card 4: Search Intent */}
              <div className="bg-white border border-gray-200/85 hover:border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimated Intent</span>
                  <span className="text-xs text-gray-400 font-medium">Algorithmic</span>
                </div>
                <div className="mt-4">
                  <span className={`inline-block px-3.5 py-1 text-sm border font-semibold rounded-full ${getIntentBadgeColor(researchResult.intent)}`}>
                    {researchResult.intent}
                  </span>
                  <span className="text-xs text-gray-400 block mt-2.5">
                    {researchResult.intent === 'Informational' ? 'Seeks questions & tutorial answers' : 'Ready to buy or research brands'}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Charts and Trends Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Historical Trends chart */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Historical Search Traffic Trends</h3>
                    <p className="text-xs text-gray-400">Monthly breakdown for query word: "{researchResult.keyword}"</p>
                  </div>
                  <span className="text-xs bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-slate-600 font-medium">
                    12-Month Historical
                  </span>
                </div>

                <div className="h-64 mt-4 select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={researchResult.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: '12px', border: 'none', fontSize: '12px' }}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Area type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVol)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Column: AI Insights & Content Gaps using Gemini */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />
                
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-lg border border-indigo-500/30">
                      <Sparkles className="w-4 h-4 fill-indigo-400 text-indigo-400" />
                    </div>
                    <span className="text-xs text-indigo-300 font-semibold tracking-wider uppercase">AI Keyword Insights</span>
                  </div>

                  <h3 className="text-lg font-bold">Content Cluster Strategy</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-5">Generated by server-side Gemini 3.5-Flash model mapping context gaps</p>

                  {researchResult.aiInsights ? (
                    <div className="space-y-4">
                      {/* Easiest Related Variants */}
                      <div>
                        <div className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider mb-1.5">Easiest Rank-Building Targets:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {researchResult.aiInsights.easiestKeywords.map((kw, idx) => (
                            <span 
                              key={idx}
                              onClick={() => handleQuickSearch(kw)}
                              className="text-xs bg-slate-800/85 hover:bg-slate-700/80 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md cursor-pointer transition-all duration-150"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Content Gap gaps */}
                      <div>
                        <div className="text-[11px] text-amber-300 font-bold uppercase tracking-wider mb-1.5">Recommended Topic Gaps:</div>
                        <ul className="text-xs text-slate-300 space-y-1.5">
                          {researchResult.aiInsights.contentGapSuggestions.map((gap, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-indigo-400 font-bold">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Insights Paragraph */}
                      <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-4 leading-relaxed">
                        {researchResult.aiInsights.insightsText}
                      </div>

                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs py-8">Insights unavailable. Check GEMINI_API_KEY settings.</div>
                  )}
                </div>

                <div className="mt-6 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/60 pt-4">
                  <span>Processed with full schema</span>
                  <span>v1.0 active</span>
                </div>
              </div>
            </div>

            {/* Keyword Relations: Related Queries & Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Box 1: Related Keywords */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Semantic Related Keywords</h3>
                    <p className="text-xs text-gray-400">Terms closely matching queries</p>
                  </div>
                  <button
                    onClick={() => exportToCSV('Related_Terms', researchResult.relatedKeywords)}
                    className="text-xs text-gray-600 hover:text-indigo-600 border border-gray-200 bg-white hover:border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-500 border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-medium uppercase font-semibold">
                        <th className="pb-3 pt-2">Keyword Phrase</th>
                        <th className="pb-3 pt-2 text-right">Volume</th>
                        <th className="pb-3 pt-2 text-right">Difficult</th>
                        <th className="pb-3 pt-2 text-right">Intent</th>
                        <th className="pb-3 pt-2 text-right">Track</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {researchResult.relatedKeywords.map((related, i) => {
                        const isTracked = trackedKeywordTerms.includes(related.keyword.toLowerCase()) || !!justTrackedKeys[related.keyword.toLowerCase()];
                        return (
                          <tr key={i} className="hover:bg-slate-50/50 transition">
                            <td className="py-2.5 font-medium text-gray-800">
                              <button
                                onClick={() => handleQuickSearch(related.keyword)}
                                className="text-left hover:text-indigo-600 hover:underline transition"
                              >
                                {related.keyword}
                              </button>
                            </td>
                            <td className="py-2.5 text-right font-medium text-slate-700">
                              {related.searchVolume.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-right font-semibold">
                              <span className={getDifficultyColor(related.keywordDifficulty).text}>
                                {related.keywordDifficulty}%
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <span className="text-[10px] border border-slate-200 px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 font-medium">
                                {related.intent}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => {
                                  onTrackKeyword(related.keyword, related.searchVolume, related.keywordDifficulty, related.intent);
                                  setJustTrackedKeys(prev => ({ ...prev, [related.keyword.toLowerCase()]: true }));
                                }}
                                disabled={isTracked}
                                className={`p-1.5 border rounded-lg transition-all ${
                                  isTracked
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-not-allowed'
                                    : 'bg-white text-gray-600 hover:text-indigo-600 border-gray-200 hover:border-indigo-300'
                                }`}
                                title={isTracked ? "Already tracked in project portfolio" : "Start Tracking Rank Positions"}
                              >
                                {isTracked ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Box 2: Ask People Questions */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">People Also Ask (Questions)</h3>
                    <p className="text-xs text-gray-400">Valuable query phrases starting with question identifiers</p>
                  </div>
                  <button
                    onClick={() => exportToCSV('Questions', researchResult.questions)}
                    className="text-xs text-gray-600 hover:text-indigo-600 border border-gray-200 bg-white hover:border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-500 border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-medium uppercase font-semibold">
                        <th className="pb-3 pt-2">Question String</th>
                        <th className="pb-3 pt-2 text-right">Volume</th>
                        <th className="pb-3 pt-2 text-right">Intent</th>
                        <th className="pb-3 pt-2 text-right font-medium">Track</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {researchResult.questions.map((question, i) => {
                        const isTracked = trackedKeywordTerms.includes(question.keyword.toLowerCase()) || !!justTrackedKeys[question.keyword.toLowerCase()];
                        return (
                          <tr key={i} className="hover:bg-slate-50/50 transition">
                            <td className="py-2.5 font-medium text-gray-800">
                              <button
                                onClick={() => handleQuickSearch(question.keyword)}
                                className="text-left hover:text-indigo-600 hover:underline transition"
                              >
                                {question.keyword}
                              </button>
                            </td>
                            <td className="py-2.5 text-right font-medium text-slate-700">
                              {question.searchVolume.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-right">
                              <span className="text-[10px] border border-blue-200 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                                Informational
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => {
                                  onTrackKeyword(question.keyword, question.searchVolume, 30, 'Informational');
                                  setJustTrackedKeys(prev => ({ ...prev, [question.keyword.toLowerCase()]: true }));
                                }}
                                disabled={isTracked}
                                className={`p-1.5 border rounded-lg transition-all ${
                                  isTracked
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 cursor-not-allowed'
                                    : 'bg-white text-gray-600 hover:text-indigo-600 border-gray-200 hover:border-indigo-300'
                                }`}
                              >
                                {isTracked ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Deep SERP Competitor Overrides & Analysis */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Google Organic SERP Competitors (Page 1 Analysis)</h3>
                  <p className="text-xs text-gray-400">Detailed overview of top 10 ranked competitor articles</p>
                </div>
                <div className="text-xs text-slate-400">
                  Data source: <span className="font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">{researchResult.providerUsed}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-500 border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase">
                      <th className="pb-3 pt-2">Rank</th>
                      <th className="pb-3 pt-2">Target Page Information</th>
                      <th className="pb-3 pt-2 text-right">Est. Words</th>
                      <th className="pb-3 pt-2 text-right">Headings</th>
                      <th className="pb-3 pt-2 text-center">Authority Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {researchResult.serpResults.map((page, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="py-4 font-bold text-gray-400 text-center w-12 pb-3.5">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                            page.rank === 1 ? 'bg-amber-100 text-amber-800' : page.rank === 2 ? 'bg-slate-200 text-slate-800' : page.rank === 3 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {page.rank}
                          </span>
                        </td>
                        <td className="py-4 max-w-lg">
                          <div>
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline text-sm flex items-center gap-1 leading-snug"
                            >
                              {page.title}
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </a>
                            <span className="text-[10px] text-gray-400 font-medium block mt-1 uppercase tracking-wider">{page.domain}</span>
                            <p className="text-xs text-gray-400 mt-1 lines-clamp-2 leading-relaxed">{page.snippet}</p>
                          </div>
                        </td>
                        <td className="py-4 text-right font-medium text-slate-800">{page.wordCount?.toLocaleString() || '1,450'}</td>
                        <td className="py-4 text-right font-medium text-slate-800">{page.headingsCount || '18'}</td>
                        <td className="py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              page.authority === 'Elite' ? 'bg-rose-50 text-rose-700 border-rose-200' : page.authority === 'Great' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {page.authority}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1 font-medium">Domain Rating: {page.authorityScore}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
