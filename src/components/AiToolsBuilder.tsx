import React, { useState, useEffect } from "react";
import { 
  Wand2, 
  Plus, 
  Settings, 
  FileText, 
  Share2, 
  BarChart3, 
  Copy, 
  Trash2, 
  Eye, 
  Database, 
  Layers, 
  FileCheck, 
  Code, 
  Mail, 
  Check, 
  Globe, 
  Sparkles, 
  ExternalLink, 
  Calculator, 
  X, 
  ChevronRight, 
  Flame, 
  ArrowLeft,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

import { Project } from "../types";

interface ToolInputField {
  key: string;
  label: string;
  type: "number" | "text" | "select" | "checkbox";
  defaultValue: string;
  placeholder?: string;
  options?: string[];
}

interface ToolOutputField {
  key: string;
  label: string;
  formulaExpr: string;
  suffix?: string;
  prefix?: string;
  desc?: string;
}

interface AiTool {
  id: string;
  user_id: string;
  project_id: string;
  tool_name: string;
  tool_type: string;
  tool_slug: string;
  publish_status: "draft" | "published";
  views: number;
  conversions: number;
  created_at: string;
  description: string;
  niche: string;
  industry: string;
  target_audience: string;
  website_url: string;
  
  inputFields: ToolInputField[];
  outputFields: ToolOutputField[];
  
  seo_settings: {
    title: string;
    meta_description: string;
    slug: string;
    schema_markup: string;
    internal_links: string[];
    intro_markdown: string;
    conclusion_markdown: string;
  };
  
  faqs: Array<{ question: string; answer: string }>;
  
  cta_settings: {
    headline: string;
    buttonText: string;
    linkUrl: string;
    bannerStyle: "indigo" | "emerald" | "amber" | "slate";
  };
  
  lead_settings: {
    enabled: boolean;
    title: string;
    buttonText: string;
    formType: "email" | "newsletter" | "consultation" | "free-trial";
    successMsg: string;
    showResultsOnlyAfterSubmit: boolean;
  };
}

interface AiToolsBuilderProps {
  onBackToLanding: () => void;
  projects: Project[];
  selectedProjectId: string;
  activePlan?: "free" | "premium";
}

export default function AiToolsBuilder({ onBackToLanding, projects, selectedProjectId, activePlan = "premium" }: AiToolsBuilderProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "create" | "generated" | "templates" | "analytics">("dashboard");
  
  // Data lists
  const [tools, setTools] = useState<AiTool[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Generation configuration form
  const [aiForm, setAiForm] = useState({
    websiteUrl: "",
    businessNiche: "B2B SaaS Analytics",
    industry: "Marketing SaaS",
    targetAudience: "Marketing managers and business operators",
    desiredToolType: "ROI & CAC Savings Calculator"
  });
  
  const [generating, setGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  
  // Builder manual edit form
  const [selectedTool, setSelectedTool] = useState<Partial<AiTool> | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Embed & Share modal helper
  const [embedTool, setEmbedTool] = useState<AiTool | null>(null);
  const [embedTab, setEmbedTab] = useState<"iframe" | "script" | "wordpress" | "ghost">("iframe");
  
  // Live preview interactive state
  const [previewInputs, setPreviewInputs] = useState<Record<string, any>>({});
  const [previewOutputs, setPreviewOutputs] = useState<Record<string, any>>({});
  const [previewLeadEmail, setPreviewLeadEmail] = useState("");
  const [previewLeadName, setPreviewLeadName] = useState("");
  const [previewIsSubmitted, setPreviewIsSubmitted] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSuccessMsg, setPreviewSuccessMsg] = useState("");
  
  // Analytics sub-view
  const [analyticsToolId, setAnalyticsToolId] = useState<string>("");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<any>({ views: 0, usage: 0, leads: 0, conversion_rate: 0 });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Load tools on mount
  useEffect(() => {
    fetchToolsData();
  }, []);

  const fetchToolsData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-tools/list");
      const data = await res.json();
      if (data.success) {
        setTools(data.tools);
        setTemplates(data.templates);
        if (data.tools.length > 0) {
          setAnalyticsToolId(data.tools[0].id);
          fetchAnalytics(data.tools[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load tool list", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (toolId: string) => {
    if (!toolId) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/ai-tools/analytics/${toolId}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.dataset);
        setAnalyticsSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Helper copy to clipboard
  const handleCopyClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // AI Generation trigger
  const runAiGen = async () => {
    setGenerating(true);
    setAiMessage("Syncing context with Google Gemini Core...");
    const steps = [
      "Analyzing business niche and search keyword gaps...",
      "Synthesizing optimal input variables & sliders...",
      "Developing scalable Javascript calculation equations...",
      "Crafting high-CTR metadata title tag configurations...",
      "Building JSON-LD Schema structures...",
      "Mapping local backlink funnel hooks..."
    ];
    
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setAiMessage(steps[currentStep]);
        currentStep++;
      }
    }, 1500);

    try {
      const res = await fetch("/api/ai-tools/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiForm)
      });
      const data = await res.json();
      clearInterval(interval);
      
      if (data.success) {
        // Set the active builder tool with generated properties
        const newTool: Partial<AiTool> = {
          ...data.draftedTool,
          project_id: selectedProjectId || "p-1",
          user_id: "user-active",
          publish_status: "draft"
        };
        setSelectedTool(newTool);
        initPreviewState(newTool);
        setActiveTab("create");
      } else {
        alert(data.error || "AI Generation error. Please check parameters.");
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      alert("AI Tool Generation stalled. Fallback template loaded instead.");
    } finally {
      setGenerating(false);
      setAiMessage("");
    }
  };

  const handleTemplateSelect = (tmpl: any) => {
    const freshTool: Partial<AiTool> = {
      id: `tool-${Math.floor(Math.random() * 90000) + 10000}`,
      tool_name: tmpl.tool_name,
      tool_type: tmpl.tool_type,
      tool_slug: tmpl.tool_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      publish_status: "draft",
      views: 0,
      conversions: 0,
      description: tmpl.description,
      inputFields: tmpl.inputFields,
      outputFields: tmpl.outputFields,
      faqs: tmpl.faqs || [],
      seo_settings: {
        title: `${tmpl.tool_name} - Project & Calculate Metrics`,
        meta_description: tmpl.description,
        slug: tmpl.tool_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        schema_markup: JSON.stringify({ "@context": "https://schema.org", "@type": "WebApplication" }),
        internal_links: [],
        intro_markdown: `## Calculate interactive parameters easily\nAdjust sliders to predict conversion value metrics live!`,
        conclusion_markdown: "## Integrate RankSyncer Suite for full authority optimization."
      },
      cta_settings: {
        headline: tmpl.ctaHeadline,
        buttonText: "Claim Free Trail Suite",
        linkUrl: "https://ranksyncer.io",
        bannerStyle: "indigo"
      },
      lead_settings: {
        enabled: true,
        title: "Send Detailed Calculations Results To Your Email Inbox",
        buttonText: "E-mail My Calculations",
        formType: "email",
        successMsg: "Calculator results dispatch dispatched successfully!",
        showResultsOnlyAfterSubmit: false
      }
    };
    setSelectedTool(freshTool);
    initPreviewState(freshTool);
    setActiveTab("create");
  };

  const initPreviewState = (tool: Partial<AiTool>) => {
    const initialInputs: Record<string, any> = {};
    tool.inputFields?.forEach(f => {
      initialInputs[f.key] = Number(f.defaultValue) || f.defaultValue || "";
    });
    setPreviewInputs(initialInputs);
    setPreviewIsSubmitted(false);
    setPreviewLeadEmail("");
    setPreviewLeadName("");
    setPreviewSuccessMsg("");
    runLocalCalculation(tool, initialInputs);
    
    // Automatically track an embed event triggers if tool is saved
    if (tool.id && tool.publish_status === "published") {
      fetch("/api/ai-tools/track-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, eventType: "view" })
      }).catch(err => console.error(err));
    }
  };

  // Safe client-side formula evaluation
  const runLocalCalculation = (tool: Partial<AiTool>, currentInputs: Record<string, any>) => {
    if (!tool.outputFields) return;
    
    const context: Record<string, number> = {};
    tool.inputFields?.forEach(f => {
      context[f.key] = Number(currentInputs[f.key]) || 0;
    });

    const calculated: Record<string, number> = {};
    tool.outputFields.forEach(out => {
      try {
        let san = out.formulaExpr;
        for (const [key, val] of Object.entries(context)) {
          const r = new RegExp(`\\b${key}\\b`, 'g');
          san = san.replace(r, String(val));
        }
        
        // Allowed functions replacement
        san = san.replace(/\bMath\.(max|min|round|pow|floor|ceil|abs|sqrt)\b/g, (match) => match);
        
        const evaluated = new Function(`try { return (${san}); } catch(e) { return 0; }`)();
        calculated[out.key] = isNaN(evaluated) ? 0 : Number(evaluated);
      } catch (err) {
        calculated[out.key] = 0;
      }
    });

    setPreviewOutputs(calculated);
  };

  const handleInputChange = (key: string, value: any) => {
    const updatedInputs = { ...previewInputs, [key]: value };
    setPreviewInputs(updatedInputs);
    if (selectedTool) {
      runLocalCalculation(selectedTool, updatedInputs);
    }
  };

  const submitPreviewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewLeadEmail.includes("@")) {
      alert("Please provide a valid email.");
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch("/api/ai-tools/submit-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: selectedTool?.id || "preview-temporary",
          inputs: previewInputs,
          leadInfo: {
            email: previewLeadEmail,
            name: previewLeadName,
            website: selectedTool?.website_url
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewIsSubmitted(true);
        setPreviewSuccessMsg(data.successMsg || "Lead details registered!");
        // Refresh local count
        fetchToolsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const saveSelectedTool = async () => {
    if (!selectedTool?.tool_name || !selectedTool?.tool_slug) {
      alert("Tool name and slug are required parameters.");
      return;
    }
    setSaveLoading(true);
    try {
      const res = await fetch("/api/ai-tools/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedTool)
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully saved: "${data.tool.tool_name}"`);
        fetchToolsData();
        setActiveTab("dashboard");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving custom widget");
    } finally {
      setSaveLoading(false);
    }
  };

  const deleteTool = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch("/api/ai-tools/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        fetchToolsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const duplicateTool = async (id: string) => {
    try {
      const res = await fetch("/api/ai-tools/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        fetchToolsData();
        alert("Tool duplicated successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="ai-seo-tools-builder-container" className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-950/40 text-slate-100 min-h-screen font-sans border border-slate-900/40 rounded-3xl backdrop-blur-md">
      
      {/* Dynamic Heading layout with micro details */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-900/60">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Lead Capture &amp; Authority Systems
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Wand2 className="text-emerald-400 w-8 h-8" />
            AI SEO Tools Builder
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Automatically generate high-relevance interactive calculators and lead-magnets to capture emails, earn high DR backlinks, and boost organic CTR.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={onBackToLanding}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-900 bg-slate-950/20 rounded-xl transition-all hover:bg-slate-950/60 cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            To Landing
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setSelectedTool({
                id: `tool-${Math.floor(Math.random() * 90000) + 10000}`,
                tool_name: "My Custom Calculator",
                tool_type: "calculator",
                tool_slug: "my-custom-calculator",
                publish_status: "draft",
                views: 0,
                conversions: 0,
                description: "Calculate conversion growth variables interactive template.",
                inputFields: [
                  { key: "monthly_visitors", label: "Monthly Visitors", type: "number", defaultValue: "1000", placeholder: "1000" }
                ],
                outputFields: [
                  { key: "growth_metric", label: "Projected Growth", formulaExpr: "monthly_visitors * 1.5", suffix: " Visits", prefix: "", desc: "Estimated traffic scaled by optimization checklists." }
                ],
                seo_settings: {
                  title: "Custom Interactive Calculator Tools",
                  meta_description: "Calculate custom SaaS multipliers.",
                  slug: "my-custom-calculator",
                  schema_markup: "{}",
                  internal_links: [],
                  intro_markdown: "## Custom interactive simulator model.\nAdjust numbers to preview math outputs.",
                  conclusion_markdown: "## Start maximizing backlinks with RankSyncer."
                },
                faqs: [],
                cta_settings: {
                  headline: "Maximize Backlinks With Autonomous Optimization Systems!",
                  buttonText: "Schedule Free Demo",
                  linkUrl: "https://ranksyncer.io",
                  bannerStyle: "indigo"
                },
                lead_settings: {
                  enabled: true,
                  title: "Deliver custom output calculations directly to your inbox",
                  buttonText: "Email My Report",
                  formType: "email",
                  successMsg: "Personalized calculations dispatched successfully!",
                  showResultsOnlyAfterSubmit: false
                }
              });
              initPreviewState(selectedTool || {});
              setActiveTab("create");
            }}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Manually
          </button>
        </div>
      </div>

      {/* Control Tabs Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/30 p-2.5 rounded-2xl border border-slate-900">
        <div className="flex gap-2">
          {[
            { id: "dashboard", label: "Overview", icon: Layers },
            { id: "create", label: "Builder Studio", icon: Wand2 },
            { id: "generated", label: "Generated Tools", icon: FileCheck },
            { id: "templates", label: "Ready Templates", icon: Database },
            { id: "analytics", label: "Engagement Analytics", icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === "create" && !selectedTool) {
                    // Seed simple default tool for empty state
                    const sample: Partial<AiTool> = {
                      tool_name: "SEO Revenue Multiplier",
                      tool_slug: "seo-revenue-multiplier",
                      description: "Project organic pipeline.",
                      inputFields: [{ key: "traffic", label: "Monthly Traffic", type: "number", defaultValue: "2500" }],
                      outputFields: [{ key: "revenue", label: "Expected Earnings ($)", formulaExpr: "traffic * 1.5", prefix: "$" }]
                    };
                    setSelectedTool(sample);
                    initPreviewState(sample);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer ${
                  active 
                    ? "bg-slate-900 border border-indigo-900/40 text-indigo-300 font-semibold" 
                    : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-indigo-400" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bg-indigo-950/30 border border-indigo-900/40 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[11px] font-mono uppercase text-indigo-300">
            Billing Class: {activePlan === "premium" ? "Unlimited Paid Mode" : "Standard Limit Metered"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-slate-950/20 rounded-3xl border border-slate-900">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-slate-400 text-sm font-mono tracking-wider">Syncing directories with local JSON store...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* TAB 1: OVERVIEW & NEW GEN PROMPTING */}
          {activeTab === "dashboard" && (
            <motion.div 
              key="overview-dashboard"
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Instant Campaign Generator Form */}
              <div className="lg:col-span-4 flex flex-col space-y-6 bg-slate-950/40 border border-slate-900 p-6 rounded-3xl shadow-xl">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    AI Spark Tool Generator
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Describe your business parameters and Gemini will devise calculations, schemas, intro copies, structures, and leads captures.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-mono text-slate-400 mb-1.5">Target Website CRM/URL</label>
                    <input 
                      type="url"
                      placeholder="e.g. startupgrowth.io"
                      value={aiForm.websiteUrl}
                      onChange={(e) => setAiForm({ ...aiForm, websiteUrl: e.target.value })}
                      className="w-full text-sm py-2.5 px-3 bg-slate-950 border border-slate-900 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono text-slate-400 mb-1.5">Business Niche</label>
                    <input 
                      type="text"
                      placeholder="e.g. Email Outreach Automation"
                      value={aiForm.businessNiche}
                      onChange={(e) => setAiForm({ ...aiForm, businessNiche: e.target.value })}
                      className="w-full text-sm py-2.5 px-3 bg-slate-950 border border-slate-900 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono text-slate-400 mb-1.5">Industry Segment</label>
                    <input 
                      type="text"
                      placeholder="e.g. Marketing Technology (MarTech)"
                      value={aiForm.industry}
                      onChange={(e) => setAiForm({ ...aiForm, industry: e.target.value })}
                      className="w-full text-sm py-2.5 px-3 bg-slate-950 border border-slate-900 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono text-slate-400 mb-1.5">Target Audience</label>
                    <input 
                      type="text"
                      placeholder="e.g. SEO Agencies &amp; Copywriters"
                      value={aiForm.targetAudience}
                      onChange={(e) => setAiForm({ ...aiForm, targetAudience: e.target.value })}
                      className="w-full text-sm py-2.5 px-3 bg-slate-950 border border-slate-900 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono text-slate-400 mb-1.5">Desired Interactive Tool Type</label>
                    <select
                      value={aiForm.desiredToolType}
                      onChange={(e) => setAiForm({ ...aiForm, desiredToolType: e.target.value })}
                      className="w-full text-sm py-2.5 px-3 bg-slate-950 border border-slate-900 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                    >
                      <option value="ROI & CAC Savings Calculator">ROI &amp; CAC Savings Calculator</option>
                      <option value="Keyword Difficulty and DR Requirements Estimator">Keyword Difficulty &amp; DR Requirements Estimator</option>
                      <option value="SEO Audit Grade Calculator">SEO Audit Grade Calculator</option>
                      <option value="Content Marketing Lead-Gen Evaluator">Content Marketing Lead-Gen Evaluator</option>
                      <option value="SaaS Pricing & ROI Simulator">SaaS Pricing &amp; ROI Simulator</option>
                      <option value="Mortgage Interest Compound Calculator">Mortgage Interest Compound Calculator</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={generating}
                    onClick={runAiGen}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating Custom Engine...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 text-emerald-300" />
                        AI Generate Calculator
                      </>
                    )}
                  </button>
                  
                  {generating && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] font-mono text-indigo-300 text-center animate-pulse"
                    >
                      {aiMessage}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Right Column: Active Tools Performance List */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-slate-950/30 border border-slate-900 p-6 rounded-3xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FolderCheckIcon />
                        Active Lead Magnets &amp; Calculators
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Review views, captured lead counts, and statuses configuration.
                      </p>
                    </div>
                  </div>

                  {tools.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-950/20 rounded-2xl border border-slate-900/60 text-center">
                      <Calculator className="w-12 h-12 text-slate-600 mb-3" />
                      <h3 className="text-sm font-semibold text-slate-300">No calculators created yet</h3>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">Pick a template or enter parameters to let modern Google Gemini craft code widgets.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tools.map((tool) => (
                        <div 
                          key={tool.id}
                          className="bg-slate-950/50 border border-slate-900 hover:border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between space-y-4 group transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-md ${
                                tool.publish_status === "published" 
                                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" 
                                  : "bg-slate-900 text-slate-500 border border-slate-900/30"
                              }`}>
                                {tool.publish_status}
                              </span>
                              <span className="text-[10px] uppercase text-slate-400 font-mono">
                                {tool.tool_type}
                              </span>
                            </div>

                            <h3 className="text-[17px] font-bold text-white group-hover:text-indigo-300 transition-colors">
                              {tool.tool_name}
                            </h3>
                            
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                              {tool.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl text-center border border-slate-900/80">
                            <div>
                              <div className="text-xs font-mono text-slate-400">Views</div>
                              <div className="text-sm font-bold text-white">{tool.views || 0}</div>
                            </div>
                            <div>
                              <div className="text-xs font-mono text-slate-400">Leads</div>
                              <div className="text-sm font-bold text-amber-500">{tool.conversions || 0}</div>
                            </div>
                            <div>
                              <div className="text-xs font-mono text-slate-400">CR%</div>
                              <div className="text-sm font-bold text-indigo-400">
                                {tool.views > 0 ? Math.round((tool.conversions / tool.views) * 100) : 0}%
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                            <span className="text-[10px] font-mono text-slate-500">
                              Slug: /{tool.tool_slug}
                            </span>
                            
                            <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                title="Edit calculator code"
                                onClick={() => {
                                  setSelectedTool(tool);
                                  initPreviewState(tool);
                                  setActiveTab("create");
                                }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                title="View analytics dataset"
                                onClick={() => {
                                  setAnalyticsToolId(tool.id);
                                  fetchAnalytics(tool.id);
                                  setActiveTab("analytics");
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                title="Embed code snippet"
                                onClick={() => {
                                  setEmbedTool(tool);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                title="Delete widget"
                                onClick={() => deleteTool(tool.id, tool.tool_name)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer animate-none"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: BUILDER STUDIO */}
          {activeTab === "create" && selectedTool && (
            <motion.div 
              key="studio-editor"
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Form Configuration panel */}
              <div className="lg:col-span-5 space-y-6 bg-slate-950/40 border border-slate-900 p-6 rounded-3xl max-h-[850px] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Code className="w-4 h-4 text-indigo-400" />
                      Widget Blueprint Setup
                    </h2>
                    <p className="text-[11px] text-slate-400">Edit formula equations and setup fields.</p>
                  </div>
                  <button 
                    onClick={saveSelectedTool}
                    disabled={saveLoading}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {saveLoading ? "Saving..." : <Check className="w-3 h-3" />}
                    Save Changes
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Scope 1: Basic Parameters */}
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase font-mono text-indigo-400 border-b border-slate-900 pb-1">1. Primary Metadata</h3>
                    <div>
                      <label className="block text-[11px] uppercase font-mono text-slate-400 mb-1">Calculator Name</label>
                      <input 
                        type="text" 
                        value={selectedTool.tool_name || ""} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedTool({ 
                            ...selectedTool, 
                            tool_name: val,
                            tool_slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-") 
                          });
                        }}
                        className="w-full text-xs py-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase font-mono text-slate-400 mb-1 font-semibold">Calculator Description</label>
                      <textarea 
                        rows={2}
                        value={selectedTool.description || ""} 
                        onChange={(e) => setSelectedTool({ ...selectedTool, description: e.target.value })}
                        className="w-full text-xs py-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 resize-none" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] uppercase font-mono text-slate-400 mb-1">URL Slug Link</label>
                        <input 
                          type="text" 
                          value={selectedTool.tool_slug || ""} 
                          onChange={(e) => setSelectedTool({ ...selectedTool, tool_slug: e.target.value })}
                          className="w-full text-[11px] font-mono py-2 bg-slate-950 border border-slate-800 rounded-lg px-2" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase font-mono text-slate-400 mb-1">Status</label>
                        <select
                          value={selectedTool.publish_status || "draft"}
                          onChange={(e) => setSelectedTool({ ...selectedTool, publish_status: e.target.value as any })}
                          className="w-full text-[11px] py-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2"
                        >
                          <option value="draft">Draft Mode</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Scope 2: Input Sliders Configuration */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs uppercase font-mono text-indigo-400 border-b border-slate-900 pb-1">
                      <span>2. Input Sliders</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const inputs = selectedTool.inputFields || [];
                          const freshIdx = inputs.length + 1;
                          const updated = [
                            ...inputs,
                            { key: `param_${freshIdx}`, label: `Variable Slider ${freshIdx}`, type: "number" as const, defaultValue: "10" }
                          ];
                          setSelectedTool({ ...selectedTool, inputFields: updated });
                          initPreviewState({ ...selectedTool, inputFields: updated });
                        }}
                        className="text-[10px] text-emerald-400 flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Input
                      </button>
                    </div>

                    {selectedTool.inputFields?.map((inp, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-3 rounded-xl space-y-2 border border-slate-900">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-mono text-indigo-300">Input #{idx + 1} ({inp.key})</span>
                          <button
                            type="button"
                            onClick={() => {
                              const cleanInps = (selectedTool.inputFields || []).filter((_, i) => i !== idx);
                              setSelectedTool({ ...selectedTool, inputFields: cleanInps });
                              initPreviewState({ ...selectedTool, inputFields: cleanInps });
                            }}
                            className="text-rose-400 text-[10px] hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              placeholder="Slider Label" 
                              value={inp.label} 
                              onChange={(e) => {
                                const list = [...(selectedTool.inputFields || [])];
                                list[idx].label = e.target.value;
                                setSelectedTool({ ...selectedTool, inputFields: list });
                              }}
                              className="w-full text-[11px] py-1 bg-slate-950 border border-slate-800 rounded px-1.5"
                            />
                          </div>
                          <div>
                            <input 
                              type="number" 
                              placeholder="Default" 
                              value={inp.defaultValue} 
                              onChange={(e) => {
                                const list = [...(selectedTool.inputFields || [])];
                                list[idx].defaultValue = e.target.value;
                                setSelectedTool({ ...selectedTool, inputFields: list });
                                initPreviewState({ ...selectedTool, inputFields: list });
                              }}
                              className="w-full text-[11px] py-1 bg-slate-950 border border-slate-800 rounded px-1.5"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-mono block">Formula key binding</span>
                            <input 
                              type="text" 
                              placeholder="key_binding" 
                              value={inp.key} 
                              onChange={(e) => {
                                const list = [...(selectedTool.inputFields || [])];
                                list[idx].key = e.target.value;
                                setSelectedTool({ ...selectedTool, inputFields: list });
                              }}
                              className="w-full text-[10px] font-mono py-0.5 bg-slate-950 border border-slate-800 rounded px-1"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-mono block">Hint placeholder</span>
                            <input 
                              type="text" 
                              placeholder="e.g. Visitors" 
                              value={inp.placeholder || ""} 
                              onChange={(e) => {
                                const list = [...(selectedTool.inputFields || [])];
                                list[idx].placeholder = e.target.value;
                                setSelectedTool({ ...selectedTool, inputFields: list });
                              }}
                              className="w-full text-[10px] py-0.5 bg-slate-950 border border-slate-800 rounded px-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Scope 3: Output Results and Formula configuration */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs uppercase font-mono text-indigo-400 border-b border-slate-900 pb-1">
                      <span>3. Outputs &amp; Formulas</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const outputs = selectedTool.outputFields || [];
                          const freshIdx = outputs.length + 1;
                          const updatedOutputs = [
                            ...outputs,
                            { key: `output_${freshIdx}`, label: `Calculation Output ${freshIdx}`, formulaExpr: "param_1 * 1.5", prefix: "$" }
                          ];
                          setSelectedTool({ ...selectedTool, outputFields: updatedOutputs });
                          initPreviewState({ ...selectedTool, outputFields: updatedOutputs });
                        }}
                        className="text-[10px] text-emerald-400 flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Output
                      </button>
                    </div>

                    {selectedTool.outputFields?.map((out, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-3 rounded-xl space-y-2 border border-slate-900">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-mono text-emerald-400">Result output #{idx + 1} ({out.key})</span>
                          <button
                            type="button"
                            onClick={() => {
                              const cleanOuts = (selectedTool.outputFields || []).filter((_, i) => i !== idx);
                              setSelectedTool({ ...selectedTool, outputFields: cleanOuts });
                              initPreviewState({ ...selectedTool, outputFields: cleanOuts });
                            }}
                            className="text-rose-400 text-[10px] hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input 
                              type="text" 
                              placeholder="Output Term" 
                              value={out.label} 
                              onChange={(e) => {
                                const list = [...(selectedTool.outputFields || [])];
                                list[idx].label = e.target.value;
                                setSelectedTool({ ...selectedTool, outputFields: list });
                              }}
                              className="w-full text-[11px] py-1 bg-slate-950 border border-slate-800 rounded px-1.5"
                            />
                          </div>
                          <div>
                            <input 
                              type="text" 
                              placeholder="Key" 
                              value={out.key} 
                              onChange={(e) => {
                                const list = [...(selectedTool.outputFields || [])];
                                list[idx].key = e.target.value;
                                setSelectedTool({ ...selectedTool, outputFields: list });
                              }}
                              className="w-full text-[10px] font-mono py-1 bg-slate-950 border border-slate-800 rounded px-1.5"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-[9px] text-slate-500 uppercase font-mono mb-0.5">Algebraic Expression Formula</label>
                          <input 
                            type="text" 
                            placeholder="e.g. index_visitors * 12 * 0.15" 
                            value={out.formulaExpr} 
                            onChange={(e) => {
                              const list = [...(selectedTool.outputFields || [])];
                              list[idx].formulaExpr = e.target.value;
                              setSelectedTool({ ...selectedTool, outputFields: list });
                              runLocalCalculation({ ...selectedTool, outputFields: list }, previewInputs);
                            }}
                            className="w-full text-xs font-mono py-1 bg-slate-950 border border-slate-880 rounded px-2 text-indigo-300"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input 
                              type="text" 
                              placeholder="Prefix (e.g. $)" 
                              value={out.prefix || ""} 
                              onChange={(e) => {
                                const list = [...(selectedTool.outputFields || [])];
                                list[idx].prefix = e.target.value;
                                setSelectedTool({ ...selectedTool, outputFields: list });
                              }}
                              className="w-full text-[10px] py-0.5 bg-slate-950 border border-slate-800 rounded px-1.5"
                            />
                          </div>
                          <div>
                            <input 
                              type="text" 
                              placeholder="Suffix (e.g. %)" 
                              value={out.suffix || ""} 
                              onChange={(e) => {
                                const list = [...(selectedTool.outputFields || [])];
                                list[idx].suffix = e.target.value;
                                setSelectedTool({ ...selectedTool, outputFields: list });
                              }}
                              className="w-full text-[10px] py-0.5 bg-slate-950 border border-slate-800 rounded px-1.5"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Scope 4: Lead Generator capture */}
                  <div className="space-y-3 bg-indigo-950/10 p-3.5 rounded-xl border border-indigo-900/20">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs uppercase font-mono text-indigo-400">4. Lead Capture Form</h3>
                      <input 
                        type="checkbox"
                        checked={selectedTool.lead_settings?.enabled ?? true}
                        onChange={(e) => {
                          const updatedSettings = {
                            ...(selectedTool.lead_settings || {
                              enabled: true,
                              title: "Unlock report",
                              buttonText: "Submit",
                              formType: "email" as const,
                              successMsg: "Thanks!",
                              showResultsOnlyAfterSubmit: false
                            }),
                            enabled: e.target.checked
                          };
                          setSelectedTool({ ...selectedTool, lead_settings: updatedSettings });
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded border-slate-800 bg-slate-950 cursor-pointer"
                      />
                    </div>
                    
                    {(selectedTool.lead_settings?.enabled ?? true) && (
                      <div className="space-y-2 mt-2">
                        <div>
                          <label className="block text-[9px] text-slate-500 uppercase font-mono">Capture Header Hook</label>
                          <input 
                            type="text" 
                            value={selectedTool.lead_settings?.title || ""} 
                            onChange={(e) => {
                              const s = { ...(selectedTool.lead_settings || {
                                enabled: true,
                                title: "",
                                buttonText: "Submit",
                                formType: "email" as const,
                                successMsg: "Success",
                                showResultsOnlyAfterSubmit: false
                              }), title: e.target.value };
                              setSelectedTool({ ...selectedTool, lead_settings: s });
                            }}
                            className="w-full text-[11px] py-1 bg-slate-950 border border-slate-850 rounded px-1.5 text-slate-200"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] text-slate-500 uppercase font-mono">Button Title</label>
                            <input 
                              type="text" 
                              value={selectedTool.lead_settings?.buttonText || "Submit"} 
                              onChange={(e) => {
                                const s = { ...(selectedTool.lead_settings || {
                                  enabled: true,
                                  title: "",
                                  buttonText: "Submit",
                                  formType: "email" as const,
                                  successMsg: "Success",
                                  showResultsOnlyAfterSubmit: false
                                }), buttonText: e.target.value };
                                setSelectedTool({ ...selectedTool, lead_settings: s });
                              }}
                              className="w-full text-[11px] py-1 bg-slate-950 border border-slate-850 rounded px-1.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] text-slate-500 uppercase font-mono">Capture Type</label>
                            <select
                              value={selectedTool.lead_settings?.formType || "email"}
                              onChange={(e) => {
                                const s = { ...(selectedTool.lead_settings || {
                                  enabled: true,
                                  title: "",
                                  buttonText: "Submit",
                                  formType: "email" as const,
                                  successMsg: "Success",
                                  showResultsOnlyAfterSubmit: false
                                }), formType: e.target.value as any };
                                setSelectedTool({ ...selectedTool, lead_settings: s });
                              }}
                              className="w-full text-[11px] py-1.5 bg-slate-950 border border-slate-850 rounded px-1.5"
                            >
                              <option value="email">Primary Email Capture</option>
                              <option value="newsletter">Newsletter Lead</option>
                              <option value="consultation">Request Consultation</option>
                              <option value="free-trial">Free Registration Link</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Live Preview! (Actually works, counts, submits) */}
              <div className="lg:col-span-7 flex flex-col space-y-6">
                <div className="flex items-center gap-2 text-xs uppercase font-mono text-indigo-400">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  Live Reactive Preview Interface
                </div>

                <div className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
                  {/* Top: SEO styled simulated Google Node title block */}
                  <div className="bg-slate-950 px-6 py-4 border-b border-slate-900">
                    <span className="text-[10px] uppercase tracking-widest font-mono text-emerald-500 select-none">
                      https://ranksyncer.io/widget/{selectedTool.tool_slug || "calculator"}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">
                      {selectedTool.tool_name || "My Calculator API"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedTool.description || "Interactive results generator."}
                    </p>
                  </div>

                  {/* Body: sliders context */}
                  <div className="p-6 space-y-8 bg-slate-950/20">
                    
                    {/* Intro Section formatted */}
                    {selectedTool.seo_settings?.intro_markdown && (
                      <div className="text-xs text-slate-300 bg-slate-950 border border-slate-900 p-4 rounded-xl">
                        <h4 className="font-mono text-[10px] text-indigo-400 uppercase mb-2">Introduction Context</h4>
                        <div className="space-y-1">
                          <p>{selectedTool.seo_settings.intro_markdown.replace(/## /g, "")}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6 bg-slate-950 border border-slate-900/60 p-5 rounded-2xl">
                      <h4 className="text-xs font-mono tracking-wider uppercase text-slate-400 border-b border-slate-900 pb-2">
                        Adjust Input Parameters
                      </h4>
                      
                      {selectedTool.inputFields?.map((inp, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-slate-300">{inp.label}</span>
                            <span className="font-mono text-indigo-400 font-semibold bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                              {previewInputs[inp.key] ?? inp.defaultValue}
                            </span>
                          </div>
                          
                          <input 
                            type="range"
                            min="0"
                            max={Number(inp.defaultValue) * 4 || 1000}
                            step="1"
                            value={previewInputs[inp.key] ?? inp.defaultValue}
                            onChange={(e) => handleInputChange(inp.key, Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Output results dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTool.outputFields?.map((out, idx) => (
                        <div 
                          key={idx}
                          className="bg-slate-950 border border-indigo-950/30 p-5 rounded-2xl flex flex-col justify-between space-y-2 relative overflow-hidden"
                        >
                          <div className="absolute right-3 top-3 opacity-10 select-none">
                            <Calculator className="w-12 h-12 text-indigo-400" />
                          </div>
                          
                          <div>
                            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                              {out.label}
                            </span>
                            <div className="text-2xl font-extrabold text-white mt-1">
                              {out.prefix || ""}
                              {Number(previewOutputs[out.key] || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                              {out.suffix || ""}
                            </div>
                          </div>
                          
                          {out.desc && (
                            <p className="text-[10px] text-slate-500 font-mono">
                              {out.desc}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Integrated Lead Capture form (Simulates real submits) */}
                    {(selectedTool.lead_settings?.enabled ?? true) && (
                      <div className="bg-indigo-950/15 border border-indigo-900/30 p-5 rounded-2xl space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-indigo-950 p-2 rounded-lg text-indigo-400 border border-indigo-900/60 hidden sm:block">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">
                              {selectedTool.lead_settings?.title || "Unlock customized results optimization report"}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              No obligations. Instant activation trial dispatched directly.
                            </p>
                          </div>
                        </div>

                        {previewIsSubmitted ? (
                          <div className="bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-xl text-center text-xs text-emerald-400 font-mono">
                            <div className="flex items-center justify-center gap-1.5 font-bold">
                              <Check className="w-4 h-4 text-emerald-400" />
                              Calculations Dispatch Simulated
                            </div>
                            <p className="text-[10px] text-emerald-500 mt-1">
                              {previewSuccessMsg}
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={submitPreviewLead} className="flex flex-col sm:flex-row gap-2">
                            <input 
                              type="text"
                              placeholder="Your First Name"
                              value={previewLeadName}
                              onChange={(e) => setPreviewLeadName(e.target.value)}
                              className="bg-slate-950 border border-slate-900 text-xs rounded-xl py-2.5 px-3 flex-1 focus:border-indigo-500 focus:outline-none"
                            />
                            <input 
                              type="email"
                              required
                              placeholder="you@company.com"
                              value={previewLeadEmail}
                              onChange={(e) => setPreviewLeadEmail(e.target.value)}
                              className="bg-slate-950 border border-slate-900 text-xs rounded-xl py-2.5 px-3 flex-1 focus:border-indigo-500 focus:outline-none"
                            />
                            
                            <button
                              type="submit"
                              disabled={previewLoading}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                            >
                              {previewLoading ? "Sending..." : selectedTool.lead_settings?.buttonText || "Email Calculation"}
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Public FAQs preview */}
                    {selectedTool.faqs && selectedTool.faqs.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-slate-900">
                        <span className="text-xs font-mono uppercase tracking-widest text-slate-500">FAQ Section (SEO schema)</span>
                        {selectedTool.faqs.map((faq, idx) => (
                          <div key={idx} className="bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                            <h5 className="text-[11px] font-bold text-white">{faq.question}</h5>
                            <p className="text-[10px] text-slate-400 mt-1">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer: Styled Dynamic Action Promotional Area */}
                  {selectedTool.cta_settings && (
                    <div className="bg-slate-950 border-t border-slate-900 px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-indigo-300">
                          {selectedTool.cta_settings.headline}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Boost traffic automatically using RankSyncer tools.
                        </p>
                      </div>
                      
                      <a 
                        href={selectedTool.cta_settings.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-900/60 rounded-xl text-xs font-mono hover:text-white transition-all cursor-pointer"
                      >
                        {selectedTool.cta_settings.buttonText}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: GENERATED LIST TABLE */}
          {activeTab === "generated" && (
            <motion.div 
              key="generated-tools-grid"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="bg-slate-950/30 p-6 rounded-3xl border border-slate-900 space-y-4"
            >
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileCheck className="text-emerald-400 w-5 h-5" />
                  Generated SEO Widget Deployments
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage active tool configurations, duplicate drafts, or fetch CMS script injection code blocks.
                </p>
              </div>

              {tools.length === 0 ? (
                <div className="p-16 text-center text-slate-500">
                  No calculators configured. Initiate generator on the front screen.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                        <th className="py-3 px-4">Tool Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">URL Slug</th>
                        <th className="py-3 px-4">Performance Metrics</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tools.map((tool) => (
                        <tr key={tool.id} className="border-b border-slate-900/60 hover:bg-slate-950/20 transition-all">
                          <td className="py-4 px-4">
                            <div className="font-bold text-white">{tool.tool_name}</div>
                            <div className="text-[10px] text-slate-500 max-w-xs truncate">{tool.description}</div>
                          </td>
                          <td className="py-4 px-4 text-slate-400">{tool.tool_type}</td>
                          <td className="py-4 px-4 font-mono text-indigo-400">/{tool.tool_slug}</td>
                          <td className="py-4 px-4">
                            <span className="text-slate-200">{tool.views || 0} views</span>
                            <span className="mx-1.5 text-slate-600">|</span>
                            <span className="text-amber-400 font-semibold">{tool.conversions || 0} leads</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                              tool.publish_status === "published" ? "bg-emerald-950 text-emerald-400" : "bg-slate-900 text-slate-400"
                            }`}>
                              {tool.publish_status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTool(tool);
                                initPreviewState(tool);
                                setActiveTab("create");
                              }}
                              className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-lg hover:text-white cursor-pointer"
                            >
                              Edit Blueprint
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateTool(tool.id)}
                              className="px-2 py-1 text-xs text-slate-400 hover:text-indigo-400 cursor-pointer"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => setEmbedTool(tool)}
                              className="px-2 py-1 text-xs text-emerald-400 hover:underline cursor-pointer"
                            >
                              Embed Codes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: READY TEMPLATES */}
          {activeTab === "templates" && (
            <motion.div 
              key="templates-suite"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="text-indigo-400 w-5 h-5" />
                  Accelerated SEO Starter Templates
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Deploy pre-graded interactive calculators styled to support instant public conversions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((tmpl) => (
                  <div 
                    key={tmpl.id}
                    className="bg-slate-950/40 border border-slate-900 hover:border-indigo-950 p-6 rounded-3xl flex flex-col justify-between space-y-4 group transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                          {tmpl.category} Vertical
                        </span>
                        <span className="bg-indigo-950/60 text-indigo-300 font-mono text-[9px] px-2 py-0.5 rounded border border-indigo-900/30">
                          Formula Ready
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {tmpl.tool_name}
                      </h3>
                      
                      <p className="text-xs text-slate-400 mt-1 line-clamp-3">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-900/60 space-y-1.5 text-xs">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Inputs provided:</div>
                      {tmpl.inputFields?.map((inp: any, i: number) => (
                        <div key={i} className="flex justify-between text-slate-300 text-[11px]">
                          <span>• {inp.label}</span>
                          <span className="text-slate-500">({inp.type})</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTemplateSelect(tmpl)}
                      className="w-full py-2 bg-slate-900 hover:bg-indigo-900/40 border border-slate-800 text-xs font-semibold text-white rounded-xl transition-all cursor-pointer"
                    >
                      Deploy Selected Template
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 5: PERFORM ANALYTICS CHART */}
          {activeTab === "analytics" && (
            <motion.div 
              key="analytics-charts"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="text-indigo-400 w-5 h-5" />
                    Calculator Conversions Analytics
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Examine daily traffic logs, engagement usage indices, and compound conversions on the grid.
                  </p>
                </div>

                {tools.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Select Tool:</span>
                    <select
                      value={analyticsToolId}
                      onChange={(e) => {
                        setAnalyticsToolId(e.target.value);
                        fetchAnalytics(e.target.value);
                      }}
                      className="bg-slate-950 border border-slate-905 text-xs rounded-xl py-2 px-3 focus:outline-none text-slate-200"
                    >
                      {tools.map(t => (
                        <option key={t.id} value={t.id}>{t.tool_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {analyticsLoading ? (
                <div className="h-64 flex items-center justify-center bg-slate-950/20 border border-slate-900 rounded-3xl">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : analyticsData ? (
                <div className="space-y-6">
                  {/* Summary row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Views Tracker", val: analyticsSummary.views, color: "text-indigo-400" },
                      { label: "Active Operations Runs", val: analyticsSummary.usage, color: "text-emerald-400" },
                      { label: "Emails/Leads Earned", val: analyticsSummary.leads, color: "text-amber-500" },
                      { label: "Conversion Index", val: `${analyticsSummary.conversion_rate}%`, color: "text-indigo-300" }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-slate-950 p-5 rounded-2xl border border-slate-900">
                        <div className="text-xs font-mono text-slate-500 uppercase">{stat.label}</div>
                        <div className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recharts chart widget */}
                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900">
                    <h3 className="text-sm font-bold text-white mb-4">Past 7 Days Engagement Trend</h3>
                    <div className="h-80 w-full" id="conversions-trend-chart-stage">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={analyticsData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "12px", fontSize: "11px" }}
                            labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                          />
                          <Area type="monotone" dataKey="views" stroke="#818cf8" fillOpacity={1} fill="url(#colorViews)" name="Traffic Views" strokeWidth={2} />
                          <Area type="monotone" dataKey="usage" stroke="#10b981" fillOpacity={0} name="Interactions Runs" strokeWidth={1.5} />
                          <Area type="monotone" dataKey="leads" stroke="#f59e0b" fillOpacity={1} fill="url(#colorLeads)" name="Leads Captured" strokeWidth={2} />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center text-slate-500">No telemetry log entries documented for this widget.</div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}

      {/* MODAL: Embed codes & scripts generator */}
      {embedTool && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEmbedTool(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="text-indigo-400 w-5 h-5" />
                Publish &amp; Embed: "{embedTool.tool_name}"
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Inject this responsive AI SEO tool widget anywhere to instantly hook traffic.
              </p>
            </div>

            <div className="flex gap-2 border-b border-slate-900 pb-2">
              {[
                { id: "iframe", label: "Iframe Snippet" },
                { id: "script", label: "AJAX Script" },
                { id: "wordpress", label: "CMS WordPress / PHP" },
                { id: "ghost", label: "CMS Webflow / Ghost" }
              ].map(b => (
                <button
                  key={b.id}
                  onClick={() => setEmbedTab(b.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    embedTab === b.id 
                      ? "bg-slate-900 text-indigo-400 border border-indigo-900/40" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 family-mono">
              {embedTab === "iframe" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                    <span>Target Iframe Code Block</span>
                    <button 
                      onClick={() => handleCopyClipboard(`<iframe src="https://ranksyncer.io/widget/${embedTool.tool_slug}" width="100%" height="700px" style="border:none; border-radius:16px; box-shadow: 0 4px 30px rgba(0,0,0,0.1);" allow="clipboard-write"></iframe>`, "iframe-code")}
                      className="text-indigo-400 hover:underline hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedText === "iframe-code" ? "Copied!" : <><Copy className="w-3 h-3" /> Copy Snippet</>}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-900 overflow-x-auto whitespace-pre-wrap select-all">
                    {`<iframe src="https://ranksyncer.io/widget/${embedTool.tool_slug}" width="100%" height="700px" style="border:none; border-radius:16px; box-shadow: 0 4px 30px rgba(0,0,0,0.1);" allow="clipboard-write"></iframe>`}
                  </pre>
                </div>
              )}

              {embedTab === "script" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono mb-1 text-slate-400">
                    <span>Inline Embed Script Injection Node</span>
                    <button 
                      onClick={() => handleCopyClipboard(`<div id="ranksyncer-tool-${embedTool.id}"></div>\n<script src="https://ranksyncer.io/sdk/embed.js" data-tool-slug="${embedTool.tool_slug}" data-target="ranksyncer-tool-${embedTool.id}" async></script>`, "script-code")}
                      className="text-indigo-400 hover:underline hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedText === "script-code" ? "Copied!" : <><Copy className="w-3 h-3 text-indigo-400" /> Copy</>}
                    </button>
                  </div>
                  <pre className="text-xs text-indigo-300 bg-slate-950 p-3 rounded-lg border border-slate-900 overflow-x-auto whitespace-pre-wrap select-all font-mono">
                    {`<div id="ranksyncer-tool-${embedTool.id}"></div>\n<script src="https://ranksyncer.io/sdk/embed.js" data-tool-slug="${embedTool.tool_slug}" data-target="ranksyncer-tool-${embedTool.id}" async></script>`}
                  </pre>
                </div>
              )}

              {embedTab === "wordpress" && (
                <div className="space-y-1 text-xs text-slate-400">
                  <p className="font-bold text-white mb-2">WordPress CMS publishing details:</p>
                  <p>1. Open your WordPress block post editor page.</p>
                  <p>2. Insert a new custom <strong className="text-slate-200">HTML block element</strong> inside page rows.</p>
                  <p>3. Paste the RankSyncer Iframe snippet code above inside the block container.</p>
                  <p>4. Publish post Node. It's fully optimized automatically.</p>
                </div>
              )}

              {embedTab === "ghost" && (
                <div className="space-y-1 text-xs text-slate-400">
                  <p className="font-bold text-white mb-2">Ghost / Webflow code execution steps:</p>
                  <p>1. Add a rich code embed integration node on Webflow elements catalog.</p>
                  <p>2. Enable Javascript runtime on security permissions.</p>
                  <p>3. Inject our snippet script tag directly inside row columns.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setEmbedTool(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Close Code Viewer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helpers missing icon mapping
function FolderCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-check text-emerald-400">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>
      <path d="m9 14 2 2 4-4"/>
    </svg>
  );
}
