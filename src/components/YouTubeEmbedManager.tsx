import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Settings, 
  Sparkles, 
  Trash2, 
  RotateCcw, 
  Share2, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BarChart4, 
  Eye, 
  Sliders, 
  Plus, 
  Search, 
  Tv, 
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  ThumbsUp,
  Terminal,
  HelpCircle,
  FileText,
  Video
} from 'lucide-react';
import { Article } from '../types';

interface YouTubeEmbedManagerProps {
  article: Article;
  onUpdateContent: (newContent: string) => void;
  theme?: string;
}

interface ArticleVideo {
  id: string;
  article_id: string;
  youtube_video_id: string;
  title: string;
  embed_url: string;
  relevance_score: number;
  inserted_position: string;
  heading_text?: string;
  view_count?: string;
  channel_title?: string;
  duration?: string;
  published_at?: string;
  thumbnail_url?: string;
  created_at: string;
}

interface SearchedVideo {
  youtube_video_id: string;
  title: string;
  view_count: string;
  channel_title: string;
  duration: string;
  published_at: string;
  thumbnail_url: string;
  is_clickbait?: boolean;
  is_non_english?: boolean;
  original_relevance_score?: number;
}

interface EmbedLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export function YouTubeEmbedManager({ article, onUpdateContent, theme }: YouTubeEmbedManagerProps) {
  // Config state
  const [autoEmbed, setAutoEmbed] = useState<boolean>(true);
  const [maxEmbeds, setMaxEmbeds] = useState<number>(2);
  const [minWords, setMinWords] = useState<number>(800);
  const [strictness, setStrictness] = useState<'low' | 'high'>('high');

  // Interactive items state
  const [embeds, setEmbeds] = useState<ArticleVideo[]>([]);
  const [logs, setLogs] = useState<EmbedLog[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    totalEmbeds: 0,
    videoCtrPercent: 4.8,
    dwellTimeSeconds: 195,
    engagementImprovementPercent: 15.6,
    usageFrequencyPercent: 50
  });

  // UI state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchedVideo[]>([]);
  const [manualHeadingTarget, setManualHeadingTarget] = useState<string>('');
  const [transcriptVideoId, setTranscriptVideoId] = useState<string | null>(null);
  const [transcriptSummary, setTranscriptSummary] = useState<string>('');
  const [isLoadingTranscript, setIsLoadingTranscript] = useState<boolean>(false);

  // Replacement modal state for individual embeds
  const [replacingEmbedId, setReplacingEmbedId] = useState<string | null>(null);
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [replaceResults, setReplaceResults] = useState<SearchedVideo[]>([]);
  const [isReplacingSearch, setIsReplacingSearch] = useState<boolean>(false);

  // Article headings parsed list
  const [articleHeadings, setArticleHeadings] = useState<string[]>([]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Parse headings out of markdown article text
  useEffect(() => {
    if (article && article.content) {
      const lines = article.content.split('\n');
      const foundHeadings: string[] = [];
      lines.forEach(line => {
        if (line.startsWith('## ') || line.startsWith('### ')) {
          foundHeadings.push(line.replace(/^(##|###)\s+/, '').trim());
        }
      });
      setArticleHeadings(foundHeadings);
    }
  }, [article]);

  // Read config & embeds
  const fetchData = async () => {
    try {
      // 1. Config
      const configRes = await fetch('/api/youtube/config');
      const configData = await configRes.json();
      if (configData.success && configData.config) {
        setAutoEmbed(configData.config.auto_embed_enabled);
        setMaxEmbeds(configData.config.max_embeds_per_article);
        setMinWords(configData.config.min_word_count_per_embed);
        setStrictness(configData.config.moderation_strictness);
      }

      // 2. Embeds for this article
      const embedsRes = await fetch(`/api/youtube/embeds?articleId=${article.id}`);
      const embedsData = await embedsRes.json();
      if (embedsData.success) {
        setEmbeds(embedsData.embeds);
      }

      // 3. Analytics
      const analyticsRes = await fetch('/api/youtube/analytics');
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData);
      }

      // 4. Logs
      const logsRes = await fetch('/api/youtube/logs');
      const logsData = await logsRes.json();
      if (logsData.success) {
        setLogs(logsData.logs);
      }
    } catch (err) {
      console.error("Error reading YouTube embedding database states:", err);
    }
  };

  useEffect(() => {
    if (article) {
      fetchData();
    }
  }, [article.id]);

  // Scroll terminal logs to bottom automatically
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Save Config update helper
  const handleSaveConfig = async (newAuto: boolean, newMax: number, newMin: number, newStrict: 'low' | 'high') => {
    try {
      const res = await fetch('/api/youtube/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auto_embed_enabled: newAuto,
          max_embeds_per_article: newMax,
          min_word_count_per_embed: newMin,
          moderation_strictness: newStrict
        })
      });
      const data = await res.json();
      if (data.success) {
        setAutoEmbed(data.config.auto_embed_enabled);
        setMaxEmbeds(data.config.max_embeds_per_article);
        setMinWords(data.config.min_word_count_per_embed);
        setStrictness(data.config.moderation_strictness);
      }
    } catch (err) {
      console.error("Failed saving config parameters:", err);
    }
  };

  // Run automated auto-embed pipeline
  const handleRunAutoEmbed = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/youtube/auto-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          content: article.content,
          title: article.title,
          targetKeyword: article.targetKeyword || article.title
        })
      });
      const data = await res.json();
      if (data.success) {
        onUpdateContent(data.updatedContent);
        // Refresh local items
        setTimeout(() => {
          fetchData();
          setIsProcessing(false);
        }, 1500);
      } else {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error("Failed executing automated embed pipeline:", err);
      setIsProcessing(false);
    }
  };

  // Extract Summary Synopsis via Gemini
  const handleViewSynopsis = async (videoId: string, vTitle: string) => {
    setTranscriptVideoId(videoId);
    setIsLoadingTranscript(true);
    setTranscriptSummary('');
    try {
      const res = await fetch('/api/youtube/extract-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, title: vTitle })
      });
      const data = await res.json();
      if (data.success) {
        setTranscriptSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed obtaining synopsis summary:", err);
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  // Search manual video results
  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, keyword: article.targetKeyword })
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.videos);
      }
    } catch (err) {
      console.error("Failed executing video search query:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Replace search trigger
  const handleReplaceSearch = async () => {
    if (!replaceQuery.trim()) return;
    setIsReplacingSearch(true);
    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: replaceQuery })
      });
      const data = await res.json();
      if (data.success) {
        setReplaceResults(data.videos);
      }
    } catch (err) {
      console.error("Failed search query for replacement:", err);
    } finally {
      setIsReplacingSearch(false);
    }
  };

  // Embed chosen manual search video
  const handleEmbedChosenVideo = async (video: SearchedVideo) => {
    try {
      const headingLoc = manualHeadingTarget || (articleHeadings[0] ? `After H2: ${articleHeadings[0]}` : "Manual Insert");
      const headingClean = headingLoc.replace("After H2: ", "").trim();

      const res = await fetch('/api/youtube/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          youtubeVideoId: video.youtube_video_id,
          title: video.title,
          relevanceScore: video.original_relevance_score || 0.90,
          insertedPosition: headingLoc,
          headingText: headingClean,
          viewCount: video.view_count,
          channelTitle: video.channel_title,
          duration: video.duration,
          thumbnailUrl: video.thumbnail_url
        })
      });
      const data = await res.json();
      if (data.success) {
        // Append iframe to draft text content safely
        const embedHTML = `
<div className="youtube-embed-container my-6 rounded-2xl overflow-hidden shadow-sm aspect-video max-w-2xl mx-auto border border-slate-100">
  <iframe 
    src="https://www.youtube.com/embed/${video.youtube_video_id}" 
    title="${video.title.replace(/"/g, '&quot;')}"
    className="w-full h-full"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowFullScreen
  ></iframe>
</div>
`.trim();

        // Let's insert it contextually right below the matching heading in lines copy
        const lines = article.content.split('\n');
        const headingLineIndex = lines.findIndex(l => l.includes(headingClean));
        
        let newContent = '';
        if (headingLineIndex !== -1) {
          lines.splice(headingLineIndex + 1, 0, '\n' + embedHTML + '\n');
          newContent = lines.join('\n');
        } else {
          newContent = article.content + '\n\n' + embedHTML + '\n';
        }

        onUpdateContent(newContent);
        setSearchQuery('');
        setSearchResults([]);
        setTimeout(fetchData, 1000);
      }
    } catch (err) {
      console.error("Failed embedding selected manual video:", err);
    }
  };

  // Perform surgical replacement of video
  const handleApplyReplacement = async (originalEmbed: ArticleVideo, selectedVideo: SearchedVideo) => {
    try {
      const res = await fetch(`/api/youtube/embed/${originalEmbed.id}`, { method: 'DELETE' });
      await res.json();

      // Submit new embed
      const createRes = await fetch('/api/youtube/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          youtubeVideoId: selectedVideo.youtube_video_id,
          title: selectedVideo.title,
          relevanceScore: selectedVideo.original_relevance_score || 0.95,
          insertedPosition: originalEmbed.inserted_position,
          headingText: originalEmbed.heading_text,
          viewCount: selectedVideo.view_count,
          channelTitle: selectedVideo.channel_title,
          duration: selectedVideo.duration,
          thumbnailUrl: selectedVideo.thumbnail_url
        })
      });
      const createData = await createRes.json();

      if (createData.success) {
        // Find inside content text block and replace youtube iframe code with new video_id
        let textCopy = article.content;
        const oldId = originalEmbed.youtube_video_id;
        const newId = selectedVideo.youtube_video_id;

        // Perform standard replace
        textCopy = textCopy.replaceAll(`/embed/${oldId}`, `/embed/${newId}`);
        textCopy = textCopy.replaceAll(`title="${originalEmbed.title.replace(/"/g, '&quot;')}"`, `title="${selectedVideo.title.replace(/"/g, '&quot;')}"`);
        
        onUpdateContent(textCopy);
        setReplacingEmbedId(null);
        setReplaceResults([]);
        setReplaceQuery('');
        setTimeout(fetchData, 1000);
      }
    } catch (err) {
      console.error("Failed applying surgical video replacement:", err);
    }
  };

  // Remove video embed
  const handleRemoveEmbed = async (embedItem: ArticleVideo) => {
    try {
      const res = await fetch(`/api/youtube/embed/${embedItem.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        // Strip the YouTube iframe container from the article body.
        let contentCopy = article.content;
        
        // Form the exact iframe block or substring containing the video ID
        const embedContainerPattern = new RegExp(`\\s*<div[^>]*className="youtube-embed-container"([^>]*|[^<]*|<(?!\\/div>)[^<]*)*\\/embed\\/${embedItem.youtube_video_id}[^<]*<\\/div>\\s*`, 'gi');
        contentCopy = contentCopy.replace(embedContainerPattern, '\n');

        // Also clean generic standard iframe elements featuring the code
        const rawIframePattern = new RegExp(`\\s*<iframe[^>]*\\/embed\\/${embedItem.youtube_video_id}[^>]*><\\/iframe>\\s*`, 'gi');
        contentCopy = contentCopy.replace(rawIframePattern, '\n');

        onUpdateContent(contentCopy);
        setTimeout(fetchData, 1000);
      }
    } catch (err) {
      console.error("Failed removing target video embed:", err);
    }
  };

  // Clear Terminal logs
  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/youtube/clear-logs', { method: 'POST' });
      if (res.ok) setLogs([]);
    } catch (err) {}
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-150 overflow-hidden" id="youtube-embed-root">
      
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-100 p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              Production YouTube Auto-Embedder
              <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Automated</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Smart AI section matching, clickbait verification filters, and dwell metrics enhancer.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-50 p-1 border border-slate-100 rounded-xl">
            <span className="text-xs font-bold text-slate-500 px-2.5">Auto-Embed Mode</span>
            <button 
              onClick={() => {
                const toggled = !autoEmbed;
                setAutoEmbed(toggled);
                handleSaveConfig(toggled, maxEmbeds, minWords, strictness);
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${autoEmbed ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${autoEmbed ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <button
            onClick={fetchData}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer transition-all"
            title="Refresh database states"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Analytics Widgets Dashboard bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white border-b border-slate-100">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center space-x-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Tv className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Active embeds</span>
            <span className="text-xl font-black text-slate-900 leading-none">{embeds.length} Videos</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center space-x-4">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Video CTR Rate</span>
            <span className="text-xl font-black text-slate-900 leading-none">{analytics.videoCtrPercent}% CTR</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center space-x-4">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Dwell time impact</span>
            <span className="text-xl font-black text-slate-900 leading-none">+{analytics.dwellTimeSeconds}s avg</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center space-x-4">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <BarChart4 className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">UX Engagement Gain</span>
            <span className="text-xl font-black text-indigo-700 leading-none">+{analytics.engagementImprovementPercent}%</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Row 1: Configurations + Automated Trigger actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Settings panel block */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              Embedder Policy Rules
            </h4>

            {/* Strict word limits */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500">Max Videos Limit per Post</label>
              <select
                value={maxEmbeds}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setMaxEmbeds(m);
                  handleSaveConfig(autoEmbed, m, minWords, strictness);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={1}>At most 1 video</option>
                <option value={2}>At most 2 videos (Optimal)</option>
                <option value={3}>At most 3 videos</option>
              </select>
            </div>

            {/* Word frequency setting */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500">Word Density Threshold</label>
              <select
                value={minWords}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  setMinWords(w);
                  handleSaveConfig(autoEmbed, maxEmbeds, w, strictness);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={500}>Every 500 words</option>
                <option value={800}>Every 800 words (Strict)</option>
                <option value={1200}>Every 1200 words (Outrank standard)</option>
              </select>
            </div>

            {/* Clickbait strictness level */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500">Moderation / Clickbait Filter</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStrictness('low');
                    handleSaveConfig(autoEmbed, maxEmbeds, minWords, 'low');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${strictness === 'low' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  Permissive
                </button>
                <button
                  onClick={() => {
                    setStrictness('high');
                    handleSaveConfig(autoEmbed, maxEmbeds, minWords, 'high');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${strictness === 'high' ? 'bg-red-50 text-red-700 border-red-200 shadow-3xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  Strict Shield
                </button>
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="pt-2 border-t border-slate-50">
              <button
                onClick={handleRunAutoEmbed}
                disabled={isProcessing}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Executing Semantic Placement...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-white" />
                    <span>Run Auto-Embedder Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Console / Interactive logging monitor terminal */}
          <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-950 p-5 flex flex-col h-[300px] text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-rose-500" />
                <span className="font-mono text-xs font-black text-slate-300">Auto-Crawler Placement logs</span>
              </div>
              <button 
                onClick={handleClearLogs}
                className="text-[10px] font-bold text-slate-550 hover:text-white transition-all cursor-pointer"
              >
                Clear Terminal
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 select-text text-slate-350 pr-2">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic p-4 text-center">
                  Terminal ready. Trigger Auto-Embedder to analyze your code markdown draft...
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-1.5">
                    <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                    {log.type === 'success' && <span className="text-emerald-405 font-bold">[OK]</span>}
                    {log.type === 'info' && <span className="text-indigo-400 font-bold">[INFO]</span>}
                    {log.type === 'warn' && <span className="text-amber-500 font-bold">[WARN]</span>}
                    <span className="text-slate-200">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={consoleBottomRef} />
            </div>
          </div>

        </div>

        {/* Replacement Modal Panel component */}
        {replacingEmbedId && (() => {
          const matchedOrig = embeds.find(e => e.id === replacingEmbedId);
          if (!matchedOrig) return null;
          return (
            <div className="bg-red-50/50 border border-red-200/50 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-red-100 pb-2">
                <h4 className="text-xs font-black text-slate-805 uppercase tracking-wide flex items-center gap-1.5 text-slate-800">
                  <SlidersHorizontal className="h-4 w-4 text-red-600" />
                  Surgical Videocast Replacement / Override
                </h4>
                <button 
                  onClick={() => {
                    setReplacingEmbedId(null);
                    setReplaceResults([]);
                    setReplaceQuery('');
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-800 px-2.5 py-1 rounded hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel Override
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600">Replacing embedded video:</p>
                <div className="bg-white border border-slate-100 rounded-xl p-3 flex gap-3 text-slate-700">
                  <img src={matchedOrig.thumbnail_url} className="w-24 h-14 object-cover rounded-md" alt="" />
                  <div>
                    <p className="text-xs font-black text-slate-905">{matchedOrig.title}</p>
                    <p className="text-[10px] font-medium text-slate-450">{matchedOrig.channel_title} • Score: {(matchedOrig.relevance_score*100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={replaceQuery}
                  onChange={(e) => setReplaceQuery(e.target.value)}
                  placeholder="Enter replacement keyword / topic query..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl text-xs py-2 px-3 outline-none font-medium text-slate-800 focus:border-red-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleReplaceSearch()}
                />
                <button
                  onClick={handleReplaceSearch}
                  className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-3xs cursor-pointer"
                >
                  {isReplacingSearch ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                  <span>Search Override Pool</span>
                </button>
              </div>

              {replaceResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2">
                  {replaceResults.map(res => (
                    <div key={res.youtube_video_id} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-3 hover:border-red-300 transition-all text-slate-700 relative">
                      <img src={res.thumbnail_url} className="w-20 h-12 object-cover rounded-md" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-850 truncate">{res.title}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{res.channel_title}</p>
                        <div className="flex gap-1.5 mt-1">
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1 rounded">Score: {((res.original_relevance_score || 0.90) * 100).toFixed(0)}%</span>
                          {res.is_clickbait && <span className="bg-red-50 text-red-700 text-[9px] font-bold px-1 rounded">Clickbait Penalty</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleApplyReplacement(matchedOrig, res)}
                        className="self-center bg-indigo-50 hover:bg-indigo-105 hover:bg-indigo-100 text-indigo-700 p-2.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                      >
                        Apply replacement
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Row 2: Active Embeds lists */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Tv className="h-4 w-4 text-rose-500" />
            Active Embeds Linked inside Draft copy
          </h4>

          {embeds.length === 0 ? (
            <div className="bg-white p-12 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <Tv className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-650 mb-1">No videos embedded yet</p>
              <p className="text-xs text-slate-400 max-w-sm">Trigger the automated embedder pipeline or use the manual locator catalog search tools below to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {embeds.map((embed) => (
                <div key={embed.id} className="bg-white border border-slate-150/80 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col h-full">
                  
                  {/* Embedded Iframe Preview */}
                  <div className="relative aspect-video bg-slate-900 border-b border-slate-100">
                    <iframe
                      src={embed.embed_url}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="no-referrer"
                    ></iframe>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="bg-rose-550 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 leading-none">
                          <CheckCircle className="h-2.5 w-2.5" />
                          Embedded Video Match
                        </span>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">Relevance:</span>
                          <span className="text-emerald-600 text-xs font-black select-all">{(embed.relevance_score * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      <h5 className="text-xs font-bold text-slate-805 text-slate-800 line-clamp-2 leading-snug">{embed.title}</h5>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{embed.channel_title} • {embed.view_count}</p>
                      
                      <div className="mt-2.5 border-t border-slate-50 pt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-550/30 p-1.5 bg-slate-50 rounded-lg">
                        <Settings className="h-3 w-3 text-indigo-500" />
                        <span>Section Target Location:</span>
                        <strong className="text-indigo-600 truncate">{embed.inserted_position}</strong>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 items-center pt-2 border-t border-slate-50 justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRemoveEmbed(embed)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setReplacingEmbedId(embed.id);
                            setReplaceQuery(embed.title);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-110 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Override / Search</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleViewSynopsis(embed.youtube_video_id, embed.title)}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <span>View Transcript</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Transcript Summary Panel inside workspace */}
        {transcriptVideoId && (
          <div className="bg-white border-2 border-indigo-100 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-center border-b border-indigo-50 pb-2">
              <span className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Dwell Content Transcript Helper Summary
              </span>
              <button 
                onClick={() => setTranscriptVideoId(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                Close View
              </button>
            </div>
            {isLoadingTranscript ? (
              <div className="flex items-center gap-2 p-4 justify-center">
                <RefreshCw className="h-4 w-4 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-500 font-bold">Querying authority sources...</span>
              </div>
            ) : (
              <div className="text-xs text-slate-700 font-medium font-sans whitespace-pre-line leading-relaxed bg-indigo-50/30 p-4 rounded-xl border border-indigo-50">
                {transcriptSummary}
              </div>
            )}
          </div>
        )}

        {/* Row 3: Manual overrides search pool & embeds loader tools */}
        <div className="bg-white border border-slate-150/80 rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Search className="h-4 w-4 text-red-500" />
            Manual Embed Locator (Catalog Finder)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-3 border-b border-slate-50">
            
            {/* Subject word query */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: setup google tag manager tutorial..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-red-500 text-slate-800"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              />
            </div>

            {/* Target placement location */}
            <div className="md:col-span-4 select-arrow relative">
              <select
                value={manualHeadingTarget}
                onChange={(e) => setManualHeadingTarget(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-1 focus:ring-red-500 text-slate-600 font-semibold"
              >
                <option value="">-- Choose placement section --</option>
                {articleHeadings.map((head, idx) => (
                  <option key={idx} value={`After H2: ${head}`}>
                    Below heading: "{head.substring(0, 30)}..."
                  </option>
                ))}
                <option value="Featured Video Block (Top)">Featured Video Block (Top)</option>
              </select>
            </div>

            {/* Trigger Button */}
            <div className="md:col-span-3">
              <button
                onClick={handleManualSearch}
                disabled={isSearching}
                className="w-full bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 select-none transition-all cursor-pointer shadow-3xs"
              >
                {isSearching ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : <Search className="h-4 w-4 text-white" />}
                <span>Locate & Filter Videos</span>
              </button>
            </div>

          </div>

          {/* Search results list preview */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {searchResults.map((video) => (
                <div key={video.youtube_video_id} className="border border-slate-150 rounded-xl p-4 flex gap-4 hover:border-indigo-400 transition-all select-none">
                  
                  <img src={video.thumbnail_url} className="w-28 h-18 object-cover rounded-lg border border-slate-100" alt="" />
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-850 truncate leading-none mb-1 text-slate-800">{video.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold mb-1.5">{video.channel_title} • {video.view_count}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded leading-none border border-emerald-100">
                          Relevance: {((video.original_relevance_score || 0.90)*100).toFixed(0)}%
                        </span>
                        {video.is_clickbait && (
                          <span className="bg-red-50 text-red-700 text-[9px] font-black px-1.5 py-0.5 rounded leading-none border border-red-100 flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" /> Penalty Clickbait
                          </span>
                        )}
                        {video.is_non_english && (
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded leading-none border border-amber-100">
                            Non-English
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleEmbedChosenVideo(video)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Context Embed</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
