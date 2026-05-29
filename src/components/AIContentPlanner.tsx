import React, { useState, useEffect, useMemo } from "react";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { Project, Article } from "../types";
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  List, 
  Check, 
  X, 
  TrendingUp, 
  User, 
  Globe, 
  Building, 
  Search, 
  Clock, 
  AlertTriangle, 
  Grid, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  PenTool, 
  Award, 
  Layers, 
  BookOpen, 
  Zap, 
  HelpCircle,
  RefreshCw,
  Eye,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Types corresponding to database blueprint
export interface ContentPlan {
  id: string;
  projectId: string;
  ownerId: string;
  websiteUrl: string;
  niche: string;
  targetKeywords: string[];
  targetCountry: string;
  targetAudience: string;
  days: number;
  status: "pending" | "generating" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  nicheAnalysis?: string;
  tokenCount?: number;
}

export interface ContentPlanItem {
  id: string;
  planId: string;
  projectId: string;
  day: number;
  title: string;
  targetKeyword: string;
  searchIntent: string;
  estimatedTraffic: number;
  articleType: string;
  publishingCadence: string;
  status: "planned" | "generated" | "published";
  approved: boolean;
  draftArticleId?: string;
}

interface AIContentPlannerProps {
  project: Project;
  activePlan: "free" | "premium";
  onUpgradePrompt: () => void;
  onNavigateToEditor: (articleId: string) => void;
}

export default function AIContentPlanner({ 
  project, 
  activePlan, 
  onUpgradePrompt,
  onNavigateToEditor
}: AIContentPlannerProps) {
  
  // Tab/View Mode: 'calendar' | 'list'
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  
  // Local loading / processing states
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(null);
  const [planItems, setPlanItems] = useState<ContentPlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Active Creation Input Form States
  const [websiteUrl, setWebsiteUrl] = useState<string>(project.domain || "");
  const [niche, setNiche] = useState<string>("");
  const [targetKeywords, setTargetKeywords] = useState<string>("");
  const [targetCountry, setTargetCountry] = useState<string>("United States");
  const [targetAudience, setTargetAudience] = useState<string>("Small business owners, marketers");
  const [selectedDays, setSelectedDays] = useState<number>(activePlan === "premium" ? 30 : 7);

  // Background status checker state
  const [generatingPlanId, setGeneratingPlanId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStep, setGenerationStep] = useState<string>("Initializing...");
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Editing state for inline renames
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingKeyword, setEditingKeyword] = useState<string>("");
  const [editingIntent, setEditingIntent] = useState<string>("Informational");
  
  // Toggle form collapse
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // --- Article Plan & Quota Addon Upgrade state managers ---
  const [quotaState, setQuotaState] = useState<any>(null);
  const [addonPlans, setAddonPlans] = useState<any[]>([]);
  const [quotaLoading, setQuotaLoading] = useState<boolean>(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState<string>("");
  const [customQuotaCount, setCustomQuotaCount] = useState<number>(200); // custom tier tracking

  // State for admin toggle inside the popover/modal
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [adminPlans, setAdminPlans] = useState<any[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<any>(null);
  const [adminSaving, setAdminSaving] = useState<boolean>(false);
  const [upgradeNotification, setUpgradeNotification] = useState<string | null>(null);

  // States for admin manual tuning override
  const [adminTargetUser, setAdminTargetUser] = useState<string>("demo-user");
  const [adminOverrideUsedCount, setAdminOverrideUsedCount] = useState<number>(12);
  const [adminOverrideTotalCount, setAdminOverrideTotalCount] = useState<number>(30);

  // Fetch functions
  const fetchQuotaState = async () => {
    try {
      const res = await fetch(`/api/article-quota/state?userId=demo-user`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setQuotaState(data.quota);
          setAdminOverrideUsedCount(data.quota.used_articles);
          setAdminOverrideTotalCount(data.quota.upgraded_quota);
        }
      }
    } catch (e) {
      console.error("Error loaded quota state:", e);
    }
  };

  const fetchAddonPlans = async () => {
    try {
      const res = await fetch(`/api/article-quota/plans`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAddonPlans(data.plans);
          setAdminPlans(JSON.parse(JSON.stringify(data.plans)));
        }
      }
    } catch (e) {
      console.error("Error loaded addon tiers list:", e);
    }
  };

  const fetchAdminAnalytics = async () => {
    try {
      const res = await fetch(`/api/article-quota/analytics`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAdminAnalytics(data.analytics);
        }
      }
    } catch (e) {
      console.error("Error loading quota metrics overview:", e);
    }
  };

  // On mount
  useEffect(() => {
    setQuotaLoading(true);
    Promise.all([fetchQuotaState(), fetchAddonPlans(), fetchAdminAnalytics()]).finally(() => {
      setQuotaLoading(false);
    });
  }, []);

  const handleUpgradePlan = async (targetPlanId: string) => {
    try {
      const res = await fetch("/api/article-quota/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo-user", targetPlanId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUpgradeNotification(data.message);
        setQuotaState(data.quota);
        fetchAdminAnalytics();
        setTimeout(() => setUpgradeNotification(null), 8000);
      } else {
        alert(data.error || "Upgrade failed. Check Stripe / Payment Gateway logs.");
      }
    } catch (err: any) {
      alert("Billing connection interrupted during upgrade workflow check: " + err.message);
    }
  };

  const handleCustomUpgrade = async () => {
    // Generate/register a dynamic custom tier
    try {
      const existingPlansWithoutCustom = adminPlans.filter(p => !p.id.startsWith("custom-"));
      const calculatedCustomPrice = Math.round(customQuotaCount * 1.1); // $1.10 per custom item
      const customPlan = {
        id: `custom-tier-${customQuotaCount}`,
        name: `Custom Premium (${customQuotaCount})`,
        articlesPerMonth: customQuotaCount,
        price: calculatedCustomPrice,
        enabled: true
      };
      
      const resUpdate = await fetch("/api/article-quota/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: [...existingPlansWithoutCustom, customPlan] })
      });
      
      if (resUpdate.ok) {
        await handleUpgradePlan(customPlan.id);
        fetchAddonPlans(); // reload plans
      } else {
        alert("Failed registering custom tier pricing rules.");
      }
    } catch (err: any) {
      alert("Error adding custom tier: " + err.message);
    }
  };

  const handleSaveAdminPlans = async () => {
    setAdminSaving(true);
    try {
      const res = await fetch("/api/article-quota/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: adminPlans })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAddonPlans(data.plans);
        alert("Pricing configurations saved successfully inside quota_db.");
      } else {
        alert(data.error || "Failed saving pricing.");
      }
    } catch (err: any) {
      alert("Admin connection dropped: " + err.message);
    } finally {
      setAdminSaving(false);
    }
  };

  const handleAdminOverride = async () => {
    try {
      const res = await fetch("/api/article-quota/admin/adjust-quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adminTargetUser,
          usedArticles: adminOverrideUsedCount,
          upgradedQuota: adminOverrideTotalCount
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuotaState(data.quota);
        fetchAdminAnalytics();
        alert("Manual overrides applied successfully inside sandbox environment.");
      } else {
        alert(data.error || "Direct override failed.");
      }
    } catch (err: any) {
      alert("Manual override connection problem: " + err.message);
    }
  };

  // Sync plan inputs when project updates
  useEffect(() => {
    if (project.domain) {
      setWebsiteUrl(project.domain);
    }
  }, [project.domain]);

  // Adjust days selected based on tier
  useEffect(() => {
    setSelectedDays(activePlan === "premium" ? 30 : 7);
  }, [activePlan]);

  // 1. Subscribe to Content Plans list inside the specific project
  useEffect(() => {
    setLoading(true);
    const plansRef = collection(db, "projects", project.id, "content_plans");
    const unsubscribe = onSnapshot(plansRef, (snapshot) => {
      const plansList: ContentPlan[] = [];
      snapshot.forEach((docSnap) => {
        plansList.push({ id: docSnap.id, ...docSnap.data() } as ContentPlan);
      });
      
      // Sort plans newest first
      plansList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPlans(plansList);
      
      // Select the first completed/active plan by default if none selected
      if (plansList.length > 0) {
        if (!selectedPlan) {
          const defaultPlan = plansList.find(p => p.status === "completed") || plansList[0];
          setSelectedPlan(defaultPlan);
        } else {
          // Keep current selected plan in sync if it got updated
          const updated = plansList.find(p => p.id === selectedPlan.id);
          if (updated) setSelectedPlan(updated);
        }
      } else {
        setSelectedPlan(null);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `projects/${project.id}/content_plans`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [project.id]);

  // 2. Subscribe to items of the selected plan
  useEffect(() => {
    if (!selectedPlan) {
      setPlanItems([]);
      return;
    }

    const itemsRef = collection(db, "projects", project.id, "content_plans", selectedPlan.id, "items");
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const itemsList: ContentPlanItem[] = [];
      snapshot.forEach((docSnap) => {
        itemsList.push({ id: docSnap.id, ...docSnap.data() } as ContentPlanItem);
      });
      // Sort items logically by day index ascending
      itemsList.sort((a, b) => a.day - b.day);
      setPlanItems(itemsList);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `projects/${project.id}/content_plans/${selectedPlan.id}/items`);
    });

    return () => unsubscribe();
  }, [project.id, selectedPlan?.id]);

  // Handle background polling of in-progress plans
  useEffect(() => {
    if (!generatingPlanId) return;

    let pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/content-plans/status/${generatingPlanId}`);
        if (!res.ok) throw new Error("Could not check plan compile progress.");
        const job = await res.json();

        // Simulate animated steps based on status
        if (job.status === "pending") {
          setGenerationProgress(15);
          setGenerationStep("1/4: Queue verified. Initializing semantic audit models...");
        } else if (job.status === "generating") {
          setGenerationProgress(prev => Math.min(prev + 5, 88));
          const steps = [
            "2/4: Reading domain and analyzing search competitors...",
            "2/4: Synthesizing search trends and cluster hierarchies...",
            "3/4: Expanding keyword long-tail vectors...",
            "3/4: Eliminating cannibalization risks across daily tracks...",
            "4/4: Constructing click-worthy display headers..."
          ];
          const randomStep = steps[Math.floor(Math.random() * steps.length)];
          setGenerationStep(randomStep);
        } else if (job.status === "completed") {
          setGenerationProgress(100);
          setGenerationStep("4/4: Generation complete! Synchronizing database nodes...");
          clearInterval(pollInterval);
          
          // Save completed plan and its items into real Firestore securely from current user context
          await saveCompletedPlanToFirestore(job);
          setGeneratingPlanId(null);
          setGenerationProgress(0);
          setGenerationError(null);
          setShowCreateForm(false);
        } else if (job.status === "failed") {
          setGenerationError(job.error || "Model generation timed out. Please try again.");
          setGeneratingPlanId(null);
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        setGenerationError(err.message || "Asynchronous connection dropped.");
        setGeneratingPlanId(null);
        clearInterval(pollInterval);
      }
    }, 2800);

    return () => clearInterval(pollInterval);
  }, [generatingPlanId]);

  // Function to save content plan and items returned by API to Firestore
  const saveCompletedPlanToFirestore = async (job: any) => {
    try {
      const planId = job.id;
      const ownerId = auth.currentUser?.uid || "anonymous_user";

      // 1. Create master ContentPlan doc
      const planDocData: ContentPlan = {
        id: planId,
        projectId: project.id,
        ownerId,
        websiteUrl: job.websiteUrl,
        niche: job.niche,
        targetKeywords: job.targetKeywords,
        targetCountry: job.targetCountry,
        targetAudience: job.targetAudience,
        days: job.days,
        status: "completed",
        nicheAnalysis: job.nicheAnalysis || "",
        createdAt: job.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tokenCount: job.tokenCount || 0
      };

      await setDoc(doc(db, "projects", project.id, "content_plans", planId), planDocData);

      // 2. Iterate items and create nested ContentPlanItem docs
      if (job.items && Array.isArray(job.items)) {
        for (const item of job.items) {
          const itemId = `item-${Date.now()}-${item.day}-${Math.floor(Math.random() * 1000)}`;
          const planItem: ContentPlanItem = {
            id: itemId,
            planId,
            projectId: project.id,
            day: item.day,
            title: item.title,
            targetKeyword: item.targetKeyword,
            searchIntent: item.searchIntent || "Informational",
            estimatedTraffic: Number(item.estimatedTraffic) || 120,
            articleType: item.articleType || "How-To Guide",
            publishingCadence: item.publishingCadence || "Daily",
            status: "planned",
            approved: true
          };

          await setDoc(doc(db, "projects", project.id, "content_plans", planId, "items", itemId), planItem);
        }
      }

      // Automatically select this new plan
      setSelectedPlan(planDocData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `projects/${project.id}/content_plans/${job.id}`);
      setGenerationError("Writing completed items to database failed.");
    }
  };

  // Submit dynamic content plan compiler request
  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) {
      alert("Please entering your business category / niche to enable cluster algorithms.");
      return;
    }
    if (!targetKeywords.trim()) {
      alert("Please specify at least one target keyword target.");
      return;
    }

    setGenerationError(null);
    setGenerationProgress(5);
    setGenerationStep("Contacting service. Aligning content queue daemon...");
    
    try {
      const ownerId = auth.currentUser?.uid || "anonymous_user";
      const payload = {
        projectId: project.id,
        ownerId,
        websiteUrl,
        niche: niche.trim(),
        targetKeywords: targetKeywords.split(",").map(k => k.trim()).filter(Boolean),
        targetCountry,
        targetAudience,
        activePlan
      };

      const res = await fetch("/api/content-plans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "System rejected content plan creation request.");
      }

      const data = await res.json();
      // Start polling the server jobId
      setGeneratingPlanId(data.plan.id);

    } catch (err: any) {
      setGenerationError(err.message || "Failed to trigger content plan workflow.");
      setGeneratingPlanId(null);
    }
  };

  // Handle retry of generation
  const handleRetryGeneration = async (jobId: string) => {
    setGenerationError(null);
    setGenerationProgress(8);
    setGenerationStep("Rescheduling job under active cluster queue...");
    try {
      const res = await fetch(`/api/content-plans/retry/${jobId}`, { method: "POST" });
      if (!res.ok) throw new Error("Could not schedule plan retry.");
      setGeneratingPlanId(jobId);
    } catch (err: any) {
      setGenerationError(err.message);
      setGeneratingPlanId(null);
    }
  };

  // Handle deletion of a content plan doc
  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this content plan permanently?")) return;
    try {
      await deleteDoc(doc(db, "projects", project.id, "content_plans", planId));
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${project.id}/content_plans/${planId}`);
    }
  };

  // Toggle approval indicator
  const handleToggleApproval = async (item: ContentPlanItem) => {
    if (!selectedPlan) return;
    try {
      const updatedItem = { ...item, approved: !item.approved };
      await setDoc(doc(db, "projects", project.id, "content_plans", selectedPlan.id, "items", item.id), updatedItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}/content_plans/${selectedPlan.id}/items/${item.id}`);
    }
  };

  // Move day Up/Down (Re-order)
  const handleMoveItem = async (index: number, direction: "up" | "down") => {
    if (!selectedPlan) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= planItems.length) return;

    try {
      const itemA = planItems[index];
      const itemB = planItems[targetIndex];

      // Swap day index values
      const dayA = itemA.day;
      const dayB = itemB.day;

      await setDoc(doc(db, "projects", project.id, "content_plans", selectedPlan.id, "items", itemA.id), { ...itemA, day: dayB });
      await setDoc(doc(db, "projects", project.id, "content_plans", selectedPlan.id, "items", itemB.id), { ...itemB, day: dayA });

    } catch (err) {
      console.error("Failed to reorder plan positions:", err);
    }
  };

  // Start inline editing of an item
  const startEditing = (item: ContentPlanItem) => {
    setEditingItemId(item.id);
    setEditingTitle(item.title);
    setEditingKeyword(item.targetKeyword);
    setEditingIntent(item.searchIntent);
  };

  // Save inline edit
  const saveInlineEdit = async (item: ContentPlanItem) => {
    if (!selectedPlan) return;
    try {
      const updatedItem = {
        ...item,
        title: editingTitle,
        targetKeyword: editingKeyword,
        searchIntent: editingIntent
      };
      await setDoc(doc(db, "projects", project.id, "content_plans", selectedPlan.id, "items", item.id), updatedItem);
      setEditingItemId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${project.id}/content_plans/${selectedPlan.id}/items/${item.id}`);
    }
  };

  // Auto-Draft topic directly into SEO core articles table
  const handleAutoDraftArticle = async (item: ContentPlanItem) => {
    if (item.draftArticleId) {
      onNavigateToEditor(item.draftArticleId);
      return;
    }

    try {
      // Create a gorgeous skeleton draft inside project articles real-time database
      const articleId = `art-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const ownerId = auth.currentUser?.uid || "anonymous_user";

      const newArticle: Article = {
        id: articleId,
        projectId: project.id,
        ownerId,
        title: item.title,
        slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        targetKeyword: item.targetKeyword,
        wordCount: 0,
        seoScore: 15,
        status: "Draft",
        content: `# ${item.title}\n\n*This article brief was automatically scheduled via your 30-Day AI Content Plan Plan targeting the focus keyword: **"${item.targetKeyword}"**.*\n\n## Introduction\nEnter your introduction paragraphs here to establish organic user interest.\n\n## Topical Headings\nWrite highly detailed, helpful, and and original section blocks that answer the core search query behind search intent: **${item.searchIntent}**.\n\n## Conclusion & Action Steps\nCreate clear marketing call-to-actions to prompt reader engagement.`,
        lastEdited: new Date().toISOString(),
        metaDescription: `Discover professional insights about ${item.targetKeyword} to boost your business growth.`
      };

      // 1. Save Article
      await setDoc(doc(db, "projects", project.id, "articles", articleId), newArticle);

      // 2. Link draft to content plan item
      if (selectedPlan) {
        await setDoc(doc(db, "projects", project.id, "content_plans", selectedPlan.id, "items", item.id), {
          ...item,
          draftArticleId: articleId,
          status: "generated"
        });
      }

      // Navigate to Editor
      onNavigateToEditor(articleId);

    } catch (err) {
      console.error("Draft integration failed:", err);
      alert("Error building draft item in articles directory.");
    }
  };

  // Metrics calculators
  const approvedItems = useMemo(() => planItems.filter(i => i.approved), [planItems]);
  const estimatedTotalMonthlyViews = useMemo(() => {
    return approvedItems.reduce((acc, curr) => acc + (curr.estimatedTraffic || 0), 0);
  }, [approvedItems]);

  const intentRatio = useMemo(() => {
    const total = approvedItems.length || 1;
    const info = approvedItems.filter(i => i.searchIntent === "Informational").length;
    const comm = approvedItems.filter(i => i.searchIntent === "Commercial").length;
    const trans = approvedItems.filter(i => i.searchIntent === "Transactional").length;
    
    return {
      info: Math.round((info / total) * 100),
      comm: Math.round((comm / total) * 100),
      trans: Math.round((trans / total) * 100)
    };
  }, [approvedItems]);

  const percentageUsed = useMemo(() => {
    if (!quotaState) return 0;
    const total = quotaState.upgraded_quota || 1;
    return Math.min(100, Math.round((quotaState.used_articles / total) * 100));
  }, [quotaState]);

  const customProratedCost = useMemo(() => {
    const calculatedCustomPrice = Math.round(customQuotaCount * 1.1);
    const priceDiff = calculatedCustomPrice - (quotaState ? quotaState.addon_price : 0);
    if (priceDiff <= 0) return 0;
    return parseFloat(((priceDiff * 18) / 30).toFixed(2));
  }, [customQuotaCount, quotaState]);

  return (
    <div className="space-y-6">
      
      {/* SECTION: PLANNER HEADER SUMMARY */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-slate-800 to-transparent opacity-40 pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="flex items-center flex-wrap gap-2">
            <Sparkles className="h-5 w-5 text-amber-300 fill-amber-300 animate-pulse" />
            <span className="text-xs uppercase font-black bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full tracking-wider">
              AI Content Engine
            </span>
            {activePlan === "premium" ? (
              <span className="text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                <Award className="h-3.5 w-3.5" /> Premium Plan Active
              </span>
            ) : (
              <button 
                onClick={onUpgradePrompt}
                className="text-[11px] font-black bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 px-2.5 py-1 rounded-full hover:shadow transition-all cursor-pointer flex items-center gap-0.5"
              >
                <Zap className="h-3 w-3 fill-slate-950 text-slate-950 inline" /> Upgrade for 30-Day Plans
              </button>
            )}
            
            {quotaState && (
              <button 
                onClick={() => {
                  fetchQuotaState();
                  fetchAdminAnalytics();
                  setShowUpgradeModal(true);
                }}
                className="text-[11px] font-black bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 text-white px-3 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-600/25 border border-indigo-500 uppercase tracking-wide"
              >
                <Zap className="h-3 w-3 text-amber-300 fill-amber-300" /> Articles Plan: {quotaState.upgraded_quota}/month <span className="text-[10px] text-indigo-200">▼</span>
              </button>
            )}
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-tight">
            30-Day Automated AI Content Authority Plan
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl">
            Cultivate your website's topical authority rank completely on auto-pilot. Enter seed search topics to cluster queries, establish semantic lanes, and launch click-optimized schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 w-full xl:w-auto">
          {plans.length > 0 && (
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Planning History</span>
              <select
                value={selectedPlan?.id || ""}
                onChange={(e) => {
                  const selected = plans.find(p => p.id === e.target.value);
                  if (selected) setSelectedPlan(selected);
                }}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.niche} ({p.days} Days - {new Date(p.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowCreateForm(prev => !prev)}
            disabled={!!generatingPlanId}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap mt-auto w-full sm:w-auto justify-center"
          >
            {showCreateForm ? <X className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
            {showCreateForm ? "Cancel Creation" : "Plan New Domain Niche"}
          </button>
        </div>
      </div>

      {/* SECTION: ASYNCHRONOUS COMPILATION LOADER ANIMATION */}
      <AnimatePresence>
        {generatingPlanId && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-900/10 border-2 border-blue-500/20 p-8 rounded-3xl flex flex-col items-center justify-center space-y-6 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
            
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <Sparkles className="h-6 w-6 text-amber-400 absolute top-4 left-4 animate-ping" />
            </div>

            <div className="text-center space-y-2 max-w-xl">
              <h3 className="text-lg font-extrabold text-blue-950 tracking-tight">
                Synthesizing Authoritative Content Plan
              </h3>
              <p className="text-blue-700 text-xs font-mono font-bold tracking-tight py-1 bg-blue-50 px-3 rounded-full inline-block">
                {generationStep}
              </p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Our Gemini AI engine is clustering your seed term keywords, parsing competitor domains, assigning search intent ratios, and scheduling topical ladders to secure absolute SERP dominance.
              </p>
            </div>

            <div className="w-full max-w-md bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${generationProgress}%` }}
              />
            </div>

            <span className="text-xs font-black text-blue-600">{generationProgress}% Completed</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION: ERROR BANNER WITH FAIL-SAFE RETRY */}
      {generationError && (
        <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-2.5 rounded-2xl text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-rose-950 text-sm">Failed to Compile AI Calendar</h4>
              <p className="text-rose-700 text-xs">{generationError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGenerationError(null)}
              className="text-slate-500 hover:text-slate-800 text-xs font-black px-3.5 py-1.5"
            >
              Dismiss
            </button>
            {generatingPlanId && (
              <button
                onClick={() => handleRetryGeneration(generatingPlanId)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Force Retry Workflow
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION: CONTENT PLAN INTAKE FORM */}
      {showCreateForm && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl"
        >
          <div className="flex items-center gap-2 border-b border-slate-150 pb-4 mb-6">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <h3 className="font-black text-slate-900 tracking-tight text-lg">
              Seed New Topical Authority Calendar Plan
            </h3>
          </div>

          <form onSubmit={handleGenerateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Website URL (Target Domain)</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="e.g. outrank.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Specify the website domain you are targeting.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Website Business Niche</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g. Headless CMS deployment, SaaS automation"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Describe the explicit domain sector, services, or core value offer.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Primary Focus Seed Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={targetKeywords}
                    onChange={(e) => setTargetKeywords(e.target.value)}
                    placeholder="e.g. static site hosting, performance cloud"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Enter keywords separated by commas. These guide the clustering algorithms.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Target Geolocation / Country</label>
                <select
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="United States">United States (US)</option>
                  <option value="United Kingdom">United Kingdom (UK)</option>
                  <option value="Canada">Canada (CA)</option>
                  <option value="Australia">Australia (AU)</option>
                  <option value="India">India (IN)</option>
                  <option value="Germany">Germany (DE)</option>
                </select>
                <p className="text-[10px] text-slate-400">Filters traffic potential and search queries metrics to local standards.</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Target Audience Persona</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Headless WordPress webmasters, CTOs, marketing directors"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Defines copy-brief angles, search intent filters, and titles tones.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-800 block">SaaS Membership Scope</span>
                <span className="text-xs text-slate-400 block sm:max-w-md">
                  {activePlan === "premium" 
                    ? "Your active Premium SaaS plan unlocks the full high-authority 30-Day automated editorial calendar." 
                    : "Free users are limited to 7-Day sample plans. Select premium to unlock the full 30-Day suite."}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => activePlan === "premium" ? setSelectedDays(7) : null}
                  disabled={activePlan !== "premium"}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                    selectedDays === 7 
                      ? "bg-slate-800 border-slate-805 text-white" 
                      : "bg-white border-slate-150 text-slate-600 disabled:opacity-50"
                  }`}
                >
                  7-Day Plan
                </button>
                <button
                  type="button"
                  onClick={() => selectedDays === 30 ? null : onUpgradePrompt()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all flex items-center gap-1 ${
                    selectedDays === 30 
                      ? "bg-gradient-to-r from-emerald-600 to-teal-500 border-transparent text-white" 
                      : "bg-white border-slate-150 text-slate-600 cursor-pointer"
                  }`}
                >
                  {selectedDays === 30 && <Check className="h-3.5 w-3.5" />}
                  30-Day Plan {activePlan !== "premium" && "⭐"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-slate-205 text-slate-620 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                Synthesize Plan
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* SECTION: NO PLANS PLACEHOLDER */}
      {plans.length === 0 && !loading && !generatingPlanId && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-12 text-center rounded-3xl space-y-4 max-w-2xl mx-auto">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-black text-slate-900 tracking-tight">Create Your First 30-Day Content Plan</h3>
          <p className="text-slate-500 text-sm">
            You don't have any content plans built for this domain yet. Kickstart organic volume growth by creating a fully-clustered 30-day SEO calendar customized to your niche immediately.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" /> Start Authority Builder
          </button>
        </div>
      )}

      {/* SECTION: PLAN DETAILS WORKSPACE */}
      {selectedPlan && (
        <div className="space-y-6">
          
          {/* 1. Niche Analysis Insights */}
          {selectedPlan.nicheAnalysis && (
            <div className="bg-indigo-50/40 border border-indigo-100/60 p-5 rounded-3xl flex items-start gap-3.5">
              <div className="bg-indigo-100/80 p-2.5 rounded-2xl text-indigo-700">
                <Layers className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs uppercase font-black text-indigo-800 tracking-wider">Topical Authority Audit Roadmap</h4>
                <p className="text-slate-650 text-xs leading-relaxed font-bold">
                  {selectedPlan.nicheAnalysis}
                </p>
              </div>
            </div>
          )}

          {/* 2. Key Metrics dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Duration Scope</span>
                <span className="text-lg font-black text-slate-800 block">{selectedPlan.days} Planned Days</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Approved Topics</span>
                <span className="text-lg font-black text-slate-800 block">
                  {approvedItems.length} / {planItems.length} Approved
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
                <TrendingUp className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Traffic Value Potential</span>
                <span className="text-lg font-black text-slate-800 block">
                  ~{(estimatedTotalMonthlyViews).toLocaleString()}/mo views
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-3xs flex flex-col justify-center space-y-2">
              <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Search Intent Ratio</span>
              <div className="flex gap-2.5 text-[9px] font-bold text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Info: {intentRatio.info || 0}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  Comm: {intentRatio.comm || 0}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Trans: {intentRatio.trans || 0}%
                </span>
              </div>
            </div>

          </div>

          {/* 3. Filter controls & views */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 pb-4 gap-4">
            
            <div className="flex items-center gap-4">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Schedule of Editorial Publications
              </h3>
              
              <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === "list" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === "calendar" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Grid View"
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleDeletePlan(selectedPlan.id)}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 w-full sm:w-auto justify-center cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Content Plan
              </button>
            </div>
          </div>

          {/* Interactive Lists & calendars block */}
          {viewMode === "calendar" ? (
            
            /* VIEW: CALENDAR CONTAINER */
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {planItems.map((item, index) => {
                const isApproved = item.approved;
                const isEditing = editingItemId === item.id;

                let intentColor = "bg-blue-100 text-blue-700 border-blue-200";
                if (item.searchIntent === "Commercial") intentColor = "bg-purple-100 text-purple-700 border-purple-200";
                else if (item.searchIntent === "Transactional") intentColor = "bg-emerald-100 text-emerald-700 border-emerald-200";

                return (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-2xl border p-4.5 flex flex-col justify-between space-y-4 shadow-3xs hover:shadow transition-all ${
                      isApproved ? "border-slate-150" : "border-slate-205 bg-slate-50/50 opacity-60"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400">Day {item.day}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleToggleApproval(item)}
                            className={`p-1 rounded-full transition-all cursor-pointer ${
                              isApproved ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            }`}
                            title={isApproved ? "Reject Concept" : "Approve Concept"}
                          >
                            {isApproved ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded"
                          />
                          <input
                            type="text"
                            value={editingKeyword}
                            onChange={(e) => setEditingKeyword(e.target.value)}
                            className="w-full text-[10px] p-1 border border-slate-200 rounded"
                          />
                          <div className="flex gap-1">
                            <button onClick={() => saveInlineEdit(item)} className="p-1 bg-blue-600 text-white rounded text-[10px]">Save</button>
                            <button onClick={() => setEditingItemId(null)} className="p-1 bg-slate-200 rounded text-[10px]">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-800 line-clamp-3 leading-snug">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">
                            KW: "{item.targetKeyword}"
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-50">
                      <div className="flex justify-between items-center text-[9px] font-bold">
                        <span className={`px-1.5 py-0.5 rounded border ${intentColor}`}>
                          {item.searchIntent}
                        </span>
                        <span className="text-slate-400">
                          ~{item.estimatedTraffic} views
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 w-full">
                        <button
                          onClick={() => startEditing(item)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-450 rounded-lg cursor-pointer transition-all"
                          title="Edit Topic"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        
                        <button
                          onClick={() => handleAutoDraftArticle(item)}
                          className="flex-1 py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black flex items-center justify-center gap-0.5 cursor-pointer"
                        >
                          <PenTool className="h-2.5 w-2.5" /> Write
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            
            /* VIEW: LIST VIEW CONTAINER */
            <div className="bg-white rounded-3xl border border-slate-150 overflow-hidden shadow-3xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-550 font-black uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 w-12 text-center">Day</th>
                      <th className="py-3.5 px-4">Article Topic Details</th>
                      <th className="py-3.5 px-4 w-40">Target Keyword</th>
                      <th className="py-3.5 px-4 w-32">Search Intent</th>
                      <th className="py-3.5 px-4 w-28 text-center">Traffic potential</th>
                      <th className="py-3.5 px-4 w-32">Article Type</th>
                      <th className="py-3.5 px-4 w-44 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {planItems.map((item, index) => {
                      const isApproved = item.approved;
                      const isEditing = editingItemId === item.id;
                      
                      let intentColor = "bg-blue-50 text-blue-700 border-blue-200";
                      if (item.searchIntent === "Commercial") intentColor = "bg-purple-50 text-purple-700 border-purple-200";
                      else if (item.searchIntent === "Transactional") intentColor = "bg-emerald-50 text-emerald-700 border-emerald-200";

                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-50/50 transition-colors ${
                            isApproved ? "opacity-100" : "bg-slate-50/40 text-slate-400 opacity-60"
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                            {item.day}
                          </td>
                          <td className="py-3.5 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="w-full p-2 border border-slate-205 rounded-lg text-xs"
                              />
                            ) : (
                              <span className="font-extrabold text-slate-800 text-xs lines-clamp-2">
                                {item.title}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingKeyword}
                                onChange={(e) => setEditingKeyword(e.target.value)}
                                className="w-full p-2 border border-slate-205 rounded-lg text-xs font-mono"
                              />
                            ) : (
                              <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {item.targetKeyword}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isEditing ? (
                              <select 
                                value={editingIntent}
                                onChange={(e) => setEditingIntent(e.target.value)}
                                className="p-1 border border-slate-200 rounded text-xs"
                              >
                                <option value="Informational">Informational</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Transactional">Transactional</option>
                                <option value="Navigational">Navigational</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${intentColor}`}>
                                {item.searchIntent}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                            ~{item.estimatedTraffic} Views
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-450">
                            {item.articleType}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* Reorder actions */}
                              <div className="flex flex-col">
                                <button 
                                  onClick={() => handleMoveItem(index, "up")}
                                  disabled={index === 0}
                                  className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </button>
                                <button 
                                  onClick={() => handleMoveItem(index, "down")}
                                  disabled={index === planItems.length - 1}
                                  className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </button>
                              </div>

                              {isEditing ? (
                                <>
                                  <button onClick={() => saveInlineEdit(item)} className="p-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold">Save</button>
                                  <button onClick={() => setEditingItemId(null)} className="p-1.5 bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(item)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-450 rounded-lg cursor-pointer transition-all"
                                    title="Edit Topic"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleToggleApproval(item)}
                                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                      isApproved 
                                        ? "bg-slate-50 text-emerald-600 hover:bg-emerald-50 border border-emerald-100" 
                                        : "bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-200"
                                    }`}
                                    title={isApproved ? "Approved - click to Reject" : "Rejected - click to Approve"}
                                  >
                                    {isApproved ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                  </button>

                                  <button
                                    onClick={() => handleAutoDraftArticle(item)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                                      item.draftArticleId 
                                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                                        : "bg-blue-600 text-white hover:bg-blue-500 shadow-3xs"
                                    }`}
                                  >
                                    <PenTool className="h-3 w-3" />
                                    {item.draftArticleId ? "Open Draft API" : "Create Auto Draft"}
                                  </button>
                                </>
                              )}

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

  {/* ========================================================== */}
  {/* OUTRANK-STYLE ARTICLE ADD-ON UPGRADE & BILLING MODAL OVERLAY */}
  {/* ========================================================== */}
  <AnimatePresence>
    {showUpgradeModal && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl border border-slate-150 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        >
          {/* Header Region */}
          <div className="bg-slate-900 text-white px-6 py-5 flex justify-between items-center relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 bottom-0 left-0 bg-radial from-indigo-900/50 via-transparent to-transparent pointer-events-none" />
            <div className="z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                  Instant Quotas Scaling
                </span>
                <span className="text-[10px] font-bold text-slate-300">Prorated Upgrade Engine</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-300 fill-amber-300" />
                RankSyncer Article Add-On Plans & Quotas
              </h3>
            </div>

            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700/80 hover:text-white rounded-full text-slate-400 cursor-pointer transition-all border border-slate-700/50 z-10"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Success Notification Banner */}
          {upgradeNotification && (
            <div className="bg-emerald-50 border-y border-emerald-150 px-6 py-3 flex items-center gap-2 text-emerald-800 text-xs font-bold shrink-0 animate-fade-in">
              <Check className="h-4 w-4 text-emerald-600 bg-emerald-100 p-0.5 rounded-full" />
              <span>{upgradeNotification}</span>
            </div>
          )}

          {/* View Mode Mode Toggler (Customer View vs Admin Dashboard View) */}
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setIsAdminView(false)}
                className={`text-xs font-extrabold px-3.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                  !isAdminView ? "bg-white text-indigo-700 shadow-3xs border border-indigo-100" : "text-slate-550 hover:text-slate-850"
                }`}
              >
                💎 Customer Upgrades Marketplace
              </button>
              <button
                onClick={() => {
                  setIsAdminView(true);
                  fetchAdminAnalytics();
                }}
                className={`text-xs font-extrabold px-3.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                  isAdminView ? "bg-white text-indigo-700 shadow-3xs border border-indigo-100" : "text-slate-550 hover:text-slate-850"
                }`}
              >
                ⚙️ Admin Control Center
              </button>
            </div>
            
            <div className="text-[11px] text-slate-400 font-bold">
              User Instance ID: <span className="font-mono text-slate-600">demo-user</span>
            </div>
          </div>

          {/* Modal Main Contents Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!isAdminView ? (
              // ==========================================
              // CUSTOMER UPGRADES MARKETPLACE VIEW
              // ==========================================
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left side: Current status, details & progress tracker */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <span className="text-[9px] uppercase font-black text-slate-450 tracking-wider block">Your License Utilization</span>
                    
                    {quotaLoading ? (
                      <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5 py-4">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Fetching quota balances...
                      </div>
                    ) : quotaState ? (
                      <div className="space-y-4">
                        <div className="flex items-baseline justify-between">
                          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{quotaState.upgraded_quota - quotaState.used_articles}</span>
                          <span className="text-slate-400 text-xs font-semibold">/ {quotaState.upgraded_quota} articles remaining</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" 
                              style={{ width: `${percentageUsed}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-450 font-bold">
                            <span>{quotaState.used_articles} generated</span>
                            <span>{percentageUsed}% utilized</span>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-3.5 space-y-2 text-xs">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-500">Base Quota tier:</span>
                            <span className="text-slate-800">{quotaState.current_quota} / Month</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-500">Add-On expansion:</span>
                            <span className="text-indigo-600">+{quotaState.upgraded_quota - quotaState.current_quota} articles</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-500">Monthly Add-on Rate:</span>
                            <span className="text-slate-800 font-mono">${quotaState.addon_price} / month</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-500">Last Upgrade:</span>
                            <span className="text-slate-800">{quotaState.upgrade_date ? new Date(quotaState.upgrade_date).toLocaleDateString() : "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-rose-500 font-bold">Unable to load live telemetry state</div>
                    )}
                  </div>

                  {/* Future-Proof Dynamic Custom Tier adjuster */}
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                        <span className="text-xs font-black text-indigo-900 uppercase">Scale to Custom Tier</span>
                      </div>
                      <p className="text-[11px] text-indigo-750 font-medium">
                        Need bulk agency capacity? Configure a customized quota tier dynamically. Volume savings are applied automatically.
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex justify-between text-xs font-bold text-indigo-950">
                        <span>Target Quota Size:</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-150">{customQuotaCount} Articles</span>
                      </div>
                      
                      <input 
                        type="range" 
                        min="160" 
                        max="1000" 
                        step="10"
                        value={customQuotaCount}
                        onChange={(e) => setCustomQuotaCount(Number(e.target.value))}
                        className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      
                      <div className="p-3 bg-white border border-indigo-100 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between font-bold text-slate-650">
                          <span>Custom monthly rate:</span>
                          <span className="font-mono text-indigo-900">${Math.round(customQuotaCount * 1.1)}/mo</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-650">
                          <span>Prorated cost today:</span>
                          <span className="font-mono text-emerald-600">${customProratedCost}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleCustomUpgrade}
                        className="w-full py-2 bg-indigo-600 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm uppercase tracking-wider"
                      >
                        Activate Custom Tier Instantly
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right side: Tiers Selector Cards List */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Available Monthly Upgrades Options</span>
                    <span className="text-[10px] uppercase font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                      ⚡ 100% mid-cycle proration applied
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addonPlans.filter(p => p.price > 0).map((plan) => {
                      const isActive = quotaState && quotaState.upgraded_quota === plan.articlesPerMonth;
                      const priceDiff = plan.price - (quotaState ? quotaState.addon_price : 0);
                      const isUpgrade = priceDiff > 0;
                      
                      // Calculate the prorated billing adjustment amount applied today
                      // (target price - current price) * (18 days left / 30 total cycle days)
                      const proratedChargeToday = isUpgrade ? Math.round((priceDiff * 18 * 100) / 30) / 100 : 0;
                      const avgDailyArticles = Math.round(plan.articlesPerMonth / 30);
                      
                      return (
                        <div 
                          key={plan.id}
                          className={`rounded-2xl border p-4.5 flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${
                            isActive 
                              ? "border-indigo-500 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20" 
                              : "border-slate-200 bg-white hover:border-slate-350 hover:shadow-2xs"
                          }`}
                        >
                          {isActive && (
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white font-black text-[9px] uppercase px-2.5 py-1 rounded-bl">
                              Active Tier
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <h4 className="text-sm font-black text-slate-905">{plan.name}</h4>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-slate-950">{plan.articlesPerMonth}</span>
                              <span className="text-slate-405 font-bold text-xs">Articles / mo</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                              Expands active planner target to <span className="font-black text-slate-800">~{avgDailyArticles} articles per day</span>, maximizing topical cluster indexing speed.
                            </p>
                          </div>

                          <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs">
                            <div className="flex justify-between font-bold">
                              <span className="text-slate-500">Monthly rate:</span>
                              <span className="text-slate-800 font-mono">${plan.price}/mo</span>
                            </div>
                            {isUpgrade && (
                              <div className="flex justify-between font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100/45 text-[11px]">
                                <span>Prorated adjustment:</span>
                                <span className="font-mono font-extrabold">${proratedChargeToday} Today</span>
                              </div>
                            )}
                            {!isUpgrade && !isActive && (
                              <div className="text-[10px] text-slate-450 font-bold text-center">
                                Downgrade pricing of ${plan.price}/mo takes effect at cycle rollover
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleUpgradePlan(plan.id)}
                            disabled={isActive}
                            className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              isActive 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                                : isUpgrade 
                                  ? "bg-slate-900 hover:bg-slate-800 text-white text-shadow hover:shadow-md" 
                                  : "bg-slate-150 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            {isActive ? "Currently Subscribed" : isUpgrade ? "Scale Instantly" : "Downgrade Plan"}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Savings / Rollover Info Disclaimer Box */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-start gap-3">
                    <HelpCircle className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 text-xs text-slate-550 leading-relaxed font-semibold">
                      <p className="font-extrabold text-slate-820 leading-none">Quota Rollover & Billing Protocol Details</p>
                      <p>
                        • Quota resets on your monthly subscription renewal date. Additional add-on capacities are provisioned instantly inside Content Planner without touching your seat subscriptions.
                      </p>
                      <p>
                        • Downgrades allow remaining items to persist until the current billing cycle completes. Refund or rollover credits are kept as RankSyncer wallet reserves.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              // ==========================================
              // ADMIN CONTROL CENTER VIEW
              // ==========================================
              <div className="space-y-6">
                
                {/* Analytics metrics cards summary row */}
                {adminAnalytics ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-1 border border-slate-800">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Total Revenue (Addon Base)</span>
                      <div className="text-2xl font-black text-emerald-400">${adminAnalytics.totalRevenue}</div>
                      <p className="text-[10px] text-slate-450 font-medium">Calculated from dynamic upgrade proration hooks</p>
                    </div>
                    
                    <div className="bg-white text-slate-900 rounded-2xl p-4 space-y-1 border border-slate-200 shadow-3xs">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block">Upgrade Events Executed</span>
                      <div className="text-2xl font-black text-indigo-600">{adminAnalytics.totalUpgradesCount} Upgrades</div>
                      <p className="text-[10px] text-slate-450 font-medium">Tracking lifecycle callbacks successfully</p>
                    </div>

                    <div className="bg-white text-slate-900 rounded-2xl p-4 space-y-1 border border-slate-200 shadow-3xs">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block">Avg Quota Utilization</span>
                      <div className="text-2xl font-black text-amber-500">{adminAnalytics.avgUtilization}%</div>
                      <p className="text-[10px] text-slate-450 font-medium">Overall ratio of generated vs allocated</p>
                    </div>

                    <div className="bg-white text-slate-900 rounded-2xl p-4 space-y-1 border border-slate-200 shadow-3xs">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block">Tiers Descriptors</span>
                      <div className="text-xs font-extrabold space-y-0.5 pt-1">
                        {Object.entries(adminAnalytics.popularity).map(([name, count]: any) => (
                          <div key={name} className="flex justify-between">
                            <span className="text-slate-500 truncate mr-1">{name}:</span>
                            <span className="text-slate-800 font-bold font-mono">{count} accounts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-405 font-bold">Metrics loader running...</div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Tiers Admin Pricing adjusters */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-3xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-xs uppercase font-black text-slate-900">Configure Tier Quotas & Pricing</h4>
                        <p className="text-[10px] text-slate-450 font-bold mt-0.5">Adjust client pricing definitions synced inside database</p>
                      </div>
                      <button
                        onClick={handleSaveAdminPlans}
                        disabled={adminSaving}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all disabled:opacity-50"
                      >
                        {adminSaving ? "Saving..." : "Save Pricing Matrix"}
                      </button>
                    </div>

                    <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                      {adminPlans.map((plan, index) => (
                        <div key={plan.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-450 block font-mono">Plan ID: {plan.id}</span>
                            <input 
                              type="text" 
                              value={plan.name}
                              onChange={(e) => {
                                const copy = [...adminPlans];
                                copy[index].name = e.target.value;
                                setAdminPlans(copy);
                              }}
                              className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-black text-slate-850"
                            />
                          </div>

                          <div className="flex gap-3">
                            <div className="space-y-0.5">
                              <label className="text-[9px] font-black uppercase text-slate-400 block">Quota (Monthly)</label>
                              <input 
                                type="number" 
                                value={plan.articlesPerMonth}
                                onChange={(e) => {
                                  const copy = [...adminPlans];
                                  copy[index].articlesPerMonth = Number(e.target.value);
                                  setAdminPlans(copy);
                                }}
                                className="bg-white border border-slate-205 rounded px-2 py-1 text-xs font-bold w-18 text-center"
                              />
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[9px] font-black uppercase text-slate-400 block">Price (USD)</label>
                              <input 
                                type="number" 
                                value={plan.price}
                                onChange={(e) => {
                                  const copy = [...adminPlans];
                                  copy[index].price = Number(e.target.value);
                                  setAdminPlans(copy);
                                }}
                                className="bg-white border border-slate-205 rounded px-2 py-1 text-xs font-mono font-bold w-18 text-center"
                              />
                            </div>

                            <div className="space-y-0.5 flex flex-col items-center">
                              <label className="text-[9px] font-black uppercase text-slate-400 block">Status</label>
                              <input 
                                type="checkbox"
                                checked={plan.enabled}
                                onChange={(e) => {
                                  const copy = [...adminPlans];
                                  copy[index].enabled = e.target.checked;
                                  setAdminPlans(copy);
                                }}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-550 mt-1 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Sandbox overrides & upgrades live history tracking */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Sandbox Direct Manual Override */}
                    <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-3.5 shadow-3xs">
                      <div>
                        <h4 className="text-xs uppercase font-black text-slate-900 border-b border-slate-100 pb-2">Sandbox Manual Overrides</h4>
                        <p className="text-[10px] text-slate-450 font-semibold mt-1">Directly patch limits or reset user state variables for testing</p>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-500 block">Used Articles</label>
                            <input 
                              type="number"
                              value={adminOverrideUsedCount}
                              onChange={(e) => setAdminOverrideUsedCount(Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-extrabold text-slate-500 block">Allocated Quota</label>
                            <input 
                              type="number"
                              value={adminOverrideTotalCount}
                              onChange={(e) => setAdminOverrideTotalCount(Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-bold"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleAdminOverride}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Push Limit Override Live
                        </button>
                      </div>
                    </div>

                    {/* Upgrades Live Audit history tracker */}
                    <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-3 shadow-3xs max-h-[220px] overflow-y-auto">
                      <h4 className="text-xs uppercase font-black text-indigo-950 border-b border-slate-100 pb-1.5">Upgrades Audit Feed</h4>
                      {adminAnalytics && adminAnalytics.recentUpgrades && adminAnalytics.recentUpgrades.length > 0 ? (
                        <div className="space-y-2.5">
                          {adminAnalytics.recentUpgrades.map((log: any) => (
                            <div key={log.id} className="text-[10px] font-semibold border-b border-slate-50 pb-2 space-y-1">
                              <div className="flex justify-between text-slate-400">
                                <span>ID: {log.id}</span>
                                <span>{new Date(log.upgrade_date).toLocaleTimeString()}</span>
                              </div>
                              <p className="font-bold text-slate-800">
                                User upgraded form <span className="text-rose-500">{log.current_quota}</span> to <span className="text-teal-600 font-extrabold">{log.upgraded_quota} items</span>
                              </p>
                              <div className="flex justify-between">
                                <span className="text-slate-450 uppercase text-[9px] font-mono">Proration Adjust: <strong>${log.prorated_adjustment}</strong></span>
                                <span className="text-emerald-600 font-black">Passed</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold text-center py-4">No recent upgrades logged</p>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            )}
          </div>

          {/* Footer status line wrapper */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-450 font-bold shrink-0">
            <span>RankSyncer Real-Time Subscription Gateway</span>
            <div className="flex gap-4">
              <span>Automatic mid-month proration active (Calculated on 30-day boundaries)</span>
              <span>• Status: Live Gateway</span>
            </div>
          </div>

        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
  );
}
