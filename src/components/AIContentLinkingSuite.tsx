import React, { useState, useEffect } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Link as LinkIcon, 
  ExternalLink, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle, 
  Globe, 
  Sparkles, 
  FileText, 
  CornerDownRight, 
  Layers, 
  Search, 
  Plus, 
  Database, 
  Activity, 
  BookOpen, 
  Trash2, 
  CheckCircle2, 
  FileCheck, 
  Percent, 
  ChevronRight, 
  Terminal,
  Clock,
  ExternalLink as OutboundIcon
} from 'lucide-react';
import { Project, Article } from '../types';

interface LinkSuggestion {
  id: string;
  article_id: string;
  type: 'internal' | 'external';
  source_context?: string;
  target_url: string;
  anchor_text: string;
  relevance_score: number;
  confidence: number;
  anchor_type: string;
  status: 'pending' | 'approved' | 'rejected';
  section_title?: string;
}

interface CrawledPage {
  id: string;
  website_id: string;
  url: string;
  title: string;
  meta_description: string;
  word_count: number;
  headings_count: number;
  is_orphan: boolean;
  incoming_links_count: number;
  outgoing_links_count: number;
}

interface BrokenLink {
  id: string;
  source_url: string;
  target_url: string;
  err_type: string;
  found_at: string;
}

interface SitemapProfile {
  id: string;
  website_url: string;
  sitemap_url: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  pages_count: number;
  last_crawled_at: string;
  cms: string;
}

interface CrawlLogItem {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

interface AIContentLinkingSuiteProps {
  projectId: string;
  projects: Project[];
  articles: Article[];
  activeArticle?: Article | null;
  onUpdateContent?: (content: string) => void;
  theme?: 'light' | 'dark';
}

export function AIContentLinkingSuite({
  projectId,
  projects,
  articles,
  activeArticle,
  onUpdateContent,
  theme = 'light'
}: AIContentLinkingSuiteProps) {
  // Navigation tabs: 'dock' (for specific active article context) or 'site' (general sitemaps & audit list)
  const [activeTab, setActiveTab] = useState<'dock' | 'site'>('dock');

  // Multi-Site selectors
  const activeProject = projects.find(p => p.id === projectId) || projects[0];
  const [selectedSiteId, setSelectedSiteId] = useState<string>(activeProject?.id || 'p-1');

  // Search & Filter state for crawled pages
  const [crawlSearch, setCrawlSearch] = useState('');
  const [crawlFilter, setCrawlFilter] = useState<'all' | 'orphan' | 'linked'>('all');
  const [crawlPage, setCrawlPage] = useState(1);

  // States fetched from real service API
  const [sitemaps, setSitemaps] = useState<SitemapProfile[]>([]);
  const [crawledPages, setCrawledPages] = useState<CrawledPage[]>([]);
  const [brokenLinks, setBrokenLinks] = useState<BrokenLink[]>([]);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [crawlLogs, setCrawlLogs] = useState<CrawlLogItem[]>([]);
  
  // Interactive form state
  const [sitemapUrlInput, setSitemapUrlInput] = useState('');
  const [cmsPlatform, setCmsPlatform] = useState('wordpress');
  const [customPageUrl, setCustomPageUrl] = useState('');
  const [customPageTitle, setCustomPageTitle] = useState('');
  
  // Loading & Worker triggers
  const [isGenerativeWorkerLoading, setIsGenerativeWorkerLoading] = useState(false);
  const [isCrawlLoading, setIsCrawlLoading] = useState(false);
  const [isSuggestionGenerating, setIsSuggestionGenerating] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [apiSuccessMsg, setApiSuccessMsg] = useState<string | null>(null);

  // Editing Suggestion states
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null);
  const [editingAnchorText, setEditingAnchorText] = useState('');

  // Auto scroll terminal logs
  const terminalRef = React.useRef<HTMLDivElement>(null);

  // Fetch initial linkage profiles & states
  const loadLinkingSystem = async () => {
    try {
      setErrorNotice(null);
      // Get active brand profile first to fetch config from server
      const sitemapsRes = await fetch('/api/linking/sitemaps');
      const crawledRes = await fetch('/api/linking/crawlers-cache');
      const brokenRes = await fetch('/api/linking/broken');
      const analyticsRes = await fetch('/api/linking/analytics');

      if (sitemapsRes.ok) {
        const data = await sitemapsRes.json();
        setSitemaps(data.sitemaps || []);
      }
      if (crawledRes.ok) {
        const data = await crawledRes.json();
        setCrawledPages(data.pages || []);
      }
      if (brokenRes.ok) {
        const data = await brokenRes.json();
        setBrokenLinks(data.broken_links || []);
      }

      // If active article exists, fetch context-aware link Suggestions
      if (activeArticle) {
        const suggestionsRes = await fetch(`/api/linking/suggestions?articleId=${activeArticle.id}`);
        if (suggestionsRes.ok) {
          const suggestionsData = await suggestionsRes.json();
          setSuggestions(suggestionsData.suggestions || []);
        }
      }
    } catch (err) {
      console.error("Failed to connect with SEO Linking Engine services:", err);
      // Fallback preloads if API not initialized yet or in sandbox transition
      setErrorNotice("Backend engine connecting. Press Sync Sitemap to bootstrap your linking knowledge graph.");
    }
  };

  useEffect(() => {
    loadLinkingSystem();
  }, [selectedSiteId, activeArticle?.id]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [crawlLogs]);

  // Hook background worker listener for server events or check status repeatedly
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const checkCrawlJobProgress = async () => {
      const activeSyncs = sitemaps.some(s => s.status === 'syncing' || s.status === 'pending');
      if (activeSyncs) {
        try {
          const sitemapsRes = await fetch('/api/linking/sitemaps');
          if (sitemapsRes.ok) {
            const data = await sitemapsRes.json();
            setSitemaps(data.sitemaps || []);
          }
          const logsRes = await fetch('/api/linking/crawl-logs');
          if (logsRes.ok) {
            const logData = await logsRes.json();
            setCrawlLogs(logData.logs || []);
          }
          const crawledRes = await fetch('/api/linking/crawlers-cache');
          if (crawledRes.ok) {
            const data = await crawledRes.json();
            setCrawledPages(data.pages || []);
          }
        } catch (err) {
          console.warn("Error polling crawl background status nodes:", err);
        }
      }
    };

    timer = setInterval(checkCrawlJobProgress, 3000);
    return () => clearInterval(timer);
  }, [sitemaps]);

  // Trigger site crawlers XML / Fallback recursive links scraper
  const handleTriggerSitemapSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sitemapUrlInput) return;

    setIsCrawlLoading(true);
    setErrorNotice(null);
    setApiSuccessMsg(null);
    setCrawlLogs([
      { id: '1', timestamp: new Date().toLocaleTimeString(), type: 'info', message: `Initializing Link Crawler Daemon for sitemap: ${sitemapUrlInput}` },
      { id: '2', timestamp: new Date().toLocaleTimeString(), type: 'info', message: `Verifying robots.txt throttle safety standards...` }
    ]);

    try {
      const res = await fetch('/api/linking/sitemap/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sitemapUrl: sitemapUrlInput,
          projectId: selectedSiteId,
          cms: cmsPlatform
        })
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || "Gateway Crawler refused connection.");
      }

      const resData = await res.json();
      setApiSuccessMsg("Sync request queued! The system is crawling URL parameters and generating semantic content embeddings in the background.");
      
      // Clear input
      setSitemapUrlInput('');
      
      // Reload system structures
      loadLinkingSystem();

    } catch (err: any) {
      setErrorNotice(err.message || "Failed to start background site indexing sync.");
    } finally {
      setIsCrawlLoading(false);
    }
  };

  // Add individual page manually fallback helper
  const handleAddCustomPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPageUrl || !customPageTitle) return;

    try {
      setErrorNotice(null);
      const res = await fetch('/api/linking/page/add-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedSiteId,
          url: customPageUrl,
          title: customPageTitle
        })
      });

      if (res.ok) {
        setApiSuccessMsg("Custom indexed page registered into sitemap graph cache!");
        setCustomPageUrl('');
        setCustomPageTitle('');
        loadLinkingSystem();
      } else {
        throw new Error("Unable to manually record custom URL indexing coordinates.");
      }
    } catch (err: any) {
      setErrorNotice(err.message);
    }
  };

  // Generate Article-Specific Semantic Links via Gemini AI models
  const handleGenerateAISuggestions = async () => {
    if (!activeArticle) return;
    
    setIsSuggestionGenerating(true);
    setErrorNotice(null);
    setApiSuccessMsg(null);

    try {
      const res = await fetch('/api/linking/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: activeArticle.id,
          content: activeArticle.content,
          title: activeArticle.title,
          targetKeyword: activeArticle.targetKeyword,
          projectId: activeArticle.projectId
        })
      });

      if (!res.ok) {
        const errorJson = await res.json();
        // Prompt paid API user flow if key restrictions or model config calls it
        if (res.status === 402) {
          throw new Error("Sitemap indexing graph is currently empty. Please register or sync a sitemap first so there are pages to link to!");
        }
        throw new Error(errorJson.error || "Linking generator failed execution logic.");
      }

      const resData = await res.json();
      setSuggestions(resData.suggestions || []);
      setApiSuccessMsg(`Injected semantic link suggestions! Generated ${resData.suggestions?.length || 0} linking options.`);

    } catch (err: any) {
      setErrorNotice(err.message || "Connection failure with semantic NLP processors.");
    } finally {
      setIsSuggestionGenerating(false);
    }
  };

  // Edit suggested anchor manually in editor
  const handleStartEditingAnchor = (sug: LinkSuggestion) => {
    setEditingSuggestionId(sug.id);
    setEditingAnchorText(sug.anchor_text);
  };

  const handleSaveEditedAnchor = async (id: string) => {
    if (!editingAnchorText) return;
    
    // Update local suggest mapping
    setSuggestions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, anchor_text: editingAnchorText };
      }
      return s;
    }));

    setEditingSuggestionId(null);
  };

  // Action: Approve suggested SEO link and execute injection into the actual article body!
  const handleApplySuggestionAction = async (suggestion: LinkSuggestion, action: 'approve' | 'reject') => {
    if (!activeArticle) return;

    try {
      setErrorNotice(null);
      const res = await fetch('/api/linking/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: activeArticle.id,
          suggestionId: suggestion.id,
          action,
          anchorText: suggestion.anchor_text, // Pass current possibly edited anchor text
          targetUrl: suggestion.target_url
        })
      });

      if (!res.ok) {
        throw new Error("Could not apply link action metadata state.");
      }

      const resData = await res.json();

      // If approved, the server returns the updated article markdown contents!
      if (action === 'approve' && resData.updatedContent && onUpdateContent) {
        onUpdateContent(resData.updatedContent);
        setApiSuccessMsg(`Successfully inserted link: [${suggestion.anchor_text}](${suggestion.target_url}) seamlessly into prose!`);
      }

      // Update local suggestion array state
      setSuggestions(prev => prev.map(s => {
        if (s.id === suggestion.id) {
          return { ...s, status: action === 'approve' ? 'approved' : 'rejected' };
        }
        return s;
      }));

    } catch (err: any) {
      setErrorNotice(err.message || "Could not insert anchor elements into current workspace memory.");
    }
  };

  // Delete crawler indexed page metadata
  const handleDeleteCrawledPage = async (pageId: string) => {
    try {
      const res = await fetch(`/api/linking/page/delete/${pageId}`, { method: 'DELETE' });
      if (res.ok) {
        setCrawledPages(prev => prev.filter(p => p.id !== pageId));
        setApiSuccessMsg("URL page records ejected from knowledge database cache.");
      }
    } catch {
      setErrorNotice("Eject failure.");
    }
  };

  // Helper values: link density diagnostics
  const calculateLinkStatistics = () => {
    if (!activeArticle) return { totalWordCount: 0, densityPercent: 0, status: 'none', count: 0 };
    
    // Count exact markdown link markers [anchor](url) in article.content
    const linkMatches = activeArticle.content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    const linkCount = linkMatches.length;
    const words = activeArticle.wordCount || activeArticle.content.split(/\s+/).length || 1;
    
    // Optimal is roughly 1-2 links per 400 words
    // Let's say: < 1 low, 1-4 standard/good, > 5 spam risk
    const scoreVal = (linkCount / words) * 1000; // links per 1000 words
    
    let statusText: 'low' | 'good' | 'high' = 'low';
    if (scoreVal >= 1 && scoreVal <= 7) statusText = 'good';
    if (scoreVal > 7) statusText = 'high';

    return {
      count: linkCount,
      words,
      densityValue: scoreVal.toFixed(1),
      status: statusText
    };
  };

  const linkStats = calculateLinkStatistics();

  // Filter crawled sitemap pages
  const displayedCrawledPages = crawledPages
    .filter(p => p.website_id === selectedSiteId)
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(crawlSearch.toLowerCase()) || 
                            p.url.toLowerCase().includes(crawlSearch.toLowerCase());
      if (crawlFilter === 'orphan') return matchesSearch && p.is_orphan;
      if (crawlFilter === 'linked') return matchesSearch && p.incoming_links_count > 0;
      return matchesSearch;
    });

  const parsedPagesPerPage = 5;
  const totalPagesCount = Math.ceil(displayedCrawledPages.length / parsedPagesPerPage) || 1;
  const paginatedCachedPages = displayedCrawledPages.slice(
    (crawlPage - 1) * parsedPagesPerPage, 
    crawlPage * parsedPagesPerPage
  );

  return (
    <div className="w-full space-y-6 font-sans">
      
      {/* Brand Suite Alert Notification Banner */}
      <AnimatePresence>
        {errorNotice && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 text-rose-800 text-xs font-semibold"
          >
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
            <div className="flex-1">
              <span>{errorNotice}</span>
            </div>
            <button onClick={() => setErrorNotice(null)} className="text-rose-400 hover:text-rose-700 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {apiSuccessMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center space-x-3 text-emerald-800 text-xs font-semibold"
          >
            <FileCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <span>{apiSuccessMsg}</span>
            </div>
            <button onClick={() => setApiSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-700 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Section Actions: Site switcher & Module Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <LinkIcon className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">AI Semantic Linking Engine</h1>
          </div>
          <p className="text-xs text-slate-500">
            Automatically discover crawl structures, cache sitemaps, and insert authority reference anchors with Gemini Pro.
          </p>
        </div>

        {/* Website context selector with multi-tenancy isolation */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Website:</label>
          <select
            value={selectedSiteId}
            onChange={(e) => {
              setSelectedSiteId(e.target.value);
              setCrawlPage(1);
            }}
            className="bg-slate-50 border border-slate-200 outline-none rounded-xl text-xs font-bold py-2 px-3 focus:ring-1 focus:ring-indigo-500 text-slate-800 cursor-pointer"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.domain})</option>
            ))}
          </select>

          <button 
            onClick={loadLinkingSystem}
            className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors cursor-pointer text-slate-500"
            title="Refresh Knowledge Graphs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary tab switcher */}
      <div className="flex space-x-1 p-1 bg-slate-100 rounded-2xl max-w-sm">
        <button
          onClick={() => setActiveTab('dock')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'dock' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Article Linker Dock</span>
        </button>
        <button
          onClick={() => setActiveTab('site')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'site' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>Sitemap Knowledge Graph</span>
        </button>
      </div>

      {/* Main Layout Views */}
      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* VIEW A: INTERACTIVE LINKING DOCK (Scoped to Active Article) */}
        {/* ========================================================= */}
        {activeTab === 'dock' && (
          <motion.div
            key="dock"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {!activeArticle ? (
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center space-y-4">
                <FileText className="h-12 w-12 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-700 text-sm">No Active Article Selected</h3>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto">
                    Select an article in the Content Writer or Content Planner first, then toggle AI Visuals or Linking tab to optimize!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side inputs / SEO Score details */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Article SEO link density diagnostics */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-3xs space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                      <Activity className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Link Density Status</span>
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-3xl font-black text-slate-900">{linkStats.count}</p>
                          <p className="text-slate-400 text-[10px] font-bold">Active Anchor Links Injected</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md ${
                            linkStats.status === 'good' ? 'bg-emerald-50 text-emerald-700' :
                            linkStats.status === 'high' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {linkStats.status === 'good' ? 'Optimal Range' : linkStats.status === 'high' ? 'Spam Alert Risk' : 'Underlinked'}
                          </span>
                        </div>
                      </div>

                      {/* Visual gauge line */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          linkStats.status === 'good' ? 'bg-emerald-500 w-[60%]' :
                          linkStats.status === 'high' ? 'bg-rose-500 w-full' : 'bg-slate-300 w-[20%]'
                        }`} />
                      </div>

                      <div className="text-[11px] font-semibold text-slate-450 leading-relaxed space-y-1.5">
                        <p>💡 Current words: <strong className="text-slate-800">{linkStats.words}</strong></p>
                        <p>📈 Density score: <strong className="text-slate-800">{linkStats.densityValue}</strong> links/k words.</p>
                      </div>
                    </div>
                  </div>

                  {/* Anchor Safety Rules list */}
                  <div className="bg-slate-900 rounded-3xl p-6 text-slate-300 space-y-4">
                    <h3 className="text-xs font-black uppercase text-amber-400 tracking-widest flex items-center space-x-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <span>SEO Crawlablity Rules</span>
                    </h3>

                    <ul className="space-y-2.5 text-xs text-slate-300 font-semibold font-sans">
                      <li className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Maximum of 1 link per 300 words to avoid crawl loops.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Skip headings (`#`, `##`) & code blocks.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Vary anchors naturally using semantic partial-matches.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Link high authority `.gov`, `.edu` or Wikipedia reference nodes.</span>
                      </li>
                    </ul>
                  </div>

                </div>

                {/* Right side suggestions cards list */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Generation Trigger Call to Action */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-3xs flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center md:text-left">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center justify-center md:justify-start space-x-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        <span>Generate Semantic Link Suggestions</span>
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold">
                        Gemini maps your article sections against crawled sitemaps to optimize anchor injection.
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateAISuggestions}
                      disabled={isSuggestionGenerating}
                      className="bg-indigo-600 outline-none hover:bg-indigo-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50 inline-shrink-0"
                    >
                      {isSuggestionGenerating ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Embedding Sections...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Index & Generate Suggerences</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Suggestions cards lists */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
                        AI Suggested Anchors ({suggestions.length})
                      </h3>
                      
                      <div className="flex space-x-2 text-[10px]">
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md">Internal Link</span>
                        <span className="bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-md">Outbound Reference</span>
                      </div>
                    </div>

                    {suggestions.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-150 rounded-3xl p-12 text-center space-y-3">
                        <LinkIcon className="h-10 w-10 text-slate-300 mx-auto" />
                        <p className="text-slate-500 text-xs font-bold max-w-sm mx-auto">
                          No suggestion records found for this draft folder. Run index scanner above to fetch semantic pairings!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {suggestions.map((sug) => {
                          const isInternal = sug.type === 'internal';
                          const isApproved = sug.status === 'approved';
                          const isRejected = sug.status === 'rejected';

                          return (
                            <div 
                              key={sug.id} 
                              className={`bg-white rounded-2xl border p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                isApproved ? 'border-emerald-250 bg-emerald-50/10' :
                                isRejected ? 'border-slate-200 opacity-60' : 'border-slate-150 hover:border-slate-300'
                              }`}
                            >
                              
                              {/* Left Anchor contexts and URL info */}
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center space-x-2">
                                  {/* Badge type */}
                                  <span className={`text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-md ${
                                    isInternal ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'
                                  }`}>
                                    {isInternal ? 'Internal Link' : 'External Authourity'}
                                  </span>

                                  {/* Semantic certainty score */}
                                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md flex items-center space-x-1">
                                    <span>Match Score:</span>
                                    <strong className="text-indigo-600 font-mono">{(sug.relevance_score * 100).toFixed(0)}%</strong>
                                  </span>

                                  {sug.anchor_type && (
                                    <span className="text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-1 rounded">
                                      {sug.anchor_type}
                                    </span>
                                  )}
                                </div>

                                {/* Matching Anchor editor/displayer */}
                                <div className="space-y-1">
                                  {editingSuggestionId === sug.id ? (
                                    <div className="flex items-center space-x-2 mt-1">
                                      <input
                                        type="text"
                                        value={editingAnchorText}
                                        onChange={(e) => setEditingAnchorText(e.target.value)}
                                        className="bg-slate-50 border border-slate-200 outline-none text-xs font-bold py-1 px-2.5 rounded-md text-slate-800"
                                      />
                                      <button 
                                        onClick={() => handleSaveEditedAnchor(sug.id)}
                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                      >
                                        <Check className="h-4.5 w-4.5" />
                                      </button>
                                      <button 
                                        onClick={() => setEditingSuggestionId(null)}
                                        className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                                      >
                                        <X className="h-4.5 w-4.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1 flex-wrap">
                                      <span className="text-xs text-slate-500 font-semibold">Prose text:</span>
                                      <span className="text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-100 px-1 py-0.5 rounded">
                                        "{sug.anchor_text}"
                                      </span>
                                      {!isApproved && !isRejected && (
                                        <button 
                                          onClick={() => handleStartEditingAnchor(sug)}
                                          className="text-[10px] text-indigo-500 hover:underline cursor-pointer ml-1"
                                        >
                                          (Edit phrase)
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  {/* URL context */}
                                  <div className="flex items-center space-x-1.5 text-xs">
                                    <span className="text-slate-400 font-bold">Target:</span>
                                    <a 
                                      href={sug.target_url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-indigo-600 font-mono hover:underline font-bold break-all flex items-center space-x-1 text-[11px]"
                                    >
                                      <span>{sug.target_url}</span>
                                      <ExternalLink className="h-3 w-3 inline shrink-0" />
                                    </a>
                                  </div>
                                </div>

                                {/* Surround sentence context */}
                                {sug.source_context && (
                                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-sans mt-2">
                                    "... {sug.source_context} ..."
                                  </p>
                                )}
                              </div>

                              {/* Right interactive Action Controllers */}
                              <div className="flex items-center space-x-2 border-t md:border-t-0 pt-2 md:pt-0 shrink-0">
                                {isApproved ? (
                                  <span className="bg-emerald-50 text-emerald-700 font-black text-xs py-1.5 px-3 rounded-xl flex items-center space-x-1 border border-emerald-100">
                                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                                    <span>Inserted</span>
                                  </span>
                                ) : isRejected ? (
                                  <span className="bg-slate-100 text-slate-500 font-bold text-xs py-1.5 px-3 rounded-xl">
                                    Rejected
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleApplySuggestionAction(sug, 'reject')}
                                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                                      title="Reject integration"
                                    >
                                      <X className="h-5 w-5" />
                                    </button>
                                    <button
                                      onClick={() => handleApplySuggestionAction(sug, 'approve')}
                                      className="bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 font-black text-xs py-2 px-4 rounded-xl cursor-pointer transition-colors flex items-center space-x-1"
                                    >
                                      <Plus className="h-4 w-4" />
                                      <span>Approve & Write Link</span>
                                    </button>
                                  </>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW B: GENERAL WEBSITE SITEMAP & LINK AUDITING DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'site' && (
          <motion.div
            key="site"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            
            {/* Sitemap Register Form & Active crawler status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Add sitemap block */}
              <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-3xs space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                    <Globe className="h-4.5 w-4.5 text-indigo-600" />
                    <span>Sync New Sitemap</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    Input a direct sitemap xml link (e.g., https://site.com/sitemap.xml) or root URL fallback.
                  </p>
                </div>

                <form onSubmit={handleTriggerSitemapSync} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Sitemap/Website URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://ranksyncer.com/sitemap.xml"
                      value={sitemapUrlInput}
                      onChange={(e) => setSitemapUrlInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 outline-none p-3 rounded-xl text-xs font-bold font-mono focus:border-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">CMS CMS Type Adapter</label>
                    <select
                      value={cmsPlatform}
                      onChange={(e) => setCmsPlatform(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 outline-none p-3 rounded-xl text-xs font-bold focus:border-indigo-500 text-slate-805 cursor-pointer"
                    >
                      <option value="wordpress">WordPress (Auto XML)</option>
                      <option value="shopify">Shopify Blogs API Parser</option>
                      <option value="webflow">Webflow Engine Sitemap</option>
                      <option value="ghost">Ghost CMS feed URL</option>
                      <option value="custom">Custom Site (Recursive fallback)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isCrawlLoading}
                    className="w-full bg-slate-900 border border-slate-800 text-white hover:bg-slate-850 font-black text-xs py-3 rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                  >
                    {isCrawlLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Querying Ingress DNS...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Enqueue Sitemap Scanner</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Sub: Manual URL Indexed entry */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-700">Add Page Manually</h4>
                    <p className="text-[10px] text-slate-400">Can't easily read sitemap? Force index any individual URL.</p>
                  </div>

                  <form onSubmit={handleAddCustomPage} className="space-y-2">
                    <input
                      type="url"
                      required
                      placeholder="https://domain.com/blog/topic"
                      value={customPageUrl}
                      onChange={(e) => setCustomPageUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 outline-none py-2 px-3 rounded-lg text-xs font-mono focus:border-indigo-500 text-slate-800"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Page Heading / Keyword Title"
                      value={customPageTitle}
                      onChange={(e) => setCustomPageTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-150 outline-none py-2 px-3 rounded-lg text-xs focus:border-indigo-500 text-slate-805"
                    />
                    <button
                      type="submit"
                      className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 rounded-lg text-xs font-bold tracking-tight cursor-pointer cursor-transform active:scale-95 transition-transform"
                    >
                      Register Single Page Coordinates
                    </button>
                  </form>
                </div>

              </div>

              {/* Crawl console screen output */}
              <div className="lg:col-span-2 bg-slate-950 text-slate-300 rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[350px]">
                {/* Simulated console panel bar */}
                <div className="p-4 bg-slate-900 border-b border-slate-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500 animate-pulse" />
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="font-mono text-[11px] font-black text-slate-400 ml-2">ranksyncer-crawler-process-daemon.sh</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Live Queue logs</span>
                </div>

                {/* Console logs list */}
                <div ref={terminalRef} className="p-4 flex-1 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-2">
                  <p className="text-indigo-400">[DAEMON STATUS] SYSTEM READY FOR WEB CRAWL QUEUES INCOMING REQUESTS</p>
                  <p className="text-slate-500">---------------------------------------------------------------</p>
                  
                  {crawlLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-10 text-slate-600">
                      <span>No active job thread running. Queue a sitemap synchronization scanner to inspect realtime activity logs.</span>
                    </div>
                  ) : (
                    crawlLogs.map(log => (
                      <div key={log.id} className="flex items-start space-x-2">
                        <span className="text-[10px] text-zinc-500 shrink-0 font-bold">[{log.timestamp}]</span>
                        <span className={`font-semibold ${
                          log.type === 'error' ? 'text-rose-500 font-extrabold' :
                          log.type === 'warn' ? 'text-amber-500' :
                          log.type === 'success' ? 'text-emerald-400' : 'text-slate-350'
                        }`}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Active site registry summary statistics table row footer */}
                <div className="p-4 border-t border-slate-900 bg-slate-900/60 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sitemaps.map(s => (
                    <div key={s.id} className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500 font-sans tracking-wide">Sync State</p>
                      <div className="flex items-center space-x-1.5">
                        <span className={`h-2 w-2 rounded-full ${
                          s.status === 'completed' ? 'bg-emerald-500' :
                          s.status === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                        }`} />
                        <span className="font-mono text-xs font-black text-slate-200">{s.status.toUpperCase()}</span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 font-bold truncate" title={s.sitemap_url}>{s.sitemap_url}</p>
                    </div>
                  ))}
                  {sitemaps.length === 0 && (
                    <div className="col-span-4 text-center py-2">
                      <span className="text-[10px] font-mono text-slate-500">No active crawl profiles. Sync a website today!</span>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Sitemap knowledge links explorer table and sorting layout */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden">
              <div className="p-6 border-b border-indigo-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm">Indexed Sitemap Knowledge Graph ({displayedCrawledPages.length} active pages)</h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    Review and modify pages found by crawlers that can be used for deep semantic link anchors.
                  </p>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search query block */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter URLs or keywords..."
                      value={crawlSearch}
                      onChange={(e) => {
                        setCrawlSearch(e.target.value);
                        setCrawlPage(1);
                      }}
                      className="bg-slate-50 border border-slate-200 py-1.5 pl-8 pr-3 outline-none text-xs rounded-xl text-slate-800 focus:ring-1 focus:ring-indigo-505 font-bold"
                    />
                  </div>

                  {/* Segment controller */}
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-100 text-xs">
                    <button
                      onClick={() => { setCrawlFilter('all'); setCrawlPage(1); }}
                      className={`px-3 py-1 font-bold rounded-lg transition-colors cursor-pointer ${
                        crawlFilter === 'all' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => { setCrawlFilter('orphan'); setCrawlPage(1); }}
                      className={`px-3 py-1 font-bold rounded-lg transition-colors cursor-pointer ${
                        crawlFilter === 'orphan' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Orphans ({crawledPages.filter(p => p.is_orphan).length})
                    </button>
                    <button
                      onClick={() => { setCrawlFilter('linked'); setCrawlPage(1); }}
                      className={`px-3 py-1 font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                        crawlFilter === 'linked' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Linked</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Crawled URL table mapping */}
              {paginatedCachedPages.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Database className="h-10 w-10 text-slate-200 mx-auto" />
                  <p className="text-xs font-semibold">No URL index files match the active filters or search terms.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-6">Page Title & Content Snippet</th>
                        <th className="py-3 px-4">Canonical Link Address</th>
                        <th className="py-3 px-4 text-center">Word Count/Headings</th>
                        <th className="py-3 px-4 text-center">Incoming Anchor Density</th>
                        <th className="py-3 px-4 text-center">Orphan State</th>
                        <th className="py-3 px-6 text-center">Eject Link Map</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {paginatedCachedPages.map((page) => (
                        <tr key={page.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 space-y-1 max-w-[280px]">
                            <p className="font-extrabold text-slate-850 truncate leading-tight">{page.title}</p>
                            <p className="text-[10px] text-slate-400 truncate leading-snug">{page.meta_description || "No description tags cached for this route"}</p>
                          </td>
                          <td className="py-4 px-4 font-mono text-[11px] text-slate-500 max-w-[200px] truncate" title={page.url}>
                            <a href={page.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center space-x-1 text-indigo-600">
                              <span>{page.url}</span>
                              <ExternalLink className="h-3 w-3 inline shrink-0" />
                            </a>
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-slate-600 leading-tight">
                            <div>{page.word_count || 1200} words</div>
                            <div className="text-[10px] text-slate-450">{page.headings_count || 8} tag headers</div>
                          </td>
                          <td className="py-4 px-4 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded-lg font-black text-[10px] ${
                              page.incoming_links_count > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-pink-50 text-pink-700'
                            }`}>
                              {page.incoming_links_count} references
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center font-bold">
                            {page.is_orphan ? (
                              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100">
                                ORPHAN ALERT
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-extrabold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100">
                                INTERNAL SYNCED
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => handleDeleteCrawledPage(page.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Delete from knowledge index"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {totalPagesCount > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between font-sans">
                  <span className="text-xs text-slate-400 font-semibold">
                    Showing page <strong className="text-slate-750">{crawlPage}</strong> of <strong className="text-slate-750">{totalPagesCount}</strong> ({displayedCrawledPages.length} links index cached)
                  </span>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCrawlPage(p => Math.max(1, p - 1))}
                      disabled={crawlPage === 1}
                      className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCrawlPage(p => Math.min(totalPagesCount, p + 1))}
                      disabled={crawlPage === totalPagesCount}
                      className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Downstream warnings details box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box 1: Verified Internal Link Opportunities */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
                    <Percent className="h-4.5 w-4.5 text-indigo-500" />
                    <span>Humble Linking Opportunities Dashboard</span>
                  </h4>
                  <span className="text-[10px] uppercase font-black tracking-widest text-indigo-605">Audit summary</span>
                </div>

                <div className="space-y-3.5">
                  <p className="text-xs text-slate-505 font-medium leading-relaxed">
                    Automated crawler verified that <strong className="text-indigo-605">{crawledPages.filter(p => p.is_orphan).length} pages</strong> are current orphan blocks (have no incoming anchors). These are missing vital crawl juices! Improve authority loops by drafting articles targeted at linking these directly.
                  </p>

                  <div className="space-y-2 text-xs">
                    {crawledPages.filter(p => p.is_orphan).slice(0, 3).map(page => (
                      <div key={page.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-extrabold text-slate-750 truncate">{page.title}</p>
                          <p className="text-[10px] text-indigo-500 truncate">{page.url}</p>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-800 font-extrabold px-2 py-0.5 rounded leading-tight">
                          Needs Incoming Link
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 2: Broken Reference Warnings link logs tracker */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
                    <span>Broken Anchor Warnings & Redirect Loops</span>
                  </h4>
                  <span className="text-[10px] uppercase font-black tracking-widest text-rose-550">Crawler Alerts</span>
                </div>

                <div className="space-y-3.5">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    SEO safety protocols scanned local assets to intercept dead anchors or loops that cause penalization.
                  </p>

                  {brokenLinks.length === 0 ? (
                    <div className="flex items-center space-x-1.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-emerald-800 text-xs font-semibold">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span>Zero dead anchor destinations found! Outstanding crawl health status.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {brokenLinks.map(b => (
                        <div key={b.id} className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs flex justify-between gap-3 items-start">
                          <div className="space-y-1">
                            <p className="font-extrabold text-rose-900 leading-tight">Dead Endpoint target detected!</p>
                            <p className="text-[10px] font-mono text-slate-450 break-all">{b.target_url}</p>
                          </div>
                          <span className="text-[9px] uppercase tracking-widest bg-rose-100 text-rose-700 px-1.5 rounded font-black mt-0.5">
                            {b.err_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}

export default AIContentLinkingSuite;
