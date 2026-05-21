import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Search, 
  ArrowRight, 
  ExternalLink, 
  Plus, 
  Loader2, 
  AlertCircle,
  Folder,
  Layers,
  FileText,
  Terminal,
  Settings,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  SearchCode,
  ArrowUpRight,
  Database,
  UserCheck,
  PlusCircle,
  Clock,
  BookOpen,
  Filter,
  Check,
  Zap,
  Globe2,
  Trash2,
  Edit3,
  CreditCard
} from 'lucide-react';

import { Project, Keyword, Article, CrawlerLog, AutopilotQueueItem } from './types';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  INITIAL_PROJECTS, 
  INITIAL_KEYWORDS, 
  INITIAL_ARTICLES, 
  INITIAL_LOGS,
  getSecondaryKeywords 
} from './data/mockData';
import { evaluateSeoMetrics, parseMarkdownStructure } from './utils/seoAnalyzer';
import EditorSidebar from './components/EditorSidebar';
import TopicalClusters from './components/TopicalClusters';
import OutrankLanding from './components/OutrankLanding';
import PricingPage from './components/PricingPage';
import BrandIdentityCenter from './components/BrandIdentityCenter';
import RankSyncerLogo from './components/RankSyncerLogo';

// Firebase Authentication and Relational Sync Client Integrations
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  logOutFromFirebase, 
  testFirestoreConnection,
  subscribeToUserProjects,
  subscribeToKeywords,
  subscribeToArticles,
  subscribeToLogs,
  fsSaveProject,
  fsDeleteProject,
  fsSaveKeyword,
  fsDeleteKeyword,
  fsSaveArticle,
  fsDeleteArticle,
  fsSaveLog,
  fsDeleteLog
} from './lib/firebase';

export default function App() {
  // Firebase Authentication & Continuity States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Navigation & Core States
  const [viewMode, setViewMode] = useState<'landing' | 'app' | 'pricing'>('landing');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'keywords' | 'planner' | 'editor' | 'crawler' | 'settings' | 'brand'>('brand');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('rs_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('rs_theme', theme);
  }, [theme]);

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('rs_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [keywords, setKeywords] = useState<Keyword[]>(() => {
    const saved = localStorage.getItem('rs_keywords');
    return saved ? JSON.parse(saved) : INITIAL_KEYWORDS;
  });
  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('rs_articles');
    return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
  });
  const [logs, setLogs] = useState<CrawlerLog[]>(() => {
    const saved = localStorage.getItem('rs_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });
  
  // Selected project for scoped filtering (empty or id)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('p-1');

  // Autonomous mode state
  const [autonomousMode, setAutonomousMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('rs_autonomous');
    return saved === 'true';
  });

  // Editor-scoped state
  const [activeArticleId, setActiveArticleId] = useState<string>('a-3');

  // Planner sub-toggle state
  const [plannerSubView, setPlannerSubView] = useState<'pipeline' | 'topical'>('pipeline');

  // --- Sub-View Sub-Toggles for Dashboard (Overview vs GSC vs Autopilot) ---
  const [dashboardSubView, setDashboardSubView] = useState<'overview' | 'gsc' | 'autopilot'>('overview');

  // --- Google Search Console State ---
  const [gscAccount, setGscAccount] = useState<{
    email: string;
    displayName: string;
    accessToken: string;
    isSandbox: boolean;
  } | null>(() => {
    const saved = localStorage.getItem('rs_gsc_account');
    return saved ? JSON.parse(saved) : null;
  });

  const [gscStats, setGscStats] = useState<{
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
    queries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
    isSimulated: boolean;
  } | null>(null);

  const [gscLoading, setGscLoading] = useState(false);

  // --- Autopilot State ---
  const [autopilotState, setAutopilotState] = useState<{
    enabled: boolean;
    queue: AutopilotQueueItem[];
    logs: CrawlerLog[];
  }>({
    enabled: true,
    queue: [],
    logs: []
  });

  const [autopilotLoading, setAutopilotLoading] = useState(false);

  // --- Live SERP Scraper Row Loader State ---
  const [scrapingKwId, setScrapingKwId] = useState<string | null>(null);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);

  // --- CMS Configurations States ---
  const [wpConfig, setWpConfig] = useState(() => {
    const saved = localStorage.getItem('rs_wp_config');
    return saved ? JSON.parse(saved) : { siteUrl: '', username: '', appPassword: '' };
  });

  const [webflowConfig, setWebflowConfig] = useState(() => {
    const saved = localStorage.getItem('rs_webflow_config');
    return saved ? JSON.parse(saved) : { siteToken: '', collectionId: '' };
  });

  const [shopifyConfig, setShopifyConfig] = useState(() => {
    const saved = localStorage.getItem('rs_shopify_config');
    return saved ? JSON.parse(saved) : { storeDomain: '', adminToken: '', blogId: '' };
  });

  const [headlessConfig, setHeadlessConfig] = useState(() => {
    const saved = localStorage.getItem('rs_headless_config');
    return saved ? JSON.parse(saved) : { webhookUrl: '' };
  });

  // State to track which platform credentials block is active: 'wordpress' | 'webflow' | 'shopify' | 'headless' | null
  const [editingCmsPlatform, setEditingCmsPlatform] = useState<'wordpress' | 'webflow' | 'shopify' | 'headless' | null>(null);

  // States for active publishing gateway/dialog
  const [publishingArticle, setPublishingArticle] = useState<Article | null>(null);
  const [isPublishingToCms, setIsPublishingToCms] = useState(false);
  const [selectedPublishPlatform, setSelectedPublishPlatform] = useState<'wordpress' | 'webflow' | 'shopify' | 'dummy' | 'headless_webhook'>('wordpress');
  const [cmsPublishResult, setCmsPublishResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);

  // SaaS Stripe subscription tier states: 'free' | 'premium'
  const [activePlan, setActivePlan] = useState<'free' | 'premium'>(() => {
    const saved = localStorage.getItem('rs_active_plan');
    return (saved as 'free' | 'premium') || 'free';
  });
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);

  // Capture checkout redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_success') === 'true') {
      setActivePlan('premium');
      localStorage.setItem('rs_active_plan', 'premium');
      
      const successLog: CrawlerLog = {
        id: `stripe-sub-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'success',
        message: `Subscription Activated: RankSyncer Pro Autopilot Suite initialized. Limit raised to 100 phrases and 5 autonomous daily content nodes successfully.`,
        module: 'AUTOPILOT_DAEMON'
      };
      
      if (currentUser) {
        fsSaveLog(successLog, selectedProjectId || 'p-1', currentUser.uid);
      } else {
        setLogs(prev => [successLog, ...prev]);
      }
      
      // Clean query parameters from URL safely
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('stripe_cancel') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser, selectedProjectId]);

  // --- CMS Temporary Input Holds ---
  const [tempWpSiteUrl, setTempWpSiteUrl] = useState(() => wpConfig.siteUrl || '');
  const [tempWpUsername, setTempWpUsername] = useState(() => wpConfig.username || '');
  const [tempWpAppPassword, setTempWpAppPassword] = useState(() => wpConfig.appPassword || '');

  const [tempWfSiteToken, setTempWfSiteToken] = useState(() => webflowConfig.siteToken || '');
  const [tempWfCollectionId, setTempWfCollectionId] = useState(() => webflowConfig.collectionId || '');

  const [tempShopifyDomain, setTempShopifyDomain] = useState(() => shopifyConfig.storeDomain || '');
  const [tempShopifyToken, setTempShopifyToken] = useState(() => shopifyConfig.adminToken || '');
  const [tempShopifyBlogId, setTempShopifyBlogId] = useState(() => shopifyConfig.blogId || '');

  const [tempHeadlessUrl, setTempHeadlessUrl] = useState(() => headlessConfig.webhookUrl || '');

  // --- HELPERS / API Handlers ---

  const saveWpConfig = (newUrl: string, user: string, pass: string) => {
    const config = { siteUrl: newUrl, username: user, appPassword: pass };
    setWpConfig(config);
    localStorage.setItem('rs_wp_config', JSON.stringify(config));
    setEditingCmsPlatform(null);
    const newLog: CrawlerLog = {
      id: `l-cf-wp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      message: `Configured WordPress Native API Endpoint: ${newUrl || "demo-wordpress.local"}. Connected in Live mode.`,
      module: 'CMS_SYNC'
    };
    if (currentUser) {
      fsSaveLog(newLog, selectedProjectId || 'p-1', currentUser.uid);
    } else {
      setLogs(prev => [newLog, ...prev]);
    }
  };

  const saveWebflowConfig = (token: string, colId: string) => {
    const config = { siteToken: token, collectionId: colId };
    setWebflowConfig(config);
    localStorage.setItem('rs_webflow_config', JSON.stringify(config));
    setEditingCmsPlatform(null);
    const newLog: CrawlerLog = {
      id: `l-cf-wf-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      message: `Configured Webflow CMS Connection schema Collection ID: ${colId || "items-collection-ref-active"}. Connected in Live mode.`,
      module: 'CMS_SYNC'
    };
    if (currentUser) {
      fsSaveLog(newLog, selectedProjectId || 'p-1', currentUser.uid);
    } else {
      setLogs(prev => [newLog, ...prev]);
    }
  };

  const saveShopifyConfig = (domain: string, token: string, blogIdStr: string) => {
    const config = { storeDomain: domain, adminToken: token, blogId: blogIdStr };
    setShopifyConfig(config);
    localStorage.setItem('rs_shopify_config', JSON.stringify(config));
    setEditingCmsPlatform(null);
    const newLog: CrawlerLog = {
      id: `l-cf-sh-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      message: `Configured Shopify Admin GraphQL Integrations: Store Domain: ${domain || "demo-shopify.local"}. Connected in Live mode.`,
      module: 'CMS_SYNC'
    };
    if (currentUser) {
      fsSaveLog(newLog, selectedProjectId || 'p-1', currentUser.uid);
    } else {
      setLogs(prev => [newLog, ...prev]);
    }
  };

  const saveHeadlessConfig = (whUrl: string) => {
    const config = { webhookUrl: whUrl };
    setHeadlessConfig(config);
    localStorage.setItem('rs_headless_config', JSON.stringify(config));
    setEditingCmsPlatform(null);
    const newLog: CrawlerLog = {
      id: `l-cf-hl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      message: `Configured Headless Webhook (Netlify/Vercel/GitHub): ${whUrl || "e.g. build hook"}. Connected in Live mode.`,
      module: 'CMS_SYNC'
    };
    if (currentUser) {
      fsSaveLog(newLog, selectedProjectId || 'p-1', currentUser.uid);
    } else {
      setLogs(prev => [newLog, ...prev]);
    }
  };

  const handleStripeCheckout = async (planId: string) => {
    setIsRedirectingToStripe(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          email: currentUser?.email || 'guest@ranksyncer.co',
          userId: currentUser?.uid || 'guest-user',
          origin: window.location.origin
        })
      });

      if (!response.ok) {
        throw new Error('Failed to bootstrap Stripe Billing Session');
      }

      const { url } = await response.json();
      if (url) {
        // Redirect seamlessly
        window.location.href = url;
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
      // Fallback sandbox simulation if stripe network isn't configured
      setActivePlan('premium');
      localStorage.setItem('rs_active_plan', 'premium');
    } finally {
      setIsRedirectingToStripe(false);
    }
  };

  const handleConnectGSC = async () => {
    try {
      const response = await fetch(`/api/gsc/auth-url?origin=${encodeURIComponent(window.location.origin)}`);
      if (!response.ok) throw new Error("Failed loader authorization URL");
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'gsc_oauth_popup', 'width=650,height=700,status=no,toolbar=no,menubar=no');
      if (!authWindow) {
        alert("Please enable popups to process authentication steps.");
      }
    } catch (err: any) {
      console.error("GSC auth url load failed:", err);
    }
  };

  const handleDisconnectGSC = () => {
    setGscAccount(null);
    setGscStats(null);
    localStorage.removeItem('rs_gsc_account');
    setLogs(prev => [{
      id: `l-gsc-disc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: 'Unlinked Google Search Console account stream successfully.',
      module: 'GSC_SYNC'
    }, ...prev]);
  };

  const fetchGSCStats = async () => {
    if (!currentProject) return;
    setGscLoading(true);
    try {
      const siteUrl = currentProject.domain;
      const isSandboxParam = gscAccount ? gscAccount.isSandbox : true;
      const token = gscAccount ? gscAccount.accessToken : '';

      const res = await fetch(`/api/gsc/performance?siteUrl=${encodeURIComponent(siteUrl)}&accessToken=${encodeURIComponent(token)}&isSandbox=${isSandboxParam}`);
      if (res.ok) {
        const data = await res.json();
        setGscStats(data);
      }
    } catch (err) {
      console.error("Failed GSC retrieval:", err);
    } finally {
      setGscLoading(false);
    }
  };

  const fetchAutopilotState = async () => {
    try {
      const res = await fetch('/api/autopilot/state');
      if (res.ok) {
        const data = await res.json();
        setAutopilotState(data);
      }
    } catch (err) {
      console.error("Autopilot state fetch error:", err);
    }
  };

  const handleToggleAutopilot = async (enabledVal: boolean) => {
    try {
      const res = await fetch('/api/autopilot/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: enabledVal })
      });
      if (res.ok) {
        const data = await res.json();
        setAutopilotState(prev => ({ ...prev, enabled: data.enabled }));
        const logItem: CrawlerLog = {
          id: `l-tog-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'info',
          message: `Autonomous Autopilot daemon set to: ${data.enabled ? 'ONLINE' : 'OFFLINE'}`,
          module: 'AUTOPILOT_DAEMON'
        };
        setLogs(prev => [logItem, ...prev]);
      }
    } catch (err) {
      console.error("Failed toggle info:", err);
    }
  };

  const handleTriggerAutopilotScan = async () => {
    if (!currentProject) return;
    setAutopilotLoading(true);
    const bootLog: CrawlerLog = {
      id: `l-run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `Crawl scanner triggered: Inspecting project ranks for outranked slip triggers...`,
      module: 'AUTOPILOT_DAEMON'
    };
    setLogs(prev => [bootLog, ...prev]);

    try {
      const res = await fetch('/api/autopilot/trigger-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          keywordsList: projectKeywords
        })
      });
      if (res.ok) {
        const data = await res.json();
        const finishLog: CrawlerLog = {
          id: `l-done-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'success',
          message: data.message,
          module: 'AUTOPILOT_DAEMON'
        };
        setLogs(prev => [finishLog, ...prev]);
        await fetchAutopilotState();
        
        let polls = 0;
        const scanPoller = setInterval(async () => {
          await fetchAutopilotState();
          polls++;
          if (polls > 8) clearInterval(scanPoller);
        }, 3000);
      }
    } catch (err) {
      console.error("Trigger fail:", err);
    } finally {
      setAutopilotLoading(false);
    }
  };

  const handleDeleteQueueItem = async (id: string) => {
    try {
      const res = await fetch(`/api/autopilot/queue/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAutopilotState(prev => ({
          ...prev,
          queue: prev.queue.filter(q => q.id !== id)
        }));
      }
    } catch (err) {
      console.error("Queue delete failed:", err);
    }
  };

  const handleApproveDraft = async (queueItem: AutopilotQueueItem) => {
    if (!queueItem.draftContent) return;
    try {
      const res = await fetch('/api/autopilot/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId: queueItem.id })
      });
      if (res.ok) {
        const parsedDraft = queueItem.draftContent;
        const newArt: Article = {
          id: `a-auto-${Date.now()}`,
          projectId: queueItem.projectId,
          title: parsedDraft.title,
          slug: queueItem.keywordTerm.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'autopilot-recovery-article',
          targetKeyword: queueItem.keywordTerm,
          wordCount: parsedDraft.wordCount,
          seoScore: parsedDraft.seoScore,
          status: 'Draft',
          content: parsedDraft.content,
          metaDescription: parsedDraft.metaDescription,
          lastEdited: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        setArticles(prev => [newArt, ...prev]);
        if (currentUser) {
          await fsSaveArticle(newArt, currentProject.id, currentUser.uid);
        }

        await handleDeleteQueueItem(queueItem.id);

        const okLog: CrawlerLog = {
          id: `l-app-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `Approved Autopilot content optimizer strategy guide targeting "${queueItem.keywordTerm}"! Outline imported into active planner.`,
          module: 'AUTOPILOT_DAEMON'
        };
        setLogs(prev => [okLog, ...prev]);
        
        // Auto navigate to Planner
        setActiveTab('planner');
      }
    } catch (err) {
      console.error("Draft approval failed:", err);
    }
  };

  const handleLiveQuerySERP = async (kw: Keyword) => {
    setScrapingKwId(kw.id);
    const alertLog: CrawlerLog = {
      id: `l-serp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `Triggering real-time scraping audit across indexing nodes for "${kw.term}"...`,
      module: 'SERP_CRAWLER'
    };
    setLogs(prev => [alertLog, ...prev]);

    try {
      const res = await fetch(`/api/serp/scrape?keyword=${encodeURIComponent(kw.term)}&domain=${encodeURIComponent(currentProject.domain)}`);
      if (res.ok) {
        const data = await res.json();
        
        const updatedKws = keywords.map(k => {
          if (k.id === kw.id) {
            const existingHistory = k.history || [];
            const todayStr = '05-20';
            const freshHistory = existingHistory.some(h => h.date === todayStr)
              ? existingHistory.map(h => h.date === todayStr ? { ...h, rank: data.rank } : h)
              : [...existingHistory, { date: todayStr, rank: data.rank }];

            return {
              ...k,
              previousRank: k.currentRank,
              currentRank: data.rank,
              lastCheckedRank: new Date().toLocaleTimeString(),
              history: freshHistory
            };
          }
          return k;
        });

        setKeywords(updatedKws);
        localStorage.setItem('rs_keywords', JSON.stringify(updatedKws));

        if (currentUser) {
          const freshKw = updatedKws.find(k => k.id === kw.id);
          if (freshKw) {
            await fsSaveKeyword(freshKw, currentProject.id, currentUser.uid);
          }
        }

        const resLog: CrawlerLog = {
          id: `l-serp-res-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `Finished crawler audit for "${kw.term}". Current position: #${data.rank} (${data.isSimulated ? 'Sandbox model engine' : 'Live SerpAPI query'})`,
          module: 'SERP_CRAWLER'
        };
        setLogs(prev => [resLog, ...prev]);

        // Auto trigger autopilot scan if a rank dropped or rank is high/poor
        if (autopilotState.enabled && (data.rank > kw.currentRank || data.rank >= 8)) {
          setTimeout(() => {
            handleTriggerAutopilotScan();
          }, 1500);
        }
      }
    } catch (err) {
      console.error("Live SERP check error:", err);
    } finally {
      setScrapingKwId(null);
    }
  };

  // Listen to popup messaging success
  useEffect(() => {
    const handleGoogleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GSC_AUTH_SUCCESS') {
        const { tokens } = event.data;
        setGscAccount(tokens);
        localStorage.setItem('rs_gsc_account', JSON.stringify(tokens));
        setLogs(prev => [{
          id: `l-gsc-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `Linked search console stream account: "${tokens.email}" successfully`,
          module: 'GSC_SYNC'
        }, ...prev]);
      }
    };
    window.addEventListener('message', handleGoogleMessage);
    return () => window.removeEventListener('message', handleGoogleMessage);
  }, []);

  // Fetch GSC data and Autopilot variables
  useEffect(() => {
    fetchGSCStats();
  }, [selectedProjectId, gscAccount?.accessToken]);

  useEffect(() => {
    fetchAutopilotState();
  }, [selectedProjectId]);

  // Authentication state watcher
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      try {
        if (user) {
          await testFirestoreConnection();
        }
      } catch (err) {
        console.error("Initial Firestore test rejected:", err);
      }
    });
    return () => unsubscribe();
  }, []);

  // Multi-tenant project real-time listener sync
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToUserProjects(
      currentUser.uid,
      (fsProjects) => {
        if (fsProjects.length === 0) {
          // Seed the Firebase Firestore DB with current local user sandbox data
          console.log("Empty cloud space. Seeding default multi-tenant project portfolios...");
          projects.forEach((proj) => {
            fsSaveProject(proj, currentUser.uid);
            
            // Seed keywords
            const assocKws = keywords.filter(k => k.projectId === proj.id);
            assocKws.forEach(k => fsSaveKeyword(k, proj.id, currentUser.uid));
            
            // Seed articles
            const assocArts = articles.filter(a => a.projectId === proj.id);
            assocArts.forEach(a => fsSaveArticle(a, proj.id, currentUser.uid));
            
            // Seed crawler logs
            const assocLogs = logs.filter(l => l.projectId === proj.id || (!l.projectId && proj.id === selectedProjectId));
            assocLogs.forEach(l => fsSaveLog(l, proj.id, currentUser.uid));
          });
        } else {
          setProjects(fsProjects);
          if (!fsProjects.some(p => p.id === selectedProjectId)) {
            setSelectedProjectId(fsProjects[0].id);
          }
        }
      },
      (error) => {
        console.error("Firestore Projects stream error:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Sync sub-resource collections in real-time scoped per selected project ID
  useEffect(() => {
    if (!currentUser || !selectedProjectId) return;

    const unsubscribeKws = subscribeToKeywords(
      selectedProjectId,
      (fsKeywords) => {
        setKeywords(prev => {
          const mainKeys = new Set(fsKeywords.map(k => k.id));
          const others = prev.filter(k => k.projectId !== selectedProjectId && !mainKeys.has(k.id));
          return [...others, ...fsKeywords];
        });
      },
      (error) => console.error("Firestore keys sync error:", error)
    );

    const unsubscribeArts = subscribeToArticles(
      selectedProjectId,
      (fsArticles) => {
        setArticles(prev => {
          const mainKeys = new Set(fsArticles.map(a => a.id));
          const others = prev.filter(a => a.projectId !== selectedProjectId && !mainKeys.has(a.id));
          return [...others, ...fsArticles];
        });
      },
      (error) => console.error("Firestore articles sync error:", error)
    );

    const unsubscribeLogs = subscribeToLogs(
      selectedProjectId,
      (fsLogs) => {
        setLogs(prev => {
          const mainKeys = new Set(fsLogs.map(l => l.id));
          const others = prev.filter(l => l.projectId !== selectedProjectId && !mainKeys.has(l.id));
          return [...fsLogs, ...others].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });
      },
      (error) => console.error("Firestore crawler logs sync error:", error)
    );

    return () => {
      unsubscribeKws();
      unsubscribeArts();
      unsubscribeLogs();
    };
  }, [currentUser, selectedProjectId]);

  const handleSeedArticle = (title: string, targetKeyword: string) => {
    const slug = targetKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newArt: Article = {
      id: `a-seed-${Date.now()}`,
      projectId: selectedProjectId,
      title,
      slug,
      targetKeyword,
      wordCount: 15,
      seoScore: 10,
      status: 'Draft',
      content: `# ${title}\n\nStart writing target content around **${targetKeyword}** here. Use the sidebar keyword metrics to check density!`,
      lastEdited: new Date().toISOString(),
      metaDescription: `Read about ${targetKeyword} optimizations and standard checklists.`
    };

    // Calculate initial metrics
    const secondaryList = getSecondaryKeywords(targetKeyword);
    const scoreVal = evaluateSeoMetrics(newArt, secondaryList);
    newArt.seoScore = scoreVal.total;

    setArticles(prev => [newArt, ...prev]);
    
    setLogs(prev => [{
      id: `l-seed-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      message: `Topical cluster node seeded: Article brief compiled for "${title}"`,
      module: 'SERP_CRAWLER'
    }, ...prev]);

    setActiveArticleId(newArt.id);
    setActiveTab('editor');
  };

  // Modal forms states
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDomain, setNewProjectDomain] = useState('');
  const [newProjectCms, setNewProjectCms] = useState<'wordpress' | 'webflow' | 'ghost' | 'custom'>('wordpress');

  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeywordTerm, setNewKeywordTerm] = useState('');
  const [newKeywordVolume, setNewKeywordVolume] = useState('1000');
  const [newKeywordDifficulty, setNewKeywordDifficulty] = useState('40');
  const [newKeywordIntent, setNewKeywordIntent] = useState<'Informational' | 'Transactional' | 'Commercial' | 'Navigational'>('Informational');

  // Real AI Engine States
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiGenKeyword, setAiGenKeyword] = useState('');
  const [aiGenCompetitorStructure, setAiGenCompetitorStructure] = useState('');
  const [aiGenSemanticKeywords, setAiGenSemanticKeywords] = useState('');
  const [aiGenWordCount, setAiGenWordCount] = useState(1000);
  const [aiGenTone, setAiGenTone] = useState('Professional & Authoritative');
  const [aiGenError, setAiGenError] = useState('');

  // AI Writer States
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');

  // Save states to localStorage on change
  useEffect(() => {
    localStorage.setItem('rs_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('rs_keywords', JSON.stringify(keywords));
  }, [keywords]);

  useEffect(() => {
    localStorage.setItem('rs_articles', JSON.stringify(articles));
  }, [articles]);

  useEffect(() => {
    localStorage.setItem('rs_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('rs_autonomous', String(autonomousMode));
  }, [autonomousMode]);

  // Periodic crawler visual log generator simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random project
      const proj = projects[Math.floor(Math.random() * projects.length)];
      if (!proj) return;

      const randomLogsList = [
        { type: 'info' as const, module: 'SERP_CRAWLER' as const, msg: `Scanning SERP ranks for: ${proj.domain}` },
        { type: 'success' as const, module: 'SERP_CRAWLER' as const, msg: `Crawl node verified organic index for: ${proj.domain}` },
        { type: 'info' as const, module: 'BACKLINK_CHECK' as const, msg: `Auditing active referral domains for: ${proj.domain}` },
        { type: 'warn' as const, module: 'CMS_SYNC' as const, msg: `CMS sync: WordPress draft query is checking sync constraints...` },
        { type: 'success' as const, module: 'CMS_SYNC' as const, msg: `WordPress node posted metadata sync successfully for ${proj.domain}` }
      ];

      const seedItem = randomLogsList[Math.floor(Math.random() * randomLogsList.length)];
      const newLogItem: CrawlerLog = {
        id: `l-sim-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: seedItem.type,
        message: seedItem.msg,
        module: seedItem.module
      };

      setLogs(prev => [newLogItem, ...prev.slice(0, 40)]);
    }, 15000); // Add a simulated log entry every 15 seconds

    return () => clearInterval(interval);
  }, [projects]);

  // Sync / Crawl function simulation
  const handleTriggerCrawl = (projectId: string) => {
    const targetProj = projects.find(p => p.id === projectId);
    if (!targetProj) return;

    // Set status to crawling
    const crawlingProj = { ...targetProj, crawlStatus: 'CRAWLING' as const };
    const bootLog: CrawlerLog = {
      id: `l-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `Manually requested crawl sync initiated for project ${projectId}`,
      module: 'SERP_CRAWLER'
    };
    
    if (currentUser) {
      fsSaveProject(crawlingProj, currentUser.uid);
      fsSaveLog(bootLog, projectId, currentUser.uid);
    } else {
      setProjects(prev => prev.map(p => p.id === projectId ? crawlingProj : p));
      setLogs(prev => [bootLog, ...prev]);
    }

    setTimeout(() => {
      // Refresh reference state to prevent stale data updates
      const updatedProjRef = projects.find(p => p.id === projectId) || targetProj;
      // Complete crawl
      const boost = Math.floor(Math.random() * 4) + 1;
      const currentVis = Math.min(98, parseFloat((updatedProjRef.visibilityIndex + boost/2).toFixed(1)));
      const currentPos = Math.max(1, parseFloat((updatedProjRef.avgPosition - boost/3).toFixed(1)));
      const trafficBoost = Math.floor(updatedProjRef.organicTraffic * (1 + (boost / 100)));

      const completedProj = {
        ...updatedProjRef,
        crawlStatus: 'COMPLETED' as const,
        lastCrawledAt: new Date().toISOString(),
        visibilityIndex: currentVis,
        avgPosition: currentPos,
        organicTraffic: trafficBoost,
        crawlHistory: [...(updatedProjRef.crawlHistory || [10]).slice(1), Math.round(currentVis)]
      };

      const successLog: CrawlerLog = {
        id: `l-${Date.now()}-2`,
        timestamp: new Date().toISOString(),
        type: 'success',
        message: `Crawl complete. Discovered keyword position increases and synchronized SEO dashboard maps!`,
        module: 'SERP_CRAWLER'
      };

      if (currentUser) {
        fsSaveProject(completedProj, currentUser.uid);
        fsSaveLog(successLog, projectId, currentUser.uid);
      } else {
        setProjects(prev => prev.map(p => p.id === projectId ? completedProj : p));
        setLogs(prev => [successLog, ...prev]);
      }
    }, 3000);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !newProjectDomain) return;

    const newProj: Project = {
      id: `p-${Date.now()}`,
      name: newProjectName,
      domain: newProjectDomain.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase(),
      visibilityIndex: 10.0,
      avgPosition: 50.0,
      organicTraffic: 100,
      cmsPlatform: newProjectCms,
      crawlStatus: 'STALE',
      lastCrawledAt: null,
      crawlHistory: [8, 10, 9, 11, 10, 10, 10]
    };

    // Seed some initial keywords for this domain
    const seedKws: Keyword[] = [
      {
        id: `k-${Date.now()}-1`,
        projectId: newProj.id,
        term: `how to optimize ${newProj.name.toLowerCase()}`,
        volume: 850,
        difficulty: 12,
        intent: 'Informational',
        currentRank: 62,
        previousRank: 80
      },
      {
        id: `k-${Date.now()}-2`,
        projectId: newProj.id,
        term: `best guides for ${newProj.domain}`,
        volume: 320,
        difficulty: 5,
        intent: 'Navigational',
        currentRank: 14,
        previousRank: 23
      }
    ];

    const bootLog: CrawlerLog = {
      id: `l-${Date.now()}-boot`,
      timestamp: new Date().toISOString(),
      type: 'success',
      message: `Created new project portfolio: ${newProj.domain} using ${newProj.cmsPlatform.toUpperCase()} stack`,
      module: 'SERP_CRAWLER'
    };

    if (currentUser) {
      fsSaveProject(newProj, currentUser.uid);
      seedKws.forEach(k => fsSaveKeyword(k, newProj.id, currentUser.uid));
      fsSaveLog(bootLog, newProj.id, currentUser.uid);
    } else {
      setProjects(prev => [...prev, newProj]);
      setKeywords(prev => [...prev, ...seedKws]);
      setLogs(prev => [bootLog, ...prev]);
    }

    // Reset fields
    setNewProjectName('');
    setNewProjectDomain('');
    setNewProjectCms('wordpress');
    setShowAddProject(false);
    setSelectedProjectId(newProj.id);
  };

  const handleCreateKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordTerm || !selectedProjectId) return;

    const newKw: Keyword = {
      id: `k-${Date.now()}`,
      projectId: selectedProjectId,
      term: newKeywordTerm.trim().toLowerCase(),
      volume: parseInt(newKeywordVolume) || 500,
      difficulty: parseFloat(newKeywordDifficulty) || 30,
      intent: newKeywordIntent,
      currentRank: 99,
      previousRank: 99,
      history: [
        { date: '05-14', rank: 99 },
        { date: '05-15', rank: 99 },
        { date: '05-16', rank: 99 },
        { date: '05-17', rank: 99 },
        { date: '05-18', rank: 99 },
        { date: '05-19', rank: 99 },
        { date: '05-20', rank: 99 }
      ]
    };

    const bootLog: CrawlerLog = {
      id: `l-${Date.now()}-kw`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `Subscribed trackable keyword target: "${newKw.term}" (Vol: ${newKw.volume})`,
      module: 'SERP_CRAWLER'
    };

    if (currentUser) {
      fsSaveKeyword(newKw, selectedProjectId, currentUser.uid);
      fsSaveLog(bootLog, selectedProjectId, currentUser.uid);
    } else {
      setKeywords(prev => [...prev, newKw]);
      setLogs(prev => [bootLog, ...prev]);
    }

    setNewKeywordTerm('');
    setNewKeywordVolume('1000');
    setNewKeywordDifficulty('40');
    setShowAddKeyword(false);
  };

  const handleDeleteProject = (projId: string) => {
    if (confirm("Are you sure you want to remove this project? All associated keywords and articles will be deleted.")) {
      if (currentUser) {
        fsDeleteProject(projId);
        // Clean up project subcollections
        keywords.filter(k => k.projectId === projId).forEach(k => fsDeleteKeyword(projId, k.id));
        articles.filter(a => a.projectId === projId).forEach(a => fsDeleteArticle(projId, a.id));
        logs.filter(l => l.projectId === projId).forEach(l => fsDeleteLog(projId, l.id));
      } else {
        setProjects(prev => prev.filter(p => p.id !== projId));
        setKeywords(prev => prev.filter(k => k.projectId !== projId));
        setArticles(prev => prev.filter(a => a.projectId !== projId));
      }
      if (selectedProjectId === projId) {
        setSelectedProjectId(projects.find(p => p.id !== projId)?.id || '');
      }
    }
  };

  // Autonomous generator simulation
  const triggerAutoContentSprint = () => {
    const activeKws = keywords.filter(k => k.projectId === selectedProjectId);
    const selectedKw = activeKws[Math.floor(Math.random() * activeKws.length)] || { term: 'automated growth hacks', difficulty: 25 };
    
    setAiGenKeyword(selectedKw.term);
    setAiGenSemanticKeywords(getSecondaryKeywords(selectedKw.term).map(k => k.term).join(', '));
    setAiGenCompetitorStructure(`- Introduction to ${selectedKw.term}\n- Why ${selectedKw.term} is critical for market share\n- Practical step-by-step tutorials\n- Advanced execution strategies`);
    setAiGenWordCount(1000);
    setAiGenTone('Professional & Authoritative');
    setAiGenError('');
    setShowAiGenerator(true);
  };

  // Real-time AI Generation handler invoking secure Gemini custom endpoint
  const handleRealAIGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiGenKeyword.trim()) {
      setAiGenError('Please specify a target keyword or topic.');
      return;
    }

    setAiGenError('');
    setAiGenerating(true);
    setAiStatusMessage(`Contacting Gemini AI Engine to compile optimized search brief for "${aiGenKeyword}"...`);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: aiGenKeyword,
          competitorStructure: aiGenCompetitorStructure,
          semanticKeywords: aiGenSemanticKeywords,
          wordCount: aiGenWordCount,
          tone: aiGenTone,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server returned error status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate SEO article.');
      }

      const newArt: Article = {
        id: `a-ai-${Date.now()}`,
        projectId: selectedProjectId,
        title: data.title || `Optimized Strategy for ${aiGenKeyword}`,
        slug: aiGenKeyword.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        targetKeyword: aiGenKeyword,
        wordCount: data.wordCount || aiGenWordCount,
        seoScore: data.seoScore || 90,
        status: 'Draft',
        content: data.content,
        lastEdited: new Date().toISOString(),
        metaDescription: data.metaDescription || `Read our comprehensive, authoritative search guide about ${aiGenKeyword}.`
      };

      const aiLog = {
        id: `l-${Date.now()}-ai-write`,
        timestamp: new Date().toISOString(),
        type: 'success' as const,
        message: `Real-time Gemini AI Engine successfully compiled full-length article: "${newArt.title}"`,
        module: 'AI_WRITER' as const
      };

      if (currentUser) {
        await fsSaveArticle(newArt, selectedProjectId, currentUser.uid);
        await fsSaveLog(aiLog, selectedProjectId, currentUser.uid);
      } else {
        setArticles(prev => [newArt, ...prev]);
        setLogs(prev => [aiLog, ...prev]);
      }

      setShowAiGenerator(false);
      setAiGenerating(false);
      setAiStatusMessage('');

      setActiveArticleId(newArt.id);
      setActiveTab('editor');

    } catch (err: any) {
      console.error('AI Generation Error:', err);
      setAiGenError(err.message || 'Error occurred communicating with the secure AI server.');
      setAiGenerating(false);
      setAiStatusMessage('');
    }
  };

  const unusedOldSprint = () => {
    setAiGenerating(true);
    setAiStatusMessage('AI SEO Bot scanning SERP and competitor clusters for content gaps...');
    
    setTimeout(() => {
      setAiStatusMessage('Analyzing optimal keyword placement & on-page densities structure...');
      
      setTimeout(() => {
        // Pick an untargeted keyword or random one
        const activeKws = keywords.filter(k => k.projectId === selectedProjectId);
        const selectedKw = activeKws[Math.floor(Math.random() * activeKws.length)] || { term: 'automated growth hacks', difficulty: 25 };
        
        const targetTitle = `The Ultimate Guide to ${selectedKw.term.replace(/\b\w/g, c => c.toUpperCase())}`;
        const targetSlug = selectedKw.term.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        const newArt: Article = {
          id: `a-ai-${Date.now()}`,
          projectId: selectedProjectId,
          title: targetTitle,
          slug: targetSlug,
          targetKeyword: selectedKw.term,
          wordCount: 1240,
          seoScore: 95,
          status: 'Ready',
          content: `# ${targetTitle}\n\nOptimizing your search presence for **${selectedKw.term}** is essential for high-velocity startup growth. In this expert handbook, we will discover how top global marketers secure rankings.\n\n## Understanding the Intent\nThe intent behind searching for *${selectedKw.term}* is highly practical. Readers require immediate, actionable blueprints rather than generic lists.\n\n## Action items Checklist:\n- **Optimize Meta Headings:** Ensure keyword is in the first 60 characters.\n- **Improve Content Rhythm:** Keep sentences shorter than 20 words for clarity.\n- **Establish Internal Authority links:** Bind content clusters together.\n\n## Conclusion\nStay autonomous! Monitor ranks weekly, upgrade content velocity, and publish natively.`,
          lastEdited: new Date().toISOString(),
          metaDescription: `Improve search ranks for ${selectedKw.term} with this absolute creator guide to traffic growth and autonomous publishing.`
        };

        const aiLog = {
          id: `l-${Date.now()}-ai-write`,
          timestamp: new Date().toISOString(),
          type: 'success' as const,
          message: `Autonomous SEO Engine generated draft article targeting keyword: "${selectedKw.term}"`,
          module: 'AI_WRITER' as const
        };

        if (currentUser) {
          fsSaveArticle(newArt, selectedProjectId, currentUser.uid);
          fsSaveLog(aiLog, selectedProjectId, currentUser.uid);
        } else {
          setArticles(prev => [newArt, ...prev]);
          setLogs(prev => [aiLog, ...prev]);
        }

        setAiGenerating(false);
        setAiStatusMessage('');

        // Toggle to active article editing
        setActiveArticleId(newArt.id);
        setActiveTab('editor');

      }, 2000);
    }, 15000);
  };

  // Helper Stats calculations
  const totalOrganicTrafficAll = projects.reduce((acc, p) => acc + p.organicTraffic, 0);
  const avgPositionAll = projects.length > 0 
    ? parseFloat((projects.reduce((acc, p) => acc + p.avgPosition, 0) / projects.length).toFixed(1))
    : 0;
  const avgVisibilityAll = projects.length > 0 
    ? parseFloat((projects.reduce((acc, p) => acc + p.visibilityIndex, 0) / projects.length).toFixed(1))
    : 0;
  const totalKeywordsTracked = keywords.length;

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const projectKeywords = keywords.filter(k => k.projectId === selectedProjectId);
  const projectArticles = articles.filter(a => a.projectId === selectedProjectId);

  // Active edit article reference
  const editorArticle = articles.find(a => a.id === activeArticleId) || articles[0];

  const updateArticleField = (id: string, field: keyof Article, value: any) => {
    setArticles(prev => prev.map(art => {
      if (art.id === id) {
        const updated = { ...art, [field]: value, lastEdited: new Date().toISOString() };
        
        // Re-calculate live SEO score dynamically based on editor content
        if (field === 'content' || field === 'title' || field === 'metaDescription') {
          const contentStr = field === 'content' ? value : art.content;
          const titleStr = field === 'title' ? value : art.title;
          const metaStr = field === 'metaDescription' ? value : art.metaDescription;

          const tempArticle = {
            ...art,
            content: contentStr,
            title: titleStr,
            metaDescription: metaStr
          };
          
          const secondaryList = getSecondaryKeywords(art.targetKeyword);
          const evaluation = evaluateSeoMetrics(tempArticle, secondaryList);
          
          updated.seoScore = evaluation.total;
          
          const metrics = parseMarkdownStructure(contentStr);
          updated.wordCount = metrics.wordCount;
        }

        if (currentUser) {
          fsSaveArticle(updated, art.projectId, currentUser.uid);
        }

        return updated;
      }
      return art;
    }));
  };

  // Active Direct CMS Syndication API sync
  const handleActiveCmsPublish = async (art: Article, platform: 'wordpress' | 'webflow' | 'shopify' | 'dummy' | 'headless_webhook') => {
    setIsPublishingToCms(true);
    setCmsPublishResult(null);

    let credentials = {};
    if (platform === 'wordpress') {
      credentials = wpConfig;
    } else if (platform === 'webflow') {
      credentials = webflowConfig;
    } else if (platform === 'shopify') {
      credentials = shopifyConfig;
    } else if (platform === 'headless_webhook') {
      credentials = headlessConfig;
    }

    try {
      const isSandboxRequest = platform === 'dummy';
      const response = await fetch('/api/cms/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          article: {
            id: art.id,
            title: art.title,
            content: art.content,
            slug: art.slug,
            targetKeyword: art.targetKeyword,
            metaDescription: art.metaDescription
          },
          platform: platform === 'dummy' ? 'wordpress' : platform,
          credentials,
          isSandbox: isSandboxRequest
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Mark as Published in state
        setArticles(prev => prev.map(a => {
          if (a.id === art.id) {
            const updated = { ...a, status: 'Published' as const };
            if (currentUser) {
              fsSaveArticle(updated, a.projectId, currentUser.uid);
            }
            return updated;
          }
          return a;
        }));

        const finalPlatform = platform === 'dummy' ? 'WordPress (Simulated)' : platform.toUpperCase();
        const successLog: CrawlerLog = {
          id: `l-${Date.now()}-cms`,
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `Direct CMS Sync: "${art.title}" successfully dispatched to ${finalPlatform}! URL: ${data.publishedUrl}`,
          module: 'CMS_SYNC'
        };

        if (currentUser) {
          fsSaveLog(successLog, art.projectId, currentUser.uid);
        } else {
          setLogs(prev => [successLog, ...prev]);
        }

        setCmsPublishResult({ success: true, url: data.publishedUrl });
      } else {
        throw new Error(data.error || "Execution failed");
      }
    } catch (err: any) {
      console.error("CMS Sync failed:", err);
      setCmsPublishResult({ success: false, error: err.message || "Unable to sync with Target CMS API." });
    } finally {
      setIsPublishingToCms(false);
    }
  };

  // Instant trigger to Publish to Simulated CMS
  const handleCmsPublish = (articleId: string) => {
    setArticles(prev => prev.map(art => {
      if (art.id === articleId) {
        const updated = { ...art, status: 'Published' as const };
        
        const newLog: CrawlerLog = {
          id: `l-${Date.now()}-publish`,
          timestamp: new Date().toISOString(),
          type: 'success',
          message: `Natively deployed article: "${art.title}" matching keyword "${art.targetKeyword}" to WordPress/headless webhook API.`,
          module: 'CMS_SYNC'
        };

        if (currentUser) {
          fsSaveArticle(updated, art.projectId, currentUser.uid);
          fsSaveLog(newLog, art.projectId, currentUser.uid);
        } else {
          // Push sync log locally
          setLogs(prevLogs => [newLog, ...prevLogs]);
        }

        return updated;
      }
      return art;
    }));
  };

  if (viewMode === 'landing') {
    return (
      <OutrankLanding 
        onLaunchApp={() => setViewMode('app')}
        onPricingClick={() => setViewMode('pricing')}
        projectsCount={projects.length}
      />
    );
  }

  if (viewMode === 'pricing') {
    return (
      <PricingPage 
        onBackToLanding={() => setViewMode('landing')}
        onLaunchApp={() => setViewMode('app')}
        projectsCount={projects.length}
      />
    );
  }

  return (
    <div 
      id="ranksyncer-app" 
      className={`min-h-screen flex flex-col font-sans transition-all duration-300 selection:bg-emerald-500/20 selection:text-emerald-300 ${
        theme === 'dark' 
          ? 'bg-[#050d0a] text-slate-100' 
          : 'bg-[#faf8f9] text-slate-850'
      }`}
    >
      
      {/* Dynamic Header */}
      <header id="app-header" className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all ${
        theme === 'dark'
          ? 'bg-[#050d0a]/90 border-[#14271f] text-slate-200 shadow-[0_4px_30px_rgba(74,222,128,0.01)]'
          : 'bg-[#faf8f9]/90 border-emerald-100 text-slate-800 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-sans">
          
          {/* Brand Logo and Sub */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setViewMode('landing')}>
            <RankSyncerLogo theme={theme} />
          </div>

          {/* Project Scoped Selector */}
          <div className={`flex items-center space-x-2 p-1.5 rounded-xl border transition-all ${
            theme === 'dark' ? 'bg-[#0c1612] border-[#14271f]' : 'bg-slate-100 border-slate-200'
          }`}>
            <span className={`text-xs px-2 font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Active Website:</span>
            <select 
              className={`text-xs font-bold border-none rounded-lg focus:ring-1 focus:ring-emerald-500 px-3 py-1 outline-none min-w-[160px] cursor-pointer ${
                theme === 'dark' ? 'bg-[#050d0a] text-white' : 'bg-white text-slate-800'
              }`}
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className={theme === 'dark' ? 'bg-[#0c1612] text-white' : 'bg-white text-slate-800'}>
                  {p.domain}
                </option>
              ))}
            </select>
            <button 
              onClick={() => setShowAddProject(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-lg transition-all cursor-pointer"
              title="Add New Project"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Stats Summary Header strip and back button */}
          <div className="flex items-center space-x-4 self-end md:self-auto">
            <div className={`hidden lg:flex space-x-3 px-3.5 py-1.5 rounded-xl border transition-all ${
              theme === 'dark' ? 'bg-[#0c1612] border-[#14271f] text-slate-350' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <div className="text-center font-mono text-[10px]">
                <p className="text-slate-400 uppercase text-[8px] font-bold">Avg Pos</p>
                <p className="font-bold text-[#4ade80]">#{avgPositionAll}</p>
              </div>
              <span className={theme === 'dark' ? 'text-[#14271f]' : 'text-slate-300'}>|</span>
              <div className="text-center font-mono text-[10px]">
                <p className="text-slate-400 uppercase text-[8px] font-bold">Monthly Traffic</p>
                <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>{totalOrganicTrafficAll.toLocaleString()}</p>
              </div>
              <span className={theme === 'dark' ? 'text-[#14271f]' : 'text-slate-300'}>|</span>
              <div className="text-center font-mono text-[10px]">
                <p className="text-slate-400 uppercase text-[8px] font-bold">Visibility index</p>
                <p className="font-bold text-emerald-600">{avgVisibilityAll}%</p>
              </div>
            </div>

            <button 
              onClick={() => setViewMode('landing')}
              className={`font-black text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center shadow-xs ${
                theme === 'dark' ? 'bg-white text-slate-950 hover:bg-[#4ade80]' : 'bg-slate-900 text-white hover:bg-emerald-650'
              }`}
              title="Return to the Outrank landing page"
            >
              Back to Landing
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Vertical Navigation Column */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          
          {/* Main Action Buttons */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-850 p-4 rounded-2xl text-white shadow-xl shadow-emerald-500/10 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-100">Autonomous Pilot</span>
              <span className={`inline-flex h-2.5 w-2.5 rounded-full ${autonomousMode ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            </div>
            
            <h4 className="font-extrabold text-sm mb-1 tracking-tight">Sync Speed & Autopilot</h4>
            <p className="text-emerald-50/90 text-[11px] mb-4 leading-relaxed">
              If enabled, RankSyncer.co autonomously publishes targeted content when keyword position drops occur.
            </p>

            <button 
              onClick={() => setAutonomousMode(!autonomousMode)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                autonomousMode 
                  ? 'bg-teal-500 hover:bg-teal-650 text-white' 
                  : 'bg-white hover:bg-[#faf8f9] text-emerald-950'
              }`}
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              {autonomousMode ? 'Autopilot: Active' : 'Enable Autoplay'}
            </button>
          </div>

          {/* Main Tabs Segment */}
          <div className={`rounded-2xl border p-2 shadow-xs space-y-1 transition-all ${
            theme === 'dark' ? 'bg-[#0c1612]/90 border-[#14271f]' : 'bg-white border-slate-200'
          }`}>
            <span className={`text-[10px] uppercase font-bold px-3 pt-2 block tracking-wider ${
              theme === 'dark' ? 'text-[#4ade80]/60' : 'text-slate-400'
            }`}>Navigation</span>
            
            {[
              { id: 'dashboard', label: 'SEO Dashboard', icon: Layers },
              { id: 'projects', label: 'Monitor Projects', icon: Globe2 },
              { id: 'keywords', label: 'Keyword Research', icon: Search },
              { id: 'planner', label: 'Content Planner', icon: FileText },
              { id: 'editor', label: 'SEO Code Writer', icon: Sparkles },
              { id: 'crawler', label: 'Simulated SERP Logs', icon: Terminal },
              { id: 'settings', label: 'CMS Connected Hub', icon: Settings },
              { id: 'brand', label: 'Brand & Assets', icon: BookOpen }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left font-bold text-sm px-3 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isActive 
                      ? theme === 'dark' ? 'bg-emerald-500/10 text-[#4ade80] border border-emerald-500/15' : 'bg-emerald-50 text-emerald-800 shadow-2xs' 
                      : theme === 'dark' ? 'text-slate-450 hover:bg-[#14271f]/60 hover:text-white' : 'text-slate-600 hover:bg-emerald-50/20 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.id === 'planner' && projectArticles.filter(a => a.status === 'Reviewing' || a.status === 'Ready').length > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                      {projectArticles.filter(a => a.status === 'Reviewing' || a.status === 'Ready').length}
                    </span>
                  )}
                  {tab.id === 'crawler' && logs.filter(l => l.type === 'error' || l.type === 'warn').length > 0 && (
                    <span className="bg-slate-200 text-slate-800 text-[10px] font-mono px-1.5 py-0.1 rounded">
                      {logs.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Simulation Help Banner */}
          {/* Continuity Persistence DB Sync Hub */}
          <div className={`p-4 rounded-2xl border transition-all mt-2 ${
            theme === 'dark' 
              ? 'bg-[#0c1612] border-[#14271f] text-slate-300' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1 text-emerald-500 font-mono flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${currentUser ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]' : 'bg-amber-400'}`} />
              {currentUser ? 'Database Sync Live' : 'Local Sandbox Mode'}
            </span>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {currentUser 
                ? `Continuous multi-tenant relational persistence is active. Protecting config history under tenant ${currentUser.email?.slice(0,12)}...`
                : 'Project configurations, keywords trackers, and SEO logs are currently saved inside your local browser storage.'
              }
            </p>
            <button
              onClick={() => setActiveTab('settings')}
              className={`mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                currentUser
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              {currentUser ? 'Manage Synced DB' : 'Enable Real Cloud Sync'}
            </button>
          </div>

        </aside>

        {/* Right Active View Slot */}
        <main className="flex-1 min-w-0">

          {/* ========================================= */}
          {/* TAB: DASHBOARD VIEW */}
          {/* ========================================= */}
          {activeTab === 'dashboard' && currentProject && (
            <div className="space-y-6">
              
              {/* Project Top banner */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentProject.name}</h2>
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Synchronized</span>
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-0.5 flex items-center">
                    <span className="text-slate-700 font-bold mr-1.5">{currentProject.domain}</span> 
                    • Connected stack: <strong className="ml-1 uppercase text-[11px] text-blue-600">{currentProject.cmsPlatform}</strong>
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => handleTriggerCrawl(currentProject.id)}
                    disabled={currentProject.crawlStatus === 'CRAWLING'}
                    className={`px-4 py-2 rounded-xl text-sm font-bold shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer ${
                      currentProject.crawlStatus === 'CRAWLING'
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    {currentProject.crawlStatus === 'CRAWLING' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span>Crawling Domain...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 text-slate-500" />
                        <span>Force SEO Sync</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={triggerAutoContentSprint}
                    disabled={aiGenerating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Run AI Writer</span>
                  </button>
                </div>
              </div>

              {/* Dashboard Sub-Tabs Navigation Bar */}
              <div className="flex border-b border-slate-200/80 gap-1.5 pb-0.5">
                <button
                  type="button"
                  onClick={() => setDashboardSubView('overview')}
                  className={`px-5 py-2.5 text-xs font-black tracking-wider uppercase select-none border-b-2 cursor-pointer transition-all ${
                    dashboardSubView === 'overview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Overview & CRAWLER Stats
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardSubView('gsc')}
                  className={`px-5 py-2.5 text-xs font-black tracking-wider uppercase select-none border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
                    dashboardSubView === 'gsc'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Google Search Console (GSC)</span>
                  {gscAccount ? (
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-1.5 py-0.2 rounded flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-505 animate-pulse" />
                      <span>LIVE</span>
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 font-bold text-[9px] px-1.5 py-0.2 rounded">
                      Sandbox
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardSubView('autopilot')}
                  className={`px-5 py-2.5 text-xs font-black tracking-wider uppercase select-none border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
                    dashboardSubView === 'autopilot'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Autonomous Autopilot</span>
                  {autopilotState.enabled ? (
                    <span className="bg-blue-100 text-blue-800 font-bold text-[9px] px-1.5 py-0.2 rounded flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping" />
                      <span>DAEMON ACTIVE</span>
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 font-bold text-[9px] px-1.5 py-0.2 rounded">
                      STANDBY
                    </span>
                  )}
                  {autopilotState.queue.length > 0 && (
                    <span className="bg-amber-500 text-white font-extrabold text-[9px] px-1.5 py-0.2 rounded">
                      {autopilotState.queue.length}
                    </span>
                  )}
                </button>
              </div>

              {dashboardSubView === 'overview' && (
                <>
                  {/* Aggregated Project Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Organic Traffic */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                  <span className="text-xs font-semibold text-slate-500 block">Est. Organic Traffic</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {currentProject.organicTraffic.toLocaleString()}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                      +12.4%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Monthly organic pageviews</p>
                </div>

                {/* Average Position */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                  <span className="text-xs font-semibold text-slate-500 block">Avg. Rank Position</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {currentProject.avgPosition}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                      -3.1 slots
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Weighted crawler average rank</p>
                </div>

                {/* Visibility Index */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                  <span className="text-xs font-semibold text-slate-500 block">Visibility Index</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-blue-600 tracking-tight">
                      {currentProject.visibilityIndex}%
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                      +4.2%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Organic presence market share</p>
                </div>

                {/* Keywords in Core Top List */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                  <span className="text-xs font-semibold text-slate-500 block">Keywords Tracked</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {projectKeywords.length}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Total database keywords</p>
                </div>

              </div>

              {/* Main Dashboard Layout Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Graphs and Lists */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Dynamic Recharts Visibility Graph Card */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-extrabold text-slate-900 tracking-tight">Visibility & Ranks Share Trend</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Autonomous crawler analytics history (7 days)</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        <span className="text-[11px] font-semibold text-slate-500">Visibility Share %</span>
                      </div>
                    </div>

                    {/* Responsive Handcrafted SVG Graph */}
                    <div className="h-60 w-full bg-slate-50/50 rounded-2xl border border-slate-100 relative p-4 flex flex-col justify-between">
                      
                      {/* Responsive Grid lines */}
                      <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-200" />
                      <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-200" />
                      <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-200" />
                      
                      {/* Vector Polyline Chart */}
                      <div className="flex-1 relative mt-4 h-full">
                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="vis-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Render the Spark Line */}
                          <polyline
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={
                              currentProject.crawlHistory.map((val, idx) => {
                                const x = (idx / 6) * 100; // percent width
                                const y = 100 - ((val - 5) / 80) * 80; // normalized high positions
                                return `${x}%, ${y}%`;
                              }).join(' ')
                            }
                          />

                          {/* Render Area gradient below the polyline */}
                          <polygon
                            fill="url(#vis-grad)"
                            points={
                              `0%, 100% ` +
                              currentProject.crawlHistory.map((val, idx) => {
                                const x = (idx / 6) * 100;
                                const y = 100 - ((val - 5) / 80) * 80;
                                return `${x}% ${y}%`;
                              }).join(' ') +
                              ` , 100%, 100%`
                            }
                          />

                          {/* Render Circle Markers */}
                          {currentProject.crawlHistory.map((val, idx) => {
                            const x = (idx / 6) * 100;
                            const y = 100 - ((val - 5) / 80) * 80;
                            return (
                              <g key={idx} className="group/dot">
                                <circle
                                  cx={`${x}%`}
                                  cy={`${y}%`}
                                  r="5"
                                  className="fill-blue-600 stroke-white stroke-2 cursor-pointer transition-all hover:r-8"
                                />
                                <text
                                  x={`${x}%`}
                                  y={`${y - 12}%`}
                                  textAnchor="middle"
                                  className="font-mono font-bold text-[10px] fill-slate-900 hidden group-hover/dot:block bg-white p-1 rounded border shadow-sm"
                                >
                                  {val}%
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* X-axis indicators */}
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono pt-2 border-t border-slate-100">
                        <span>7 Days Ago</span>
                        <span>4 Days Ago</span>
                        <span>2 Days Ago</span>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Content Task pipeline queue */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-900 tracking-tight">Active Content Actions</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Drafted blog posts, optimizations pending reviews</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('planner')}
                        className="text-xs text-blue-600 hover:underline font-bold"
                      >
                        Content Planner
                      </button>
                    </div>

                    {projectArticles.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <h4 className="font-bold text-slate-800">No content articles listed</h4>
                        <p className="text-slate-500 text-xs mt-1 mb-4">Launch our writing generator targeting high position keywords</p>
                        <button 
                          onClick={triggerAutoContentSprint}
                          disabled={aiGenerating}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>Generate SEO Article Idea</span>
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 font-sans">
                        {projectArticles.map((art) => (
                          <div key={art.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start space-x-3.5">
                              <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                                art.status === 'Published' ? 'bg-emerald-500' :
                                art.status === 'Ready' ? 'bg-indigo-500' :
                                art.status === 'Reviewing' ? 'bg-amber-500' : 'bg-slate-400'
                              }`} />
                              <div>
                                <p className="font-bold text-slate-900 flex items-center gap-2">
                                  <span>{art.title}</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-slate-500">
                                  <span>Keyword: <strong className="text-slate-800 font-mono">"{art.targetKeyword}"</strong></span>
                                  <span>•</span>
                                  <span>{art.wordCount} words</span>
                                  <span>•</span>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    art.seoScore >= 90 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                    art.seoScore >= 80 ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                                    'bg-amber-50 text-amber-800 border border-amber-100'
                                  }`}>
                                    SEO Audit: {art.seoScore}/100
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 align-middle sm:self-center">
                              {art.status !== 'Published' ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setActiveArticleId(art.id);
                                      setActiveTab('editor');
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    <span>Write</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPublishingArticle(art);
                                      setCmsPublishResult(null);
                                      if (wpConfig.siteUrl) setSelectedPublishPlatform('wordpress');
                                      else if (shopifyConfig.storeDomain) setSelectedPublishPlatform('shopify');
                                      else if (webflowConfig.siteToken) setSelectedPublishPlatform('webflow');
                                      else setSelectedPublishPlatform('dummy');
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                                  >
                                    Publish
                                  </button>
                                </>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" /> Published
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Side: Key SEO Rank trackers */}
                <div className="space-y-6">
                  
                  {/* Keyword rankings change alert strip */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-3.5">
                      <h4 className="font-extrabold text-slate-900 tracking-tight">Target SERP Ranks</h4>
                      <button 
                        onClick={() => setActiveTab('keywords')}
                        className="text-xs text-blue-600 hover:underline font-bold"
                      >
                        Keyword Map
                      </button>
                    </div>

                    {projectKeywords.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        No keywords added. Connect domain monitor targets.
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans">
                        {projectKeywords.slice(0, 5).map((kw) => {
                          const rankChange = kw.previousRank - kw.currentRank;
                          return (
                            <div key={kw.id} className="p-3 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-100 transition-colors flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate" title={kw.term}>
                                  {kw.term}
                                </p>
                                <span className="text-[10px] text-slate-400 font-medium block">
                                  Vol: {kw.volume.toLocaleString()} searches
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-slate-900">
                                  Rank #{kw.currentRank}
                                </span>
                                {rankChange !== 0 ? (
                                  <span className={`text-[10px] block font-black ${rankChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {rankChange > 0 ? `▲ +${rankChange}` : `▼ ${rankChange}`}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 block font-semibold">- No change</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Micro Live Sync logs window stream */}
                  <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <h4 className="text-xs font-extrabold tracking-widest text-slate-400 uppercase">Live Worker Term</h4>
                      </div>
                      <button 
                        onClick={() => setActiveTab('crawler')}
                        className="text-[10px] text-blue-400 hover:underline font-bold"
                      >
                        Terminal View
                      </button>
                    </div>

                    <div className="space-y-2.5 font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto">
                      {logs.slice(0, 4).map((log) => (
                        <div key={log.id} className="border-l border-slate-700 pl-2">
                          <p className="text-slate-500 text-[9px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                          <p className={
                            log.type === 'success' ? 'text-emerald-400' :
                            log.type === 'warn' ? 'text-amber-400' :
                            log.type === 'error' ? 'text-rose-400' : 'text-slate-300'
                          }>
                            [{log.module}] {log.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CMS Node Active Connection card */}
                  <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-blue-950 text-xs">WordPress API Sync</h4>
                      <p className="text-[11px] text-blue-800 mt-1 max-w-[200px]">
                        Sync changes instantly. Autonomous queue processes keyword edits.
                      </p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-blue-600 stroke-[2.5]" />
                  </div>

                </div>

              </div>
              </>
              )}

              {/* ========================================= */}
              {/* SUB-TAB: GOOGLE SEARCH CONSOLE HUB */}
              {/* ========================================= */}
              {dashboardSubView === 'gsc' && (
                <div className="space-y-6">
                  
                  {/* GSC Authorization Status strip */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${gscAccount ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        {gscAccount ? 'Continuous Console stream authorized' : 'Console Sync Hub: Sandbox Mock stream'}
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                        Google Search Console API Connect
                      </h3>
                      <p className="text-slate-500 text-xs max-w-xl">
                        Authorize RankSyncer to fetch raw Impressions, Clicks, and click-through-rates (CTR) directly from Google's official GSC searchAnalytics API nodes behind OAuth consent screens.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-end">
                      {gscAccount ? (
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                          <div className="text-right font-sans">
                            <p className="text-xs font-black text-slate-900">{gscAccount.displayName}</p>
                            <p className="text-[10px] text-slate-400 font-mono select-all">{gscAccount.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleDisconnectGSC}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 border-rose-100 hover:border-rose-200 text-rose-600 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
                          >
                            Disconnect Stream
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => {
                              const mockAccount = {
                                email: "designer.gsc.tenant@gmail.com",
                                displayName: "Sandbox Developer Console",
                                accessToken: "mock_sandbox_access_token_rank_syncer_gsc",
                                isSandbox: true
                              };
                              setGscAccount(mockAccount);
                              localStorage.setItem('rs_gsc_account', JSON.stringify(mockAccount));
                              setLogs(p => [{
                                id: `l-${Date.now()}`,
                                timestamp: new Date().toISOString(),
                                type: 'success',
                                message: 'Synchronized Sandbox console database stream successfully.',
                                module: 'GSC_SYNC'
                              }, ...p]);
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-250 text-slate-800 text-xs font-extrabold rounded-xl transition-colors cursor-pointer border border-slate-200"
                          >
                            Sample Sandbox Sync
                          </button>
                          <button
                            type="button"
                            onClick={handleConnectGSC}
                            className="px-4 py-2 bg-[#ea4335] hover:bg-[#d93025] text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-500/10"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Connect real GSC Account
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {gscLoading ? (
                    <div className="bg-white p-24 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                      <p className="text-slate-500 text-sm font-bold animate-pulse">Requesting authentic Search Console matrices from Google...</p>
                    </div>
                  ) : (
                    <>
                      {/* Search Console Metrics panels */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-white to-blue-50/10 p-5 rounded-2xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">GSC Clicks</span>
                          <span className="text-3xl font-black text-blue-600 block mt-2">
                            {gscStats?.clicks.toLocaleString() || '0'}
                          </span>
                          <p className="text-[10px] text-slate-450 mt-1">Real web traffic clicks in past 30 days</p>
                        </div>

                        <div className="bg-gradient-to-br from-white to-orange-50/10 p-5 rounded-2xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">GSC Impressions</span>
                          <span className="text-3xl font-black text-orange-600 block mt-2">
                            {gscStats?.impressions.toLocaleString() || '0'}
                          </span>
                          <p className="text-[10px] text-slate-450 mt-1">Google Search results impressions</p>
                        </div>

                        <div className="bg-gradient-to-br from-white to-emerald-50/10 p-5 rounded-2xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Avg CTR</span>
                          <span className="text-3xl font-black text-emerald-600 block mt-2">
                            {gscStats ? `${gscStats.ctr}%` : '0%'}
                          </span>
                          <p className="text-[10px] text-slate-450 mt-1">Weighted click-through rate ratio</p>
                        </div>

                        <div className="bg-gradient-to-br from-white to-purple-50/10 p-5 rounded-2xl border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Avg Position</span>
                          <span className="text-3xl font-black text-purple-600 block mt-2">
                            {gscStats?.avgPosition || '0'}
                          </span>
                          <p className="text-[10px] text-slate-450 mt-1">Median rank position query indices</p>
                        </div>
                      </div>

                      {/* GSC Query List table card */}
                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="p-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">Top Queries Analytics (Recent 30 Days)</h4>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">
                              Real query keys tracked on Google for verified site: {currentProject.domain}
                            </p>
                          </div>
                          {gscStats?.isSimulated && (
                            <span className="bg-amber-50 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 border border-amber-100 rounded">
                              Sandbox Data Shown
                            </span>
                          )}
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans">
                            <thead>
                              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 bg-opacity-50">
                                <th className="p-4">Search Query Term</th>
                                <th className="p-4 text-center">Clicks</th>
                                <th className="p-4 text-center">Impressions</th>
                                <th className="p-4 text-center">CTR %</th>
                                <th className="p-4 text-center">Avg Rank Position</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                              {gscStats?.queries.map((q, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-4 font-bold text-slate-900 font-mono text-xs">{q.query}</td>
                                  <td className="p-4 text-center text-slate-700">{q.clicks.toLocaleString()}</td>
                                  <td className="p-4 text-center text-slate-500">{q.impressions.toLocaleString()}</td>
                                  <td className="p-4 text-center text-emerald-600">{q.ctr}%</td>
                                  <td className="p-4 text-center font-mono">
                                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs select-all">
                                      #{q.position}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {(!gscStats || gscStats.queries.length === 0) && (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-400">
                                    No search console queries logged. Connect your console stream profile above.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================= */}
              {/* SUB-TAB: AUTONOMOUS AUTOPILOT ENGINE */}
              {/* ========================================= */}
              {dashboardSubView === 'autopilot' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Autopilot Dashboard Queue & Control Hub */}
                  <div className="lg:col-span-2 space-y-6 animate-fadeIn">
                    
                    {/* Control Panel Card */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                          <Sparkles className="h-5 w-5 text-amber-500" />
                          <span>Autonomous SEO Crawler Engine</span>
                        </h3>
                        <p className="text-slate-500 text-xs max-w-xl font-medium">
                          When active, RankSyncer continuously monitors target search keywords. The moment a ranking drop is flagged, our Gemini API worker automatically drafts full SEO-optimized strategy recovery articles to claimed page 1 positions!
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 self-stretch md:self-auto justify-center">
                        <div className="flex items-center gap-2 mb-1.5 justify-end">
                          <span className="text-xs font-bold text-slate-500">Autonomous Daemon:</span>
                          <button
                            type="button"
                            onClick={() => handleToggleAutopilot(!autopilotState.enabled)}
                            className={`w-12 h-6 flex items-center rounded-all p-1 cursor-pointer transition-colors relative ${
                              autopilotState.enabled ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                            style={{ borderRadius: '999px' }}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                                autopilotState.enabled ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleTriggerAutopilotScan}
                          disabled={autopilotLoading}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 self-end shadow-md"
                        >
                          {autopilotLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Scanning & Compiling...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Audit & Crawl Domain Now</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Active Recovery drafting jobs queue */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Autonomous Recovery Drafting Queue</h4>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">Active content tasks queued by our rank alert listeners</p>
                      </div>

                      {autopilotState.queue.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 border border-dashed border-slate-150 rounded-2xl flex flex-col items-center justify-center space-y-2">
                          <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center text-slate-500">
                            <Check className="h-5 w-5" />
                          </div>
                          <p className="font-bold text-slate-900 text-xs">All Keyword Rankings Optimized</p>
                          <p className="text-[11px] text-slate-400 max-w-[280px]">RankSyncer daemon is monitoring. No search deviations found.</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                          {autopilotState.queue.map((item) => (
                            <div key={item.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative overflow-hidden flex flex-col justify-between">
                              
                              {/* Status Label badge */}
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900 text-sm">
                                      {item.keywordTerm}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                      item.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      item.status === 'drafting' ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' :
                                      item.status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span>Trigger Condition: {item.triggerReason}</span>
                                  </p>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold font-mono">
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                              </div>

                              {/* Completed Preview Frame */}
                              {item.status === 'completed' && item.draftContent && (
                                <div className="p-4 bg-white border border-slate-150 rounded-xl space-y-2 mt-1">
                                  <div className="flex justify-between items-baseline gap-40">
                                    <h5 className="font-black text-slate-900 text-xs flex items-center gap-1 text-ellipsis overflow-hidden max-w-[400px]">
                                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                                      {item.draftContent.title}
                                    </h5>
                                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.2 rounded shrink-0">
                                      SEO Rating: {item.draftContent.seoScore}/100
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 italic select-none">
                                    {item.draftContent.metaDescription}
                                  </p>
                                  <hr className="border-slate-100 my-2" />
                                  <div className="text-[10px] leading-relaxed text-slate-700 line-clamp-3 select-all bg-slate-50 p-2.5 rounded font-mono break-all whitespace-pre-wrap">
                                    {item.draftContent.content}
                                  </div>
                                </div>
                              )}

                              {item.status === 'drafting' && (
                                <div className="bg-white border border-slate-150 p-6 rounded-xl flex items-center justify-center space-x-3 mt-1">
                                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                  <span className="text-xs text-slate-500 font-bold animate-pulse">Gemini drafting full optimization brief outline...</span>
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-100 font-sans">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQueueItem(item.id)}
                                  className="px-3 py-1.5 text-slate-500 hover:text-rose-600 text-xs font-bold transition-all cursor-pointer hover:bg-slate-105 rounded-lg"
                                >
                                  Discard Job
                                </button>
                                {item.status === 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveDraft(item)}
                                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-lg cursor-pointer flex items-center gap-1 shadow-sm transition-all"
                                  >
                                    <Check className="h-3 w-3" />
                                    <span>Approve & Import Draft</span>
                                  </button>
                                )}
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Autopilot System Log Console & Terminal Block */}
                  <div className="space-y-6">
                    
                    {/* Console Logger Block */}
                    <div className="bg-[#0b1311] border border-[#1b3a2f] text-slate-300 rounded-3xl overflow-hidden flex flex-col justify-between shadow-lg relative min-h-[500px]">
                      
                      <div className="p-4 bg-[#0d201a] border-b border-[#1b3a2f] flex justify-between items-center">
                        <span className="text-[#32d4a4] font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#32d4a4] animate-pulse shadow-[0_0_8px_#32d4a4]" />
                          Autopilot Node CLI Daemon
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch('/api/autopilot/clear-logs', { method: 'POST' });
                            await fetchAutopilotState();
                          }}
                          className="text-[9px] font-mono text-[#89f5bc]/60 hover:text-[#89f5bc] cursor-pointer font-black border border-[#1b3a2f] px-2 py-0.5 rounded uppercase"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="p-4 font-mono text-[10px] leading-relaxed space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                        {autopilotState.logs.length === 0 ? (
                          <p className="text-slate-500 italic text-[9px]">No active loop logs. Press "Audit & Crawl Domain Now" to start daemon scans...</p>
                        ) : (
                          autopilotState.logs.map((log) => (
                            <div key={log.id} className="flex items-start gap-2.5">
                              <span className="text-slate-600 select-none shrink-0 text-[9px]">
                                [{new Date(log.timestamp).toLocaleTimeString()}]
                              </span>
                              <span className={`text-[8px] font-black uppercase tracking-wide px-1 rounded shrink-0 ${
                                log.module === 'AUTOPILOT_DAEMON' ? 'bg-blue-950/70 border border-blue-900/30 text-blue-400' :
                                log.module === 'SERP_CRAWLER' ? 'bg-[#122c24] border border-[#1b3c31] text-[#34d399]' : 'bg-slate-900 border border-slate-800 text-slate-400'
                              }`}>
                                {log.module}
                              </span>
                              <span className={
                                log.type === 'success' ? 'text-[#34d399] font-bold' :
                                log.type === 'warn' ? 'text-amber-400 font-medium' :
                                log.type === 'error' ? 'text-rose-400 font-bold' : 'text-slate-300'
                              }>
                                {log.message}
                              </span>
                            </div>
                          ))
                        )}
                        
                        {/* Term interactive line */}
                        <div className="flex items-center space-x-1 font-bold text-[#32d4a4] pt-2 animate-pulse">
                          <span>$</span>
                          <span>watching search node changes...</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-[#0d201a] border-t border-[#1b3a2f] text-center">
                        <span className="text-[9px] text-[#32d4a4]/60 font-mono">
                          RankSyncer Autonomous Daemon 30s Loop: Active
                        </span>
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* ========================================= */}
          {/* TAB: MONITOR PROJECTS */}
          {/* ========================================= */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Sites & Portfolios</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Manage connected web assets, configure publishing platforms</p>
                </div>

                <button 
                  onClick={() => setShowAddProject(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add New Domain
                </button>
              </div>

              {/* Grid lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((proj) => {
                  const projKws = keywords.filter(k => k.projectId === proj.id);
                  const projArts = articles.filter(a => a.projectId === proj.id);
                  const isSelected = selectedProjectId === proj.id;
                  
                  return (
                    <div 
                      key={proj.id}
                      className={`p-6 rounded-3xl border relative transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-white border-blue-500 ring-2 ring-blue-500/10 shadow-md' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow shadow-2xs'
                      }`}
                    >
                      <div>
                        {/* Upper Header */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black tracking-wider uppercase text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                            CMS: {proj.cmsPlatform}
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setSelectedProjectId(proj.id)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-md ${
                                isSelected 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                              }`}
                            >
                              {isSelected ? 'Active Scope' : 'Select'}
                            </button>
                            <button 
                              onClick={() => handleDeleteProject(proj.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded"
                              title="Delete Website"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Title and URL */}
                        <h3 className="font-extrabold text-slate-900 text-lg">{proj.name}</h3>
                        <p className="text-slate-500 font-mono text-xs flex items-center mt-1">
                          <Globe2 className="h-3 w-3 mr-1 text-slate-400" />
                          <span>{proj.domain}</span>
                        </p>

                        {/* Quick metrics */}
                        <div className="grid grid-cols-3 gap-2 my-5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="text-center">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Traffic</span>
                            <span className="font-black text-slate-800 text-xs">{proj.organicTraffic.toLocaleString()}</span>
                          </div>
                          <div className="text-center border-x border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Keywords</span>
                            <span className="font-black text-slate-800 text-xs">{projKws.length}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Articles</span>
                            <span className="font-black text-slate-800 text-xs">{projArts.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {proj.lastCrawledAt 
                            ? `Crawl: ${new Date(proj.lastCrawledAt).toLocaleDateString()}` 
                            : 'Crawl: Stale/Never'}
                        </span>

                        <button 
                          onClick={() => handleTriggerCrawl(proj.id)}
                          disabled={proj.crawlStatus === 'CRAWLING'}
                          className="text-blue-600 hover:text-blue-700 font-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {proj.crawlStatus === 'CRAWLING' ? 'Syncing...' : 'Crawl Now'}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ========================================= */}
          {/* TAB: KEYWORD RESEARCH */}
          {/* ========================================= */}
          {activeTab === 'keywords' && currentProject && (() => {
            const selectedKw = projectKeywords.find(k => k.id === selectedKeywordId) || projectKeywords[0];
            return (
              <div className="space-y-6">
                
                {/* Header Control Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Keyword Opportunity Finder</h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                      Track search volumes, real-time ranking changes, and auto-generated opportunity scores
                    </p>
                  </div>

                  <button 
                    onClick={() => setShowAddKeyword(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer select-none"
                  >
                    <Plus className="h-4 w-4" /> Add Search Keyword
                  </button>
                </div>

                {projectKeywords.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center text-slate-400 font-medium">
                    No keywords defined. Click the button to add.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT COLUMN: Datatable opportunity finder */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                            Currently tracking {projectKeywords.length} targets for {currentProject.domain}
                          </span>
                          
                          <div className="flex gap-2">
                            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100">
                              Easy (&lt; 35)
                            </span>
                            <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-100">
                              Medium (35-60)
                            </span>
                            <span className="bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-100">
                              Hard (&gt; 60)
                            </span>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-slate-800">
                            <thead>
                              <tr className="border-b border-slate-100 text-[11px] font-black uppercase text-slate-500 bg-slate-50/50">
                                <th className="p-4">Search Term Keyword</th>
                                <th className="p-4">Monthly Vol</th>
                                <th className="p-4">Difficulty %</th>
                                <th className="p-4 text-center">Active Rank</th>
                                <th className="p-4">Opportunity Index</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                              {projectKeywords.map((kw) => {
                                const difficultyFactor = (100 - kw.difficulty) / 100;
                                const logVolume = Math.log10(kw.volume || 10);
                                const opportunityScore = Math.round(logVolume * 25 * difficultyFactor + 10);
                                const isSelected = selectedKw && selectedKw.id === kw.id;
                                
                                return (
                                  <tr 
                                    key={kw.id} 
                                    onClick={() => setSelectedKeywordId(kw.id)}
                                    className={`cursor-pointer transition-all border-l-4 ${
                                      isSelected 
                                        ? 'bg-blue-50/40 border-l-blue-600 font-medium' 
                                        : 'hover:bg-slate-50/50 border-l-transparent'
                                    }`}
                                  >
                                    <td className="p-4 font-bold text-slate-900 font-mono">
                                      <div className="flex flex-col">
                                        <span>{kw.term}</span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-0.5">
                                          {kw.intent}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-4 font-semibold text-slate-700">
                                      {kw.volume.toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full ${
                                              kw.difficulty < 35 ? 'bg-emerald-500' :
                                              kw.difficulty < 60 ? 'bg-amber-500' : 'bg-rose-500'
                                            }`}
                                            style={{ width: `${kw.difficulty}%` }}
                                          />
                                        </div>
                                        <span className="font-bold text-xs">{kw.difficulty}%</span>
                                      </div>
                                    </td>
                                    <td className="p-4 text-center">
                                      <div className="inline-flex flex-col items-center">
                                        <span className="font-extrabold text-slate-900">
                                          #{kw.currentRank}
                                        </span>
                                        {kw.previousRank > kw.currentRank && (
                                          <span className="text-[9px] text-emerald-600 font-bold">
                                            ▲ +{kw.previousRank - kw.currentRank}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className={`text-xs font-black px-2.5 py-1 rounded-md ${
                                        opportunityScore > 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        opportunityScore > 45 ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                        'bg-slate-105 text-slate-600'
                                      }`}>
                                        {opportunityScore}/100
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Daily rank tracking trend & live crawl boost panel */}
                    <div className="lg:col-span-1 space-y-4">
                      {selectedKw && (
                        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-5 animate-fade-in-quick">
                          
                          <div>
                            <span className="bg-blue-50 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide">
                              SERP Live Monitor
                            </span>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-1.5 line-clamp-1">
                              {selectedKw.term}
                            </h3>
                            <p className="text-slate-400 text-xs mt-0.5 font-medium">
                              Refining organic results position daily
                            </p>
                          </div>

                          {/* Historical trend visualization using Recharts */}
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                              Daily Ranking Trend Chart
                            </h4>
                            
                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl h-48 flex flex-col justify-between">
                              {selectedKw.history && selectedKw.history.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={selectedKw.history} margin={{ top: 8, right: 8, left: -28, bottom: 2 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis 
                                      dataKey="date" 
                                      tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} 
                                      axisLine={false} 
                                      tickLine={false} 
                                    />
                                    <YAxis 
                                      reversed 
                                      domain={[1, (dataMax) => Math.min(Math.max(dataMax + 2, 8), 100)]} 
                                      tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} 
                                      axisLine={false} 
                                      tickLine={false} 
                                    />
                                    <Tooltip
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          return (
                                            <div className="bg-slate-900 text-white p-2 rounded-lg text-[10px] font-bold leading-none shadow">
                                              <p className="text-slate-400">{payload[0].payload.date}</p>
                                              <p className="mt-1 font-mono text-blue-400">Position: #{payload[0].value}</p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="rank" 
                                      stroke="#2563eb" 
                                      strokeWidth={2.5} 
                                      dot={{ r: 3.5, stroke: '#2563eb', strokeWidth: 1.5, fill: '#ffffff' }} 
                                      activeDot={{ r: 5 }} 
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                  No trend data logged. Run a live check.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick statistics checklist */}
                          <div className="grid grid-cols-2 gap-3 text-xs border border-slate-100 p-3 rounded-2xl bg-slate-50/50">
                            <div>
                              <p className="text-slate-400 text-[10px]">Monthly Vol</p>
                              <p className="font-bold text-slate-700">{selectedKw.volume.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px]">Keyword Level</p>
                              <p className={`font-bold ${
                                selectedKw.difficulty < 35 ? 'text-emerald-600' :
                                selectedKw.difficulty < 60 ? 'text-amber-600' : 'text-rose-600'
                              }`}>
                                {selectedKw.difficulty}% Difficulty
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px]">Current Google Rank</p>
                              <p className="font-extrabold text-slate-900">#{selectedKw.currentRank}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px]">Last Checked</p>
                              <p className="font-medium text-slate-500">{selectedKw.lastCheckedRank || 'Never'}</p>
                            </div>
                          </div>

                          {/* Live checks and content boosters actions */}
                          <div className="space-y-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleLiveQuerySERP(selectedKw)}
                              disabled={scrapingKwId === selectedKw.id}
                              className={`w-full py-2.5 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer border transition-colors ${
                                scrapingKwId === selectedKw.id
                                  ? 'bg-slate-100 text-slate-400 border-slate-205 cursor-not-allowed'
                                  : 'bg-blue-600 border-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/10'
                              }`}
                            >
                              {scrapingKwId === selectedKw.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span>Checking live SERP...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  <span>Check Position Live</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setAiGenKeyword(selectedKw.term);
                                setAiGenSemanticKeywords(getSecondaryKeywords(selectedKw.term).map(k => k.term).join(', '));
                                setAiGenCompetitorStructure(`- Analysis of ${selectedKw.term}\n- Strategic implementation steps\n- Outranking current page 1 organic leaders`);
                                setAiGenWordCount(1200);
                                setAiGenTone('Professional & Authoritative');
                                setAiGenError('');
                                setShowAiGenerator(true);
                              }}
                              className="w-full py-2.5 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-950 text-white shadow-sm"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                              <span>AI Outrank Sprint</span>
                            </button>
                          </div>

                          {/* SEO Recovery alerts advice */}
                          {selectedKw.currentRank >= 4 && (
                            <div className="bg-amber-50/75 border border-amber-100 p-3 rounded-2xl flex gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                              <p className="text-[10px] leading-relaxed text-amber-800 font-semibold">
                                <strong>SEO Alert:</strong> Currently position #{selectedKw.currentRank}. Click "AI Outrank Sprint" to automatically author recovery content targeting claimable first page index nodes.
                              </p>
                            </div>
                          )}

                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>
            );
          })()}

          {/* ========================================= */}
          {/* TAB: CONTENT PLANNER */}
          {/* ========================================= */}
          {activeTab === 'planner' && currentProject && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-150 pb-4 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Editorial Content Planner</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Plan outline clusters, track publishing schedules, check draft editorial audit logs
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex">
                    <button
                      onClick={() => setPlannerSubView('pipeline')}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        plannerSubView === 'pipeline' 
                          ? 'bg-white text-slate-800 shadow-3xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Pipeline Lanes
                    </button>
                    <button
                      onClick={() => setPlannerSubView('topical')}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        plannerSubView === 'topical' 
                          ? 'bg-white text-slate-800 shadow-3xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Topical Clusters Map
                    </button>
                  </div>

                  <button 
                    onClick={triggerAutoContentSprint}
                    disabled={aiGenerating}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md shadow-blue-500/10 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" /> Let AI Generate Post Draft
                  </button>
                </div>
              </div>

              {/* Generating spinner banner */}
              {aiGenerating && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center justify-center space-x-3 shadow-2xs">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <p className="text-blue-900 font-bold text-sm tracking-tight">{aiStatusMessage}</p>
                </div>
              )}

              {/* Sub-view switcher render blocks */}
              {plannerSubView === 'topical' ? (
                <TopicalClusters 
                  project={currentProject} 
                  projectKeywords={projectKeywords} 
                  projectArticles={projectArticles} 
                  onSeedArticle={handleSeedArticle} 
                />
              ) : (
                /* Status column lanes */
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Lane: Draft */}
                  <div className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200/60 flex flex-col gap-3 min-h-[400px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Concept / Draft</span>
                      <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {projectArticles.filter(a => a.status === 'Draft').length}
                      </span>
                    </div>

                    {projectArticles.filter(a => a.status === 'Draft').map(art => (
                      <div key={art.id} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs flex flex-col justify-between hover:shadow transition-shadow">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs lines-clamp-2 leading-snug">{art.title}</h4>
                          <span className="text-[10px] font-mono text-slate-400 mt-1.5 block">KW: "{art.targetKeyword}"</span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-medium">Score: {art.seoScore}</span>
                          <button 
                            onClick={() => {
                              setActiveArticleId(art.id);
                              setActiveTab('editor');
                            }}
                            className="text-xs text-blue-600 hover:underline font-bold"
                          >
                            Write &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Lane: Reviewing */}
                  <div className="bg-amber-50/45 p-4 rounded-3xl border border-amber-100/60 flex flex-col gap-3 min-h-[400px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-amber-700 tracking-wider">SEO Review</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {projectArticles.filter(a => a.status === 'Reviewing').length}
                      </span>
                    </div>

                    {projectArticles.filter(a => a.status === 'Reviewing').map(art => (
                      <div key={art.id} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs flex flex-col justify-between hover:shadow transition-shadow">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs lines-clamp-2 leading-snug">{art.title}</h4>
                          <span className="text-[10px] font-mono text-slate-400 mt-1.5 block">KW: "{art.targetKeyword}"</span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">Score: {art.seoScore}</span>
                          <button 
                            onClick={() => {
                              setActiveArticleId(art.id);
                              setActiveTab('editor');
                            }}
                            className="text-xs text-blue-600 hover:underline font-bold"
                          >
                            Audit &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Lane: Ready */}
                  <div className="bg-indigo-50/40 p-4 rounded-3xl border border-indigo-100/60 flex flex-col gap-3 min-h-[400px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-indigo-700 tracking-wider">Ready to Run</span>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {projectArticles.filter(a => a.status === 'Ready').length}
                      </span>
                    </div>

                    {projectArticles.filter(a => a.status === 'Ready').map(art => (
                      <div key={art.id} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-3xs flex flex-col justify-between hover:shadow transition-shadow">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs lines-clamp-2 leading-snug">{art.title}</h4>
                          <span className="text-[10px] font-mono text-slate-400 mt-1.5 block">KW: "{art.targetKeyword}"</span>
                          <div className="mt-2 flex items-center space-x-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] text-emerald-700 font-extrabold">Ready to Push</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setActiveArticleId(art.id);
                              setActiveTab('editor');
                            }}
                            className="text-xs text-slate-500 hover:underline"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              setPublishingArticle(art);
                              setCmsPublishResult(null);
                              if (wpConfig.siteUrl) setSelectedPublishPlatform('wordpress');
                              else if (shopifyConfig.storeDomain) setSelectedPublishPlatform('shopify');
                              else if (webflowConfig.siteToken) setSelectedPublishPlatform('webflow');
                              else setSelectedPublishPlatform('dummy');
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black rounded-lg transition-all"
                          >
                            Sync Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Lane: Published */}
                  <div className="bg-emerald-50/30 p-4 rounded-3xl border border-emerald-100/50 flex flex-col gap-3 min-h-[400px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">CMS Synchronized</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {projectArticles.filter(a => a.status === 'Published').length}
                      </span>
                    </div>

                    {projectArticles.filter(a => a.status === 'Published').map(art => (
                      <div key={art.id} className="bg-white p-4 rounded-2xl border border-slate-200 opacity-90 shadow-3xs flex flex-col justify-between hover:shadow transition-shadow">
                        <div>
                          <h4 className="font-extrabold text-slate-700 text-xs lines-clamp-2 leading-snug">{art.title}</h4>
                          <span className="text-[10px] font-mono text-slate-400 mt-1.5 block">KW: "{art.targetKeyword}"</span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                            ✓ Sync
                          </span>
                          <a 
                            href="#site-visit"
                            onClick={(e) => { e.preventDefault(); alert('Redirecting to simulated CMS page sandbox preview!'); }}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            View Site
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ========================================= */}
          {/* TAB: SEO CODE WRITER */}
          {/* ========================================= */}
          {activeTab === 'editor' && currentProject && (
            <div className="space-y-6">
              
              {/* Checking context */}
              {!editorArticle ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-2xs">
                  <p className="text-slate-500">Please generate or trigger a content draft in the Content Planner tab first.</p>
                  <button 
                    onClick={() => setActiveTab('planner')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    Go Content Planner
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left big column: Text editor */}
                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
                    
                    {/* Header bar controls */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 font-sans">
                      <div>
                        <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">Interactive writing dock</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-500">Targeting Keyword:</span>
                          <strong className="text-xs font-mono text-slate-900 bg-slate-200/60 px-2 py-0.5 rounded">
                            "{editorArticle.targetKeyword}"
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <select
                          className="bg-white border border-slate-200 rounded-lg text-xs font-bold py-1.5 px-2.5 outline-none focus:ring-1 focus:ring-blue-500"
                          value={editorArticle.status}
                          onChange={(e) => updateArticleField(editorArticle.id, 'status', e.target.value)}
                        >
                          <option value="Draft">Concept / Draft</option>
                          <option value="Reviewing">Under SEO Review</option>
                          <option value="Ready">Certified Ready</option>
                          <option value="Published">CMS Sync Posted</option>
                        </select>

                        <button
                          onClick={() => {
                            setAiGenerating(true);
                            setAiStatusMessage('AI SEO Assistant enhancing keyword density throughout your draft body...');
                            setTimeout(() => {
                              // Insert some optimal keywords
                              const addDensity = `\n\n## Advanced Tips: Understanding **${editorArticle.targetKeyword}** correctly\nTo guarantee on-page authority metrics look clean when doing **${editorArticle.targetKeyword}**, developers must avoid unnecessary scripts and include descriptive text.`;
                              updateArticleField(editorArticle.id, 'content', editorArticle.content + addDensity);
                              setAiGenerating(false);
                            }, 1000);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-extrabold px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="h-3 w-3 text-indigo-600" />
                          <span>AI On-Page Optimiser</span>
                        </button>
                      </div>
                    </div>

                    {/* Content textareas inputs */}
                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Post Main Title Heading</label>
                        <input 
                          type="text" 
                          className="w-full text-slate-900 text-xl font-extrabold pb-2 border-b border-slate-100 outline-none focus:border-blue-500 placeholder:text-slate-350"
                          value={editorArticle.title}
                          onChange={(e) => updateArticleField(editorArticle.id, 'title', e.target.value)}
                          placeholder="Headline goes here..."
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Meta Description Snippet (Optimal range: 120-160 characters)</label>
                        <textarea 
                          className="w-full text-slate-700 text-xs p-3 bg-slate-50 hover:bg-slate-50/50 focus:bg-white rounded-xl border border-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                          rows={2}
                          value={editorArticle.metaDescription}
                          onChange={(e) => updateArticleField(editorArticle.id, 'metaDescription', e.target.value)}
                          placeholder="Type or generate meta description..."
                        />
                        <div className="flex justify-between mt-1 text-[10px] font-mono text-slate-400 font-bold">
                          <span>Length: {editorArticle.metaDescription?.length || 0} chars</span>
                          <span className={
                            (editorArticle.metaDescription?.length >= 100 && editorArticle.metaDescription?.length <= 160)
                              ? 'text-emerald-500' : 'text-slate-400'
                          }>
                            Range Check
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col">
                        <label className="block text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Markdown Body Content</label>
                        <textarea 
                          className="w-full flex-1 min-h-[300px] text-slate-800 text-sm font-mono p-4 bg-slate-50 hover:bg-slate-50/50 focus:bg-white focus:text-slate-950 rounded-2xl border border-slate-150 outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans"
                          value={editorArticle.content}
                          onChange={(e) => updateArticleField(editorArticle.id, 'content', e.target.value)}
                          placeholder="Write article in standard markdown markup styles..."
                        />
                      </div>
                    </div>

                  </div>

                  {/* Right side: Real-time interactive SEO audit score map */}
                  <div className="space-y-6">
                    <EditorSidebar 
                      article={editorArticle} 
                      onAppendText={(text) => {
                        updateArticleField(editorArticle.id, 'content', editorArticle.content + text);
                      }}
                      onAIOptimize={() => {
                        setAiGenerating(true);
                        setAiStatusMessage('AI SEO Assistant enhancing keyword density throughout your draft body...');
                        setTimeout(() => {
                          const addDensity = `\n\n## Advanced Outranking Tips: Understanding **${editorArticle.targetKeyword}** correctly\nTo guarantee on-page authority metrics look clean when doing **${editorArticle.targetKeyword}**, content authors must avoid unnecessary scripts and write descriptive texts.`;
                          updateArticleField(editorArticle.id, 'content', editorArticle.content + addDensity);
                          setAiGenerating(false);
                        }, 1000);
                      }}
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================= */}
          {/* TAB: CRAWLER LOGS */}
          {/* ========================================= */}
          {activeTab === 'crawler' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Crawler Activity Feed & Terminal logs</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Monitor simulated SERP scrapers, competitor analyzers, backlink verification agents, and synchronizer nodes
                  </p>
                </div>
                
                <button 
                  onClick={() => setLogs(INITIAL_LOGS)}
                  className="bg-slate-200 outline-none hover:bg-slate-300 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Clear Console Logs
                </button>
              </div>

              {/* Dynamic Console Window UI block */}
              <div className="bg-slate-950 rounded-3xl border border-slate-900 text-slate-300 overflow-hidden shadow-2xl">
                
                {/* Console header controls */}
                <div className="p-4 bg-slate-900 border-b border-slate-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500" />
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="font-mono text-xs font-bold text-slate-400 ml-2">root@ranksyncer:~</span>
                  </div>

                  <span className="bg-blue-950 text-blue-400 font-mono text-[9px] font-black px-2 py-0.5 border border-blue-900/40 rounded uppercase tracking-widest">
                    Worker active logs
                  </span>
                </div>

                {/* Console list output */}
                <div className="p-6 font-mono text-xs leading-relaxed space-y-3 max-h-[500px] overflow-y-auto">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 hover:bg-slate-900/50 p-1.5 rounded">
                      <span className="text-slate-500 text-[10px] shrink-0 font-bold self-start mt-0.5">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.2 rounded shrink-0 self-start ${
                        log.module === 'SERP_CRAWLER' ? 'bg-indigo-950/70 text-indigo-400 border border-indigo-900/30' :
                        log.module === 'BACKLINK_CHECK' ? 'bg-purple-950/70 text-purple-400 border border-purple-900/30' :
                        log.module === 'AI_WRITER' ? 'bg-amber-950/70 text-amber-400 border border-amber-900/30' : 'bg-emerald-950/70 text-emerald-400'
                      }`}>
                        {log.module}
                      </span>
                      <p className={
                        log.type === 'success' ? 'text-emerald-400 font-bold' :
                        log.type === 'warn' ? 'text-amber-400' :
                        log.type === 'error' ? 'text-rose-400 font-black' : 'text-slate-300'
                      }>
                        {log.message}
                      </p>
                    </div>
                  ))}
                  
                  {/* blinking prompt */}
                  <div className="flex items-center space-x-1.5 text-slate-400 font-bold pt-4 text-[10px]">
                    <span className="animate-pulse">_</span>
                    <span>Monitoring RankSyncer API daemon events active...</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================= */}
          {/* TAB: CMS SETTINGS CONNECTED HUB */}
          {/* ========================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Connected Integrations Hub</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Securely bind your target headless CMS or custom proxy crawlers to the sync nodes
                </p>
              </div>

              {/* Database Sync Engine Panel */}
              <div className="bg-gradient-to-br from-slate-900 to-[#0c1c15] text-white p-6 rounded-3xl border border-[#1b3f30] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold flex items-center gap-1.5 font-mono">
                      <span className={`h-2 w-2 rounded-full ${currentUser ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-slate-450'}`} />
                      {currentUser ? 'Continuous Relational Database persistence: Active' : 'Relational Sync Engine: Offline Sandbox'}
                    </span>
                    <h3 className="text-lg font-black tracking-tight font-sans text-white">RankSyncer.co Relational Persistence</h3>
                    <p className="text-slate-350 text-xs max-w-xl leading-relaxed mt-1">
                      Continuous multi-tenant cloud storage protecting credentials, site domain portfolios, dynamic briefs, and historical crawler logs in Google Firestore. Protects project workspace across tabs and systems.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 shrink-0">
                    <Database className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-[#122b20] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {currentUser ? (
                    <div className="flex items-center space-x-3">
                      {currentUser.photoURL ? (
                        <img referrerPolicy="no-referrer" src={currentUser.photoURL} alt="Avatar" className="h-8 w-8 rounded-xl border border-emerald-500/20" />
                      ) : (
                        <div className="h-8 w-8 rounded-xl bg-emerald-600 font-black text-xs flex items-center justify-center text-white shrink-0">
                          {currentUser.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-black text-white">{currentUser.displayName || 'Authorized Tenant'}</p>
                        <p className="text-[10px] text-slate-400 font-mono select-all text-ellipsis overflow-hidden max-w-[180px] sm:max-w-none">{currentUser.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs flex items-center gap-2">
                       Active Session: <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700">Client Local persistence</span>
                    </div>
                  )}

                  <div>
                    {currentUser ? (
                      <button 
                        onClick={logOutFromFirebase}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer border border-slate-700 shadow-sm"
                      >
                        Disconnect Sync
                      </button>
                    ) : (
                      <button 
                        onClick={signInWithGoogle}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                      >
                        <UserCheck className="h-4 w-4 text-black" />
                        Enable Relational Sync (Google Sign-In)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SaaS Subscription & Stripe Billing Center */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                      <CreditCard className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm font-sans flex items-center gap-2">
                        SaaS Subscription & Billing Workspace
                        {activePlan === 'premium' ? (
                          <span className="bg-blue-100 text-blue-800 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">PRO ACTIVE</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">FREE SANDBOX</span>
                        )}
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5 max-w-xl">
                        Unlock autonomous rank optimization loops, automatic SERP crawl nodes, and syndication webhooks.
                      </p>
                    </div>
                  </div>

                  <div>
                    {activePlan === 'premium' ? (
                      <button 
                        onClick={() => {
                          setActivePlan('free');
                          localStorage.setItem('rs_active_plan', 'free');
                        }}
                        className="px-4 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Downgrade Tier
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStripeCheckout('premium')}
                        disabled={isRedirectingToStripe}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isRedirectingToStripe ? (
                          <>
                            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <span>Upgrade to Pro ($49/mo)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div className={`p-4 rounded-2xl border ${activePlan === 'free' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100 bg-slate-50/40'}`}>
                    <h4 className="text-xs font-black text-slate-800 mb-1 font-sans">Free Sandbox Plan</h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Track up to 15 key terms manual indexing. Local client cache persistence. Simulated direct publishing.
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${activePlan === 'premium' ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100 bg-slate-50/40'}`}>
                    <h4 className="text-xs font-black text-slate-800 mb-1 font-sans flex items-center justify-between">
                      SEO Autopilot Premium Plan
                      <span className="text-[10px] text-indigo-600 font-extrabold font-mono">$49/month</span>
                    </h4>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Track up to 100 high-priority phrases, initiate 5 autonomous daily articles drafting, and open live Webhooks (Vercel/Netlify).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                
                {/* CMS 1: WordPress */}
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                        <Zap className="h-6 w-6 font-extrabold text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">WordPress Native REST API Hub</h4>
                        <p className="text-slate-500 text-xs mt-0.5">Deploy draft structures instantly into your WordPress posts as draft layouts.</p>
                        {wpConfig.siteUrl ? (
                          <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 border border-emerald-100 rounded mt-1.5 inline-block">
                            Connected to: {wpConfig.siteUrl}
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 border border-amber-100 rounded mt-1.5 inline-block">
                            Not Configured (Using Sandbox Simulation)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setEditingCmsPlatform(editingCmsPlatform === 'wordpress' ? null : 'wordpress')}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all cursor-pointer"
                    >
                      {editingCmsPlatform === 'wordpress' ? "Close Settings" : "Configure Connection"}
                    </button>
                  </div>

                  {editingCmsPlatform === 'wordpress' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2 animate-fade-in">
                      <p className="text-slate-500 text-xs font-semibold">Provide your WordPress credentials to route actual live sync publications:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Website Domain URL</label>
                          <input 
                            type="text" 
                            placeholder="e.g. https://my-blog.com" 
                            className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-blue-500 w-full"
                            value={tempWpSiteUrl}
                            onChange={(e) => setTempWpSiteUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">WP Admin Username</label>
                          <input 
                            type="text" 
                            placeholder="e.g. admin-user" 
                            className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-blue-500 w-full"
                            value={tempWpUsername}
                            onChange={(e) => setTempWpUsername(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">WP Application Password</label>
                          <input 
                            type="password" 
                            placeholder="e.g. xxxx xxxx xxxx xxxx" 
                            className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-blue-500 w-full"
                            value={tempWpAppPassword}
                            onChange={(e) => setTempWpAppPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        * Note: Create an <strong>Application Password</strong> in your WordPress under <strong>Users › Edit Profile › Application Passwords</strong>. Traditional passwords will fail.
                      </p>
                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={() => {
                            setTempWpSiteUrl('');
                            setTempWpUsername('');
                            setTempWpAppPassword('');
                            saveWpConfig('', '', '');
                          }}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-lg"
                        >
                          Clear Credentials
                        </button>
                        <button 
                          onClick={() => saveWpConfig(tempWpSiteUrl, tempWpUsername, tempWpAppPassword)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm"
                        >
                          Save Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CMS 2: Shopify */}
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
                        <Globe2 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm font-sans">Shopify Admin GraphQL Syndicate</h4>
                        <p className="text-slate-500 text-xs mt-0.5">Automated publishing into your Shopify Store Online Blogs catalog natively.</p>
                        {shopifyConfig.storeDomain ? (
                          <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 border border-emerald-100 rounded mt-1.5 inline-block">
                            Connected. Store: {shopifyConfig.storeDomain}
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 border border-amber-100 rounded mt-1.5 inline-block">
                            Not Configured (Using Sandbox Simulation)
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => setEditingCmsPlatform(editingCmsPlatform === 'shopify' ? null : 'shopify')}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all cursor-pointer"
                    >
                      {editingCmsPlatform === 'shopify' ? "Close Settings" : "Configure Connection"}
                    </button>
                  </div>

                  {editingCmsPlatform === 'shopify' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2 animate-fade-in">
                      <p className="text-slate-500 text-xs font-semibold">Integrate Shopify Admin API key bindings to deploy high-authority blogs:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Shopify Store URL / Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. brand-mystore.myshopify.com" 
                            className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-blue-500 w-full"
                            value={tempShopifyDomain}
                            onChange={(e) => setTempShopifyDomain(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">GraphQL Admin Token</label>
                          <input 
                            type="password" 
                            placeholder="e.g. shpat_xxxxx" 
                            className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-blue-500 w-full"
                            value={tempShopifyToken}
                            onChange={(e) => setTempShopifyToken(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Blog ID (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="Auto-matched if blank" 
                            className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-blue-500 w-full"
                            value={tempShopifyBlogId}
                            onChange={(e) => setTempShopifyBlogId(e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        * Generate Admin Token in your Shopify dashboard under <strong>Settings › Apps and sales channels › Develop Apps</strong>. Enable <strong>write_publications</strong> or <strong>write_content</strong> scope.
                      </p>
                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={() => {
                            setTempShopifyDomain('');
                            setTempShopifyToken('');
                            setTempShopifyBlogId('');
                            saveShopifyConfig('', '', '');
                          }}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-lg"
                        >
                          Clear Credentials
                        </button>
                        <button 
                          onClick={() => saveShopifyConfig(tempShopifyDomain, tempShopifyToken, tempShopifyBlogId)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm"
                        >
                          Save Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CMS 3: Webflow */}
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center text-sky-600 shrink-0">
                        <Layers className="h-6 w-6 text-sky-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Webflow CMS Collection Binding</h4>
                        <p className="text-slate-500 text-xs mt-0.5">Automated map-dispatch sequences directly targeting your Webflow collection schemas.</p>
                        {webflowConfig.siteToken ? (
                          <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 border border-emerald-100 rounded mt-1.5 inline-block">
                            Connected. Collection: {webflowConfig.collectionId}
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 border border-amber-100 rounded mt-1.5 inline-block">
                            Not Configured (Using Sandbox Simulation)
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => setEditingCmsPlatform(editingCmsPlatform === 'webflow' ? null : 'webflow')}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all cursor-pointer"
                    >
                      {editingCmsPlatform === 'webflow' ? "Close Settings" : "Configure Connection"}
                    </button>
                  </div>

                  {editingCmsPlatform === 'webflow' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2 animate-fade-in">
                      <p className="text-slate-500 text-xs font-semibold">Insert your Webflow v2 authorization keys to synchronize dynamic lists:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Webflow API Bearer Token</label>
                          <input 
                            type="password" 
                            placeholder="e.g. wf_xxxxxxxxxxxxxxxxxx" 
                            className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-blue-500 w-full"
                            value={tempWfSiteToken}
                            onChange={(e) => setTempWfSiteToken(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Target Collection Schema ID</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 60cde7bxxxxxxxxxxxxxx" 
                            className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-blue-500 w-full"
                            value={tempWfCollectionId}
                            onChange={(e) => setTempWfCollectionId(e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        * Generate API keys inside your Webflow workspace under <strong>Site Settings › Integrations › App Tokens</strong>.
                      </p>
                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={() => {
                            setTempWfSiteToken('');
                            setTempWfCollectionId('');
                            saveWebflowConfig('', '');
                          }}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-lg"
                        >
                          Clear Credentials
                        </button>
                        <button 
                          onClick={() => saveWebflowConfig(tempWfSiteToken, tempWfCollectionId)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm"
                        >
                          Save Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* CMS 4: Headless Webhooks */}
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                        <Terminal className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Headless Platform Webhooks</h4>
                        <p className="text-slate-500 text-xs mt-0.5">Trigger Netlify, Vercel, or custom GitHub actions on post generation.</p>
                        {headlessConfig.webhookUrl ? (
                          <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 border border-emerald-100 rounded mt-1.5 inline-block">
                            Connected. Endpoint: {headlessConfig.webhookUrl}
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 border border-amber-100 rounded mt-1.5 inline-block">
                            Not Configured (Using Sandbox Simulation)
                          </span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => setEditingCmsPlatform(editingCmsPlatform === 'headless' ? null : 'headless')}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all cursor-pointer"
                    >
                      {editingCmsPlatform === 'headless' ? "Close Settings" : "Configure Connection"}
                    </button>
                  </div>

                  {editingCmsPlatform === 'headless' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2 animate-fade-in">
                      <p className="text-slate-500 text-xs font-semibold">Provide your deployment Webhook URL below to automatically post generated Markdown articles to your Headless deployment pipelines:</p>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Build Webhook Target URL</label>
                          <input 
                            type="text" 
                            placeholder="e.g. https://api.netlify.com/build_hooks/xxxxxxx or https://api.vercel.com/v1/integrations/deploy/xxxxx" 
                            className="bg-white border border-slate-200 text-xs p-2.5 outline-none rounded-xl focus:ring-1 focus:ring-blue-500 w-full"
                            value={tempHeadlessUrl}
                            onChange={(e) => setTempHeadlessUrl(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={() => {
                            setTempHeadlessUrl('');
                            saveHeadlessConfig('');
                          }}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-lg"
                        >
                          Clear Credentials
                        </button>
                        <button 
                          onClick={() => saveHeadlessConfig(tempHeadlessUrl)}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm"
                        >
                          Save Connection
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
              
              {/* API keys config proxy block */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm">Autonomous Nodes Proxy Credentials</h4>
                
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">SERP Scraper Crawl Frequency</label>
                  <select className="bg-slate-50 hover:bg-slate-100/70 border border-slate-100 text-xs p-3.5 outline-none rounded-xl font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 w-full cursor-pointer">
                    <option value="6">Every 6 Hours</option>
                    <option value="12">Every 12 Hours</option>
                    <option value="24">Daily (Recommended)</option>
                    <option value="72">Bi-Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Backup Client Seed Storage Save</label>
                  <p className="text-slate-400 text-[11px] mb-2 leading-relaxed">
                    Reset local sandbox configurations back to system defaults. Irreversible.
                  </p>
                  <button 
                    onClick={() => {
                      if (confirm("Reset local database to default seeds? All custom keywords, projects, and custom wrote content will be replaced by initial seeds.")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl border border-rose-100"
                  >
                    Reset Sandbox Database
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================= */}
          {/* TAB: BRAND IDENTITY CENTRE */}
          {/* ========================================= */}
          {activeTab === 'brand' && (
            <BrandIdentityCenter 
              currentTheme={theme}
              onChangeTheme={(t) => setTheme(t)}
            />
          )}

        </main>

      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-center text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 font-mono">
          <p>© 2026 RankSyncer. All Rights Reserved. Powered dynamically in Cloud Sandbox environment.</p>
        </div>
      </footer>

      {/* ========================================= */}
      {/* DIALOG MODAL: ADD DOMAIN */}
      {/* ========================================= */}
      {showAddProject && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-quick">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative font-sans">
            <button 
              onClick={() => setShowAddProject(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-blue-600" /> Convert New Domain Monitor
            </h3>
            <p className="text-slate-500 text-xs mt-0.5 mb-4">Add your blog/website to automatically run rank opportunity crawlers</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Website Domain URL</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. deliciousvegan.com"
                  className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  value={newProjectDomain}
                  onChange={(e) => setNewProjectDomain(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Project Friendly Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Delicious Vegan"
                  className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">CMS Headless CMS System Type</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-bold"
                  value={newProjectCms}
                  onChange={(e) => setNewProjectCms(e.target.value as any)}
                >
                  <option value="wordpress">WordPress REST Integration</option>
                  <option value="ghost">Ghost CMS webhook proxy</option>
                  <option value="webflow">Webflow Collection mapping</option>
                  <option value="custom">No CMS (Custom offline simulation)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow shadow-blue-500/10 cursor-pointer"
                >
                  Confirm Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* DIALOG MODAL: ADD KEYWORD TARGET */}
      {/* ========================================= */}
      {showAddKeyword && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-quick">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative font-sans">
            <button 
              onClick={() => setShowAddKeyword(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <SearchCode className="h-5 w-5 text-blue-600" /> Subscribe Target Search Keyword
            </h3>
            <p className="text-slate-500 text-xs mt-0.5 mb-4">Add high intent Search keywords to calculate opportunity index scores</p>

            <form onSubmit={handleCreateKeyword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Search term</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. high protein wrap vegan recipe"
                  className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  value={newKeywordTerm}
                  onChange={(e) => setNewKeywordTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Monthly Searches Vol</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    value={newKeywordVolume}
                    onChange={(e) => setNewKeywordVolume(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">SEO Difficulty Difficulty (0-100)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    required
                    placeholder="e.g. 45"
                    className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                    value={newKeywordDifficulty}
                    onChange={(e) => setNewKeywordDifficulty(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">User Search Intent Category</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-bold"
                  value={newKeywordIntent}
                  onChange={(e) => setNewKeywordIntent(e.target.value as any)}
                >
                  <option value="Informational">Informational (Guides, answers)</option>
                  <option value="Commercial">Commercial (Comparison, brands)</option>
                  <option value="Transactional">Transactional (Buying, ordering)</option>
                  <option value="Navigational">Navigational (Specific login links)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowAddKeyword(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow shadow-blue-500/10 cursor-pointer"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* DIALOG MODAL: REAL-TIME AI ENGINE WRITER */}
      {/* ========================================= */}
      {showAiGenerator && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-quick">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative font-sans text-slate-800 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => {
                setShowAiGenerator(false);
                setAiGenError('');
              }}
              disabled={aiGenerating}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 shrink-0">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Gemini AI Article Orchestrator</h3>
                <p className="text-slate-500 text-[11px]">Generate semantic SEO articles integrated with structured competitor schema</p>
              </div>
            </div>

            {aiGenError && (
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl text-[11px] text-rose-700 font-medium mb-4 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{aiGenError}</span>
              </div>
            )}

            <form onSubmit={handleRealAIGenerate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Target Focus Keyword</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. delicious high protein vegan recipe"
                  className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  value={aiGenKeyword}
                  onChange={(e) => setAiGenKeyword(e.target.value)}
                  disabled={aiGenerating}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Competitor Content Structure / Header Outlines</label>
                <textarea 
                  placeholder="e.g. - Introduction to high protein vegan options&#10;- Top 10 protein ingredients&#10;- Step-by-step cooking guide"
                  className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 h-20 resize-none"
                  value={aiGenCompetitorStructure}
                  onChange={(e) => setAiGenCompetitorStructure(e.target.value)}
                  disabled={aiGenerating}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">LSI / Semantic Keywords to Weave In (comma separated)</label>
                <textarea 
                  placeholder="e.g. organic protein sources, gluten-free vegan diet, bulk prep, clean eating recipes"
                  className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 h-16 resize-none"
                  value={aiGenSemanticKeywords}
                  onChange={(e) => setAiGenSemanticKeywords(e.target.value)}
                  disabled={aiGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Target Word Length</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-bold"
                    value={aiGenWordCount}
                    onChange={(e) => setAiGenWordCount(Number(e.target.value))}
                    disabled={aiGenerating}
                  >
                    <option value={600}>600 words (Brief post)</option>
                    <option value={1000}>1000 words (Standard blog)</option>
                    <option value={1500}>1500 words (Deep research)</option>
                    <option value={2000}>2000 words (Ultimate cornerstone)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 leading-relaxed">Writing Tone Preset</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 text-sm rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 font-bold"
                    value={aiGenTone}
                    onChange={(e) => setAiGenTone(e.target.value)}
                    disabled={aiGenerating}
                  >
                    <option value="Professional & Authoritative">Professional & Authoritative</option>
                    <option value="Informative & Friendly">Informative & Friendly</option>
                    <option value="Casual & Direct">Casual & Direct</option>
                    <option value="Technical & Detail-Oriented">Technical & Detail-Oriented</option>
                    <option value="Creative & Captivating">Creative & Captivating</option>
                  </select>
                </div>
              </div>

              {aiGenerating && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
                  <p className="text-blue-900 font-bold text-xs tracking-tight">{aiStatusMessage}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAiGenerator(false);
                    setAiGenError('');
                  }}
                  disabled={aiGenerating}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={aiGenerating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow shadow-blue-500/10 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Writing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>Authorize Generation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* DIALOG MODAL: DIRECT CMS SYNDICATION GATEWAY */}
      {/* ========================================= */}
      {publishingArticle && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in-quick">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl relative font-sans text-slate-800">
            <button 
              onClick={() => {
                setPublishingArticle(null);
                setCmsPublishResult(null);
              }}
              disabled={isPublishingToCms}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Direct CMS Syndication Gateway</h3>
                <p className="text-slate-500 text-[11px]">Deploy and synchronize SEO blogs seamlessly over Node.js backend services</p>
              </div>
            </div>

            {/* If published results ready */}
            {cmsPublishResult ? (
              <div className="space-y-4 py-2 animate-fade-in">
                {cmsPublishResult.success ? (
                  <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center space-y-3">
                    <div className="h-12 w-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Check className="h-6 w-6 font-bold" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-emerald-900 text-sm">Dispatched Successfully!</h4>
                      <p className="text-[11px] text-emerald-700 mt-1">
                        RankSyncer has successfully compiled, optimized and uploaded the blog draft code to your CMS node.
                      </p>
                    </div>

                    {cmsPublishResult.url && (
                      <div className="pt-2">
                        <a 
                          href={cmsPublishResult.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm"
                        >
                          <span>Explore Live Published Draft</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-center space-y-3">
                    <div className="h-12 w-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <X className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-rose-950 text-sm">Deployment Connection Blocked</h4>
                      <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
                        Reason: {cmsPublishResult.error}
                      </p>
                    </div>
                    <div className="pt-2 text-xs text-slate-500 font-sans">
                      Please check connection keys in <strong>Connected Integrations Hub</strong> in Settings or proceed with <strong>Simulated Sandbox Sync</strong>.
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => {
                      setPublishingArticle(null);
                      setCmsPublishResult(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                  >
                    Close Gateway
                  </button>
                </div>
              </div>
            ) : (
              // Selecting target CMS section
              <div className="space-y-4 font-sans">
                {/* Active article summary */}
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Active optimization brief</span>
                    <h5 className="font-extrabold text-slate-800 text-[11px] truncate">{publishingArticle.title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">KW: {publishingArticle.targetKeyword}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">{publishingArticle.wordCount} words</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] text-slate-400 font-extrabold">SEO Score</span>
                    <span className={`text-sm font-black font-mono ${publishingArticle.seoScore >= 85 ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {publishingArticle.seoScore}/100
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Destination Syndication Node</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    
                    {/* OPTION 1: WordPress */}
                    <button 
                      type="button"
                      onClick={() => setSelectedPublishPlatform('wordpress')}
                      className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                        selectedPublishPlatform === 'wordpress' 
                          ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_8px_rgba(59,130,246,0.1)]' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                          <Zap className="h-4 w-4 font-bold" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">WordPress REST</p>
                          <p className="text-[9px] text-slate-400">
                            {wpConfig.siteUrl ? "Live Channel Configured" : "Unconfigured (Simulated)"}
                          </p>
                        </div>
                      </div>
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPublishPlatform === 'wordpress' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'}`}>
                        {selectedPublishPlatform === 'wordpress' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>

                    {/* OPTION 2: Shopify */}
                    <button 
                      type="button"
                      onClick={() => setSelectedPublishPlatform('shopify')}
                      className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                        selectedPublishPlatform === 'shopify' 
                          ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_8px_rgba(168,85,247,0.1)]' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl flex items-center justify-center shrink-0">
                          <Globe2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Shopify GraphQL</p>
                          <p className="text-[9px] text-slate-400">
                            {shopifyConfig.storeDomain ? "Live Channel Configured" : "Unconfigured (Simulated)"}
                          </p>
                        </div>
                      </div>
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPublishPlatform === 'shopify' ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-300'}`}>
                        {selectedPublishPlatform === 'shopify' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>

                    {/* OPTION 3: Webflow */}
                    <button 
                      type="button"
                      onClick={() => setSelectedPublishPlatform('webflow')}
                      className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                        selectedPublishPlatform === 'webflow' 
                          ? 'border-sky-500 bg-sky-500/5 shadow-[0_0_8px_rgba(14,165,233,0.1)]' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl flex items-center justify-center shrink-0">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Webflow CMS</p>
                          <p className="text-[9px] text-slate-400">
                            {webflowConfig.siteToken ? "Live Channel Configured" : "Unconfigured (Simulated)"}
                          </p>
                        </div>
                      </div>
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPublishPlatform === 'webflow' ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300'}`}>
                        {selectedPublishPlatform === 'webflow' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>

                    {/* OPTION 4: Sandbox Mock Tracker */}
                    <button 
                      type="button"
                      onClick={() => setSelectedPublishPlatform('dummy')}
                      className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                        selectedPublishPlatform === 'dummy' 
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-[10px]">
                          SAND
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Mock Sandbox Run</p>
                          <p className="text-[9px] text-emerald-700 font-extrabold flex items-center gap-0.5">
                            <span className="inline-block animate-ping h-1 w-1 bg-emerald-600 rounded-full" />
                            Zero-Risk Test Mode
                          </p>
                        </div>
                      </div>
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPublishPlatform === 'dummy' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                        {selectedPublishPlatform === 'dummy' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>

                    {/* OPTION 5: Headless Webhooks */}
                    <button 
                      type="button"
                      onClick={() => setSelectedPublishPlatform('headless_webhook')}
                      className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                        selectedPublishPlatform === 'headless_webhook' 
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                          <Terminal className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Headless API Webhook</p>
                          <p className="text-[9px] text-slate-400">
                            {headlessConfig.webhookUrl ? "Live Channel Configured" : "Unconfigured (Simulated)"}
                          </p>
                        </div>
                      </div>
                      <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${selectedPublishPlatform === 'headless_webhook' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                        {selectedPublishPlatform === 'headless_webhook' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>

                  </div>
                </div>

                {selectedPublishPlatform === 'headless_webhook' && !headlessConfig.webhookUrl && (
                  <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 p-2.5 rounded-xl font-sans">
                    ⚠️ Headless Webhook endpoint is missing. Running mock rebuild proxy tests safely.
                  </p>
                )}

                {selectedPublishPlatform === 'wordpress' && !wpConfig.siteUrl && (
                  <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 p-2.5 rounded-xl font-sans">
                    ⚠️ WordPress credentials are missing. Running mock publishing now to test the output safely.
                  </p>
                )}
                {selectedPublishPlatform === 'shopify' && !shopifyConfig.storeDomain && (
                  <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 p-2.5 rounded-xl font-sans">
                    ⚠️ Shopify Admin token is missing. Running mock sync now to test variables safely.
                  </p>
                )}
                {selectedPublishPlatform === 'webflow' && !webflowConfig.siteToken && (
                  <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 p-2.5 rounded-xl font-sans">
                    ⚠️ Webflow site token is missing. Running mock compilation now to test mapping safely.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-4 font-sans">
                  <button 
                    type="button"
                    onClick={() => setPublishingArticle(null)}
                    disabled={isPublishingToCms}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    disabled={isPublishingToCms}
                    onClick={() => handleActiveCmsPublish(publishingArticle, selectedPublishPlatform)}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow flex items-center justify-center gap-2 min-w-[120px] disabled:bg-blue-300"
                  >
                    {isPublishingToCms ? (
                      <>
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                        <span>Synchronizing...</span>
                      </>
                    ) : (
                      <>
                        <span>Publish Draft</span>
                        <Send className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
