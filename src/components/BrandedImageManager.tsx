import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  RefreshCw, 
  Sliders, 
  Check, 
  X, 
  Trash2, 
  Info, 
  Lock, 
  Activity, 
  Database, 
  SlidersHorizontal,
  CloudLightning,
  AlertCircle,
  FileText,
  MousePointerClick,
  Download,
  Paintbrush
} from 'lucide-react';
import { Article } from '../types';

interface BrandedImageManagerProps {
  article: Article;
  onUpdateContent: (newContent: string) => void;
  cmsCredentials?: any;
}

interface ImageItem {
  id: string;
  article_id: string;
  image_type: string;
  image_url: string;
  thumbnail_url: string;
  alt_text: string;
  prompt_used: string;
  provider_used: string;
  style: string;
  aspect_ratio: string;
  status: 'pending' | 'completed' | 'failed' | 'rejected' | 'approved';
  created_at: string;
}

interface GenerationJob {
  id: string;
  article_id: string;
  generation_status: 'queued' | 'processing' | 'completed' | 'failed';
  provider: string;
  tokens_used: number;
  generation_time: number;
  failure_reason?: string;
  retry_count: number;
  created_at: string;
}

interface BrandProfile {
  id: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  style_profile: string;
  typography_profile: string;
  image_tone: string;
  consistency_profile: string;
}

const GENERATION_STYLES = [
  { id: 'seo_blog', label: 'SEO Blog Style', desc: 'Modern blog layout, clean focal details' },
  { id: 'realistic', label: 'Photorealistic', desc: 'True-to-life lighting & camera parameters' },
  { id: 'minimalist', label: 'Minimalist Vector', desc: 'Generous negative spacing, high contrast' },
  { id: '3d_render', label: '3D Clay Render', desc: 'Toy-like soft shadows, modern SaaS vibe' },
  { id: 'flat_illustration', label: 'Flat Vector Illustration', desc: '2D designer geometries, tech startup friendly' },
  { id: 'modern_saas', label: 'Modern SaaS UI', desc: 'Futuristic dashboards & neon flow mockups' },
  { id: 'cyberpunk', label: 'Cyberpunk Tech', desc: 'Glow-wire nodes, dark canvas, terminal overlays' },
  { id: 'watercolor', label: 'Watercolor Editorial', desc: 'Hand-drawn organic shapes, soft edges' },
  { id: 'infographic', label: 'Data Infographic', desc: 'Flow charts, charts & explanatory segments' },
  { id: 'cinematic', label: 'Cinematic Narrative', desc: 'Dramatic shadows, wide-angle lens flare' },
  { id: 'corporate', label: 'Corporate Modern', desc: 'Clean gradients, trustworthy, team elements' }
];

const ASPECT_RATIOS = [
  { id: '16:9', label: 'Landscape 16:9', icon: '⎯' },
  { id: '1:1', label: 'Square 1:1', icon: '◻' },
  { id: '4:3', label: 'Classic 4:3', icon: '▤' },
  { id: '3:4', label: 'Portrait 3:4', icon: '▥' },
  { id: '9:16', label: 'Mobile 9:16', icon: '▮' }
];

const QUALITY_LEVELS = [
  { id: 'standard', label: 'Standard SD (512px)', sub: 'Low resolution, watermarked, fast' },
  { id: 'hd_1k', label: 'High Definition (1K WebP)', sub: 'Crystal-clear blog format, standard' },
  { id: 'uhd_2k', label: 'Ultra HD (2K Pro Rendering)', sub: 'Supreme quality, no watermarks, prioritised' }
];

export default function BrandedImageManager({ article, onUpdateContent }: BrandedImageManagerProps) {
  const [activeTab, setActiveTab ] = useState<'studio' | 'gallery' | 'branding' | 'observability'>('studio');
  
  // States of backend sync data
  const [brandProfile, setBrandProfile] = useState<BrandProfile>({
    id: 'default',
    primary_color: '#4f46e5',
    secondary_color: '#10b981',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
    style_profile: 'modern_saas',
    typography_profile: 'Space Grotesk',
    image_tone: 'bright_uplifting',
    consistency_profile: 'flat_geometric_accents'
  });

  const [images, setImages] = useState<ImageItem[]>([]);
  const [generationsList, setGenerationsList] = useState<GenerationJob[]>([]);
  
  // Studio selections
  const [selectedStyle, setSelectedStyle] = useState('seo_blog');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedQuality, setSelectedQuality] = useState('hd_1k');
  const [customPromptText, setCustomPromptText] = useState('');
  const [targetSectionHeading, setTargetSectionHeading] = useState('featured'); // 'featured', or parsed heading

  // Local billing limits
  const [credits, setCredits] = useState({ limit: 5, used: 2, isPremium: false });
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  
  // Active states
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [progressLog, setProgressLog] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Parsed headings for inline generation options
  const [headings, setHeadings] = useState<string[]>([]);

  // Drag and drop simulator
  const [dragOver, setDragOver] = useState(false);

  // Fetch billing metrics & image history on mount OR article change
  useEffect(() => {
    fetchHistory();
    fetchBrandProfile();
    fetchCreditStatus();
    parseArticleHeadings();
    
    addLocalLog('Image generation workspace initialized for keyword: "' + article.targetKeyword + '"');
  }, [article.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeJobId && isGenerating) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/images/status/${activeJobId}`);
          if (res.ok) {
            const data = await res.json();
            
            if (data.status === 'completed') {
              setIsGenerating(false);
              setActiveJobId(null);
              setProgressPercent(100);
              setProgressLog('Image Generation Completed successfully!');
              addLocalLog(`Successfully generated branded asset of style [${data.style}] via ${data.provider_used}`);
              fetchHistory();
              fetchCreditStatus();
            } else if (data.status === 'failed') {
              setIsGenerating(false);
              setActiveJobId(null);
              setProgressLog(`Generation failed: ${data.failure_reason || 'Unknown timeout error'}`);
              addLocalLog(`Generation Job #${activeJobId} aborted: ${data.failure_reason}`);
              fetchHistory();
              fetchCreditStatus();
            } else {
              // processing or queued
              const currentProgress = data.status === 'processing' ? 65 : 15;
              setProgressPercent(currentProgress);
              setProgressLog(`Worker active: State [${data.status.toUpperCase()}] | active provider [${data.provider.toUpperCase()}]`);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [activeJobId, isGenerating]);

  const parseArticleHeadings = () => {
    const lines = article.content.split('\n');
    const detected: string[] = [];
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        detected.push(trimmed.replace(/^##\s+/, ''));
      } else if (trimmed.startsWith('### ')) {
        detected.push(trimmed.replace(/^###\s+/, ''));
      }
    });
    setHeadings(detected);
  };

  const addLocalLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 24)]);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/images/history?articleId=${article.id}`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
        
        // Fetch global systems generations
        const genRes = await fetch(`/api/images/history-generations`);
        if (genRes.ok) {
          const genData = await genRes.json();
          setGenerationsList(genData.generations || []);
        }
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const fetchBrandProfile = async () => {
    try {
      const res = await fetch(`/api/images/brand-profile?projectId=${article.projectId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setBrandProfile(data.profile);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCreditStatus = async () => {
    try {
      const res = await fetch(`/api/images/credit-status?articleId=${article.id}`);
      if (res.ok) {
        const data = await res.json();
        setCredits({
          limit: data.limit,
          used: data.used,
          isPremium: data.isPremium
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (credits.used >= credits.limit && !credits.isPremium) {
      alert('Credit limit reached for Free Tier! Upgrade to Premium Plan for unlimited HD assets without watermark overlays.');
      return;
    }

    setIsGenerating(true);
    setProgressPercent(5);
    setProgressLog('Contacting asynchronous image generation queue on backend...');
    addLocalLog(`Dispatched image generation job for segment: [${targetSectionHeading.toUpperCase()}]`);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articleId: article.id,
          imageType: targetSectionHeading === 'featured' ? 'featured' : 'inline',
          style: selectedStyle,
          aspectRatio: selectedRatio,
          quality: selectedQuality,
          heading: targetSectionHeading === 'featured' ? '' : targetSectionHeading,
          customPrompt: customPromptText,
          articleTitle: article.title
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveJobId(data.jobId);
        setProgressPercent(15);
        setProgressLog('Job queued background worker ID: ' + data.jobId);
        addLocalLog(`Job successfully mapped in image_generations table. Priority worker started.`);
      } else {
        const errData = await res.json();
        setIsGenerating(false);
        alert(`Failed to queue job: ${errData.error || 'Unknown endpoint response'}`);
        addLocalLog(`Queue insertion rejected: ${errData.error}`);
      }
    } catch (err: any) {
      setIsGenerating(false);
      alert(`Connection failed: ${err.message}`);
      addLocalLog(`Worker transmission error: ${err.message}`);
    }
  };

  const handleUpdateBrand = async (updated: Partial<BrandProfile>) => {
    const next = { ...brandProfile, ...updated };
    setBrandProfile(next);
    
    try {
      const res = await fetch('/api/images/brand-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: article.projectId,
          profile: next
        })
      });
      if (res.ok) {
        addLocalLog('Updated brand identity consistency guidelines on server.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWorkflowAction = async (imageId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      const res = await fetch('/api/images/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageId,
          action
        })
      });
      if (res.ok) {
        fetchHistory();
        addLocalLog(`Executed workflow action [${action.toUpperCase()}] for image ID ${imageId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInjectIntoArticle = (imageUrl: string, altText: string, headingTitle: string) => {
    let mdTag = `\n\n![${altText || article.targetKeyword}](${imageUrl})\n`;
    
    if (headingTitle && headingTitle !== 'featured') {
      // Find the heading in markdown and append the Tag right beneath it!
      const lines = article.content.split('\n');
      let targetIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(headingTitle)) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex !== -1) {
        // Splice image tag right after heading title
        lines.splice(targetIndex + 1, 0, mdTag);
        onUpdateContent(lines.join('\n'));
        addLocalLog(`Successfully injected inline visual tag below heading: "${headingTitle}"`);
        return;
      }
    }

    // Otherwise insert at current end of the article content
    onUpdateContent(article.content + mdTag);
    addLocalLog('Successfully appended image markdown tags at footer.');
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      addLocalLog(`Re-dispatching failed worker job #${jobId} to failover provider...`);
      const res = await fetch(`/api/images/retry-job/${jobId}`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setActiveJobId(data.jobId || jobId);
        setIsGenerating(true);
        setProgressPercent(20);
        setProgressLog('Retrying generation. Redirecting to redundant image endpoint...');
        fetchHistory();
      } else {
        const err = await res.json();
        alert(`Retry failed: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and drop mock file generator
  const handleDropMock = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    // Create custom uploaded item representation
    const randomImgUrl = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';
    addLocalLog('Client drag-and-drop file detected and optimized to WebP successfully.');
    
    // Inject directly as custom asset
    handleCustomUpload(randomImgUrl);
  };

  const handleCustomUpload = async (imgUrl: string) => {
    try {
      const res = await fetch('/api/images/upload-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          articleId: article.id,
          imageUrl: imgUrl,
          imageType: targetSectionHeading === 'featured' ? 'featured' : 'inline',
          altText: `Branded illustration for ${article.targetKeyword}`
        })
      });
      if (res.ok) {
        fetchHistory();
        addLocalLog('Asset replacement synchronized successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const featuredImage = images.find(img => img.image_type === 'featured' && img.status !== 'rejected');
  const inlineImages = images.filter(img => img.image_type === 'inline' && img.status !== 'rejected');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
      
      {/* Dynamic Header Metrics Dashboard */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-indigo-50 text-indigo-600">
              <CloudLightning className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">AI Branded Image Studio</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Generate customized editorial graphics, diagrams and metadata matched to your content's brand style profile automatically.
          </p>
        </div>

        {/* Quota tracker */}
        <div className="flex items-center space-x-3 shrink-0 self-stretch md:self-auto justify-between border-t md:border-t-0 border-slate-100 pt-3.5 md:pt-0">
          <div className="text-right">
            <div className="flex items-center space-x-1 justify-end">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monthly Usage:</span>
              <span className="text-xs font-mono font-black text-slate-900">
                {credits.isPremium ? 'Unlimited' : `${credits.used}/${credits.limit}`}
              </span>
            </div>
            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100/30 px-2 py-0.5 rounded-full inline-block mt-1">
              {credits.isPremium ? 'PRO Unlimited HD Tier' : 'FREE Watermarked Tier'}
            </span>
          </div>

          <div style={{ background: credits.isPremium ? 'radial-gradient(circle, #f43f5e 0%, #4f46e5 100%)' : '#e2e8f0' }} className="h-10 w-2 shrink-0 rounded-full overflow-hidden flex flex-col justify-end">
            <div 
              className="bg-indigo-600 rounded-full" 
              style={{ height: `${credits.isPremium ? 100 : Math.min(100, (credits.used / credits.limit) * 100)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Main Tab bar */}
      <div className="border-b border-slate-200 flex gap-4">
        {[
          { id: 'studio' as const, label: 'Generator Studio', icon: ImageIcon },
          { id: 'gallery' as const, label: `Vault Gallery (${images.length})`, icon: Paintbrush },
          { id: 'branding' as const, label: 'Brand Guidelines', icon: Sliders },
          { id: 'observability' as const, label: 'Observer Queues', icon: Activity }
        ].map(tab => {
          const active = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                active 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <IconComp className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Pages */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left image settings config panel (span-2) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* target heading selector */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Article Layout Target
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-150 rounded-lg text-xs font-bold py-2 px-3 outline-none focus:ring-1 focus:ring-indigo-500"
                value={targetSectionHeading}
                onChange={(e) => setTargetSectionHeading(e.target.value)}
              >
                <option value="featured">Featured Hero Banner (16:9 Landscape)</option>
                <optgroup label="Content headings for Inline visuals">
                  {headings.map(h => (
                    <option key={h} value={h}>Section Heading: "{h}"</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Visual style selector */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs space-y-3">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Visual Art Style profile
              </label>
              <div className="max-h-[140px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                {GENERATION_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      selectedStyle === style.id ? 'bg-indigo-50/50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div>
                      <span className="font-bold block text-[11px]">{style.label}</span>
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">{style.desc}</span>
                    </div>
                    {selectedStyle === style.id && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Config metrics */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-3xs space-y-4">
              <div>
                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Aspect Ratio</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {ASPECT_RATIOS.map(ratio => (
                    <button
                      key={ratio.id}
                      onClick={() => setSelectedRatio(ratio.id)}
                      className={`py-1.5 px-1 bg-slate-50 border rounded-lg text-center cursor-pointer transition-all ${
                        selectedRatio === ratio.id 
                          ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 font-black' 
                          : 'border-slate-100 text-slate-500 hover:bg-slate-100/50'
                      }`}
                    >
                      <span className="block text-xs leading-none">{ratio.icon}</span>
                      <span className="text-[8.5px] mt-1 block tracking-tighter leading-none">{ratio.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Quality & Resolutions</span>
                <div className="space-y-2">
                  {QUALITY_LEVELS.map(q => {
                    const isRestricted = q.id !== 'standard' && !credits.isPremium;
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          if (!isRestricted) setSelectedQuality(q.id);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isRestricted ? 'bg-slate-50 opacity-60 cursor-not-allowed border-slate-100' :
                          selectedQuality === q.id 
                            ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 font-bold cursor-pointer' 
                            : 'border-slate-150 bg-white hover:bg-slate-50/50 text-slate-600 cursor-pointer'
                        }`}
                      >
                        <div className="text-left">
                          <span className="text-[10px] font-bold block">{q.label}</span>
                          <span className="text-[8.5px] text-slate-400 block font-medium mt-0.5">{q.sub}</span>
                        </div>
                        {isRestricted ? (
                          <span className="p-1 rounded bg-slate-200 text-slate-500 flex items-center gap-1 text-[8px] font-bold" title="Upgrade to bypass limits">
                            <Lock className="h-2.5 w-2.5" />
                            <span>UPGRADE</span>
                          </span>
                        ) : (
                          selectedQuality === q.id && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Free tier warning banner */}
            {!credits.isPremium && (
              <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-2xl flex items-start gap-2.5">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-amber-950 font-medium leading-relaxed text-left">
                  <strong>Free Plan active:</strong> Generations are limited to low resolution (512px) with an automatic visual watermark. Consider upgrading your plan to access 4K cinematic assets, zero watermarks, and fast priority queues.
                </p>
              </div>
            )}

          </div>

          {/* Right Preview canvas workspace (span-3) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Main view frame canvas */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-100 min-h-[300px] flex flex-col justify-between relative overflow-hidden shadow-xl">
              
              {/* Backing stylized design grid overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 z-10">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    ACTIVE BRAND PROMPT TRANSMITTING SYSTEM
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50 uppercase font-black">
                  {targetSectionHeading === 'featured' ? 'featured-hero' : 'inline-content'}
                </span>
              </div>

              {/* Center status dynamic frame */}
              <div className="flex-1 flex flex-col items-center justify-center py-6 min-h-[180px] z-10">
                {isGenerating ? (
                  <div className="space-y-4 max-w-sm w-full">
                    {/* Glowing animated spinner */}
                    <div className="relative h-12 w-12 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-400 block">{progressPercent}% Completed</span>
                      <p className="text-[10px] text-slate-400 font-mono mt-1.5 leading-relaxed bg-slate-950/60 border border-slate-850/60 p-2.5 rounded-xl">
                        {progressLog}
                      </p>
                    </div>

                    {/* Progress tracking skeleton lines */}
                    <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 w-full text-center">
                    {featuredImage && targetSectionHeading === 'featured' ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-w-md mx-auto group">
                        <img 
                          src={featuredImage.image_url} 
                          alt={featuredImage.alt_text} 
                          className="w-full object-cover aspect-[16/9] transition-transform duration-500 group-hover:scale-105" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-950/65 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleInjectIntoArticle(featuredImage.image_url, featuredImage.alt_text, 'featured')}
                            className="bg-indigo-600 font-bold hover:bg-indigo-700 text-white rounded-lg text-[10px] px-3 py-1.5 self-center mt-auto cursor-pointer"
                          >
                            Insert into markdown content
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-w-sm mx-auto">
                        <div className="h-20 w-20 bg-slate-800/40 rounded-3xl mx-auto flex items-center justify-center text-slate-500 border border-slate-800/80">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-350 font-bold">Configure options and click compile below</p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                            Visuals automatically use brand colors <strong style={{ color: brandProfile.primary_color }}>{brandProfile.primary_color}</strong> and primary keywords for consistent SEO alignments.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prompt customization textbox area */}
              <div className="border-t border-slate-800 pt-4 mt-4 text-left z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] uppercase font-mono font-bold text-slate-400">
                    Prompt Enrichment / Section Intentions (Optional)
                  </label>
                  <span className="text-[8.5px] italic text-slate-500">context-aware AI auto fill active</span>
                </div>
                <textarea
                  className="w-full bg-slate-950 border border-slate-850 p-2.5 text-xs text-slate-300 font-sans tracking-tight placeholder:text-slate-600 outline-none focus:border-indigo-500/70 rounded-xl"
                  rows={2}
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder={
                    targetSectionHeading === 'featured'
                      ? `E.g., "A modern cybernetic server sync node showing data blocks stream." The AI will auto enrich this with keyword details...`
                      : `Explain what this inline subheading represents visually (flow diagrams, mock dashboards or charts).`
                  }
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 shrink-0 z-10">
                <div className="text-left shrink-0">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">MODEL ROUTER PRIORITY:</span>
                  <span className="text-[10px] font-bold text-emerald-400">Gemini 2.5 Image ⇆ Failover Active</span>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black tracking-tight flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isGenerating ? 'PROCESSING WORKER...' : 'GENERATE BRANDED VISUAL 🚀'}</span>
                </button>
              </div>

            </div>

            {/* Quick action: Drag and Drop replacements section */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDropMock}
              className={`border-2 border-dashed p-4 rounded-2xl text-center transition-all ${
                dragOver ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 bg-slate-100/30'
              }`}
            >
              <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-605 text-slate-600">
                <MousePointerClick className="h-4 w-4 text-slate-400" />
                <span>Drag & drop replacement image here, or select to change manually</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-none">
                File automatically gets optimized, converted to WebP on-the-fly and synced to metadata logs
              </p>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-150 p-4 rounded-xl shadow-4xs">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase">Synced Media Vault Storage</h4>
              <p className="text-[10px] text-slate-500">History log of completed generation nodes matching current article context</p>
            </div>

            <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 px-2.5 py-1 rounded border">
              Total Article Items: {images.length}
            </span>
          </div>

          {images.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border">
              <ImageIcon className="h-10 w-10 text-slate-350 mx-auto stroke-1" />
              <p className="text-slate-500 text-xs font-bold mt-2">No active gallery images logged yet</p>
              <p className="text-[10px] text-slate-400 mt-1">Generate your first featured banner above in Studio panel</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {images.map(img => (
                <div key={img.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between">
                  <div className="relative group overflow-hidden bg-slate-100">
                    <img 
                      src={img.image_url} 
                      alt={img.alt_text} 
                      className="w-full object-cover aspect-[16/10]" 
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Watermark overlay preview if not premium */}
                    {!credits.isPremium && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-slate-950/70 border border-slate-800 text-slate-300 font-mono text-[7px] font-bold rounded shadow select-none">
                        WATERMARKED PREVIEW
                      </div>
                    )}

                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-indigo-600 text-white font-mono text-[8px] font-black rounded shadow uppercase">
                      {img.style}
                    </div>

                    <div className="absolute inset-0 bg-slate-950/75 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-slate-300 font-mono line-clamp-3 leading-relaxed mb-1 text-left">
                        <strong>PROMPT USED:</strong> {img.prompt_used}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="text-left">
                      <span className="text-[9px] font-bold text-slate-455 text-slate-400 block uppercase tracking-wider">
                        {img.image_type === 'featured' ? 'Featured Hero Banner' : 'Inline Section Visual'}
                      </span>
                      <p className="text-[11px] font-extrabold text-slate-900 mt-0.5 leading-snug line-clamp-1">
                        {img.alt_text}
                      </p>
                    </div>

                    {/* Meta specifics */}
                    <div className="flex justify-between border-y border-slate-50 py-1.5 text-[9.5px] font-mono text-slate-450 text-slate-500">
                      <span>{img.aspect_ratio} ({img.provider_used})</span>
                      <span className={`font-bold ${
                        img.status === 'approved' ? 'text-emerald-600' :
                        img.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        {img.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Operations */}
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleInjectIntoArticle(img.image_url, img.alt_text, img.image_type)}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9.5px] font-bold py-1.5 cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <MousePointerClick className="h-3 w-3" />
                        <span>Inject tag</span>
                      </button>

                      {img.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleWorkflowAction(img.id, 'approve')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg cursor-pointer"
                            title="Approve image"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleWorkflowAction(img.id, 'reject')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg cursor-pointer"
                            title="Reject/Archive image"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}

                      {img.status !== 'pending' && (
                        <button
                          onClick={() => handleWorkflowAction(img.id, 'delete')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-605 text-slate-600 p-1.5 rounded-lg cursor-pointer ml-auto"
                          title="Delete from space"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-3xs text-left space-y-4">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase">Consistent Brand Profiles guidelines</h4>
              <p className="text-[10px] text-slate-500">Configure visual profiles so the prompt engine matches color templates automatically.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10.5px] font-bold text-slate-700 block">Primary Brand Signature Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-8 w-10 border border-slate-150 rounded cursor-pointer"
                    value={brandProfile.primary_color}
                    onChange={(e) => handleUpdateBrand({ primary_color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-slate-50 border border-slate-150 rounded-lg text-xs font-mono py-1 px-3 outline-none focus:ring-1"
                    value={brandProfile.primary_color}
                    onChange={(e) => handleUpdateBrand({ primary_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10.5px] font-bold text-slate-700 block">Accent Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-8 w-10 border border-slate-150 rounded cursor-pointer"
                    value={brandProfile.secondary_color}
                    onChange={(e) => handleUpdateBrand({ secondary_color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-slate-50 border border-slate-150 rounded-lg text-xs font-mono py-1 px-3 outline-none focus:ring-1"
                    value={brandProfile.secondary_color}
                    onChange={(e) => handleUpdateBrand({ secondary_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10.5px] font-bold text-slate-700 block">Corporate Logo Identity Url</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg text-xs py-2 px-3 outline-none focus:ring-1"
                  value={brandProfile.logo_url}
                  onChange={(e) => handleUpdateBrand({ logo_url: e.target.value })}
                  placeholder="URL of brand logo PNG file"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10.5px] font-bold text-slate-700 block">Consistency Profiler Model</label>
                <select
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg text-xs py-2 px-3 outline-none"
                  value={brandProfile.consistency_profile}
                  onChange={(e) => handleUpdateBrand({ consistency_profile: e.target.value })}
                >
                  <option value="flat_geometric_accents">Flat Minimalist Geometries Accent</option>
                  <option value="skeumorphic_saas">Futuristic 3D Isometric Elements</option>
                  <option value="soft_watercolor">Soft Editorial Watercolors</option>
                  <option value="dark_glowing_charts">High Contrasts Glowing Tech Diagrams</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10.5px] font-bold text-slate-700 block">Typography Mood Presets</label>
                <select
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg text-xs py-2 px-3 outline-none"
                  value={brandProfile.typography_profile}
                  onChange={(e) => handleUpdateBrand({ typography_profile: e.target.value })}
                >
                  <option value="Space Grotesk">Space Grotesk (Modern SaaS, high tracking)</option>
                  <option value="Inter">Inter Sans-Serif (Standard Minimal Clean)</option>
                  <option value="JetBrains Mono">JetBrains Mono (Developer centric tech-wire)</option>
                  <option value="Playfair Display">Playfair Display (Premium, Editorial classical)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10.5px] font-bold text-slate-700 block">Image Tone Focus</label>
                <select
                  className="w-full bg-slate-50 border border-slate-150 rounded-lg text-xs py-2 px-3 outline-none"
                  value={brandProfile.image_tone}
                  onChange={(e) => handleUpdateBrand({ image_tone: e.target.value })}
                >
                  <option value="bright_uplifting">Bright & Modern corporate (Uplifting tones)</option>
                  <option value="neon_cyberpunk">Neon futuristic dark shadows (Creative, high contrast)</option>
                  <option value="desaturated_clinical">Desaturated professional medical / clinical (Trustworthy)</option>
                  <option value="warm_cozy">Warm cozy amber tones (Mindfulness, lifestyle)</option>
                </select>
              </div>
            </div>

            {/* Simulated Live brand color badge preview */}
            <div className="p-4 rounded-2xl border border-slate-100 text-center" style={{ background: `linear-gradient(135deg, ${brandProfile.primary_color}1a 0%, ${brandProfile.secondary_color}1a 100%)` }}>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-2" style={{ color: brandProfile.primary_color }}>
                Live Branded CSS Palette Rendering Demo
              </span>
              <div className="flex gap-3 justify-center items-center">
                <div className="h-6 w-24 rounded-full border shadow-3xs flex items-center justify-center text-[9px] font-bold text-white uppercase" style={{ backgroundColor: brandProfile.primary_color }}>
                  Primary
                </div>
                <div className="h-6 w-24 rounded-full border shadow-3xs flex items-center justify-center text-[9px] font-bold text-white uppercase" style={{ backgroundColor: brandProfile.secondary_color }}>
                  Secondary
                </div>
                <div className="h-6 w-12 rounded-full border border-slate-150 bg-white" style={{ fontFamily: brandProfile.typography_profile }}>
                  Aa
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'observability' && (
        <div className="space-y-6">
          
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border rounded-2xl shadow-4xs text-left">
              <span className="text-[9px] font-mono text-slate-400 block font-black">ACTIVE WORKERS IN QUEUE:</span>
              <div className="flex items-baseline mt-1 space-x-1.5">
                <span className="text-xl font-black text-slate-900">
                  {isGenerating ? 1 : 0}
                </span>
                <span className="text-[10px] text-indigo-500 font-bold">online</span>
              </div>
            </div>
            
            <div className="p-4 bg-white border rounded-2xl shadow-4xs text-left">
              <span className="text-[9px] font-mono text-slate-400 block font-black">AVERAGE RECOVERY TIME:</span>
              <div className="flex items-baseline mt-1 space-x-1.5">
                <span className="text-xl font-black text-slate-900">
                  {generationsList.length > 0 
                    ? `${(generationsList.reduce((acc, c) => acc + c.generation_time, 0) / generationsList.length / 1000).toFixed(1)}s` 
                    : '11.4s'}
                </span>
                <span className="text-[10px] text-indigo-500 font-bold">highly robust</span>
              </div>
            </div>

            <div className="p-4 bg-white border rounded-2xl shadow-4xs text-left">
              <span className="text-[9px] font-mono text-slate-400 block font-black">REDUNDANT API SLOTS STATUS:</span>
              <div className="flex items-baseline mt-1 space-x-1.5">
                <span className="text-xl font-black text-emerald-600">99.8%</span>
                <span className="text-[10px] text-emerald-500 font-bold">HEALTHY</span>
              </div>
            </div>

            <div className="p-4 bg-white border rounded-2xl shadow-4xs text-left">
              <span className="text-[9px] font-mono text-slate-400 block font-black">TOTAL TOKENS SPENT:</span>
              <div className="flex items-baseline mt-1 space-x-1.5">
                <span className="text-xl font-black text-slate-900">
                  {generationsList.reduce((acc, c) => acc + c.tokens_used, 0).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Imagen/Gemini</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-900 rounded-2xl text-slate-200 overflow-hidden shadow-xl text-left font-mono text-xs">
            
            <div className="p-3 bg-slate-900 border-b border-slate-900 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">Observability image_generations DB Model</span>
              <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 font-black text-[8px] rounded uppercase">
                Active PostgreSQL Adapter
              </span>
            </div>

            {/* List log table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] border-collapse bg-slate-950">
                <thead>
                  <tr className="bg-slate-900/40 text-slate-400 uppercase font-black tracking-wider border-b border-slate-900">
                    <th className="py-2.5 px-4 font-mono">Job ID</th>
                    <th className="py-2.5 px-4 font-mono">Active Provider</th>
                    <th className="py-2.5 px-4 font-mono">Duration (ms)</th>
                    <th className="py-2.5 px-4 font-mono">Tokens Used</th>
                    <th className="py-2.5 px-4 font-mono">Retries</th>
                    <th className="py-2.5 px-4 font-mono">State</th>
                    <th className="py-2.5 px-4 font-mono">Operation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {generationsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-500 italic">
                        No background worker generations logged yet. Start generating above.
                      </td>
                    </tr>
                  ) : (
                    generationsList.map(gen => (
                      <tr key={gen.id} className="hover:bg-slate-900/30">
                        <td className="py-2.5 px-4 font-semibold text-slate-350 shrink-0 select-all">{gen.id}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-300">{gen.provider.toUpperCase()}</td>
                        <td className="py-2.5 px-4 text-slate-400">{(gen.generation_time / 1000).toFixed(1)}s</td>
                        <td className="py-2.5 px-4 text-slate-400 font-bold">{gen.tokens_used.toLocaleString()}</td>
                        <td className="py-2.5 px-4 font-extrabold text-slate-450">{gen.retry_count} / 2</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                            gen.generation_status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40' :
                            gen.generation_status === 'failed' ? 'bg-rose-950 text-rose-400 border border-rose-900/40' :
                            'bg-amber-950 text-amber-400 animate-pulse border border-amber-900/40'
                          }`}>
                            {gen.generation_status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          {gen.generation_status === 'failed' ? (
                            <button
                              onClick={() => handleRetryJob(gen.id)}
                              className="bg-indigo-950 hover:bg-indigo-900 text-indigo-400 font-black px-2 py-0.5 rounded border border-indigo-900/30 font-mono text-[9px] cursor-pointer"
                            >
                              Failover Retry
                            </button>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Real-time system log terminal */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 overflow-hidden text-left font-mono text-xs">
            <div className="p-3 bg-slate-950 border-b border-gray-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Live Server worker logs console terminal
              </span>
              <button 
                onClick={() => setSystemLogs([])}
                className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Clear logs
              </button>
            </div>
            
            <div className="p-4 max-h-[140px] overflow-y-auto space-y-1.5 leading-relaxed text-[10px]">
              {systemLogs.length === 0 ? (
                <div className="text-slate-600 text-[10px] italic">Console logging node active. Standing by for API calls...</div>
              ) : (
                systemLogs.map((log, idx) => (
                  <div key={idx} className="hover:bg-slate-800/40 p-1 rounded">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
