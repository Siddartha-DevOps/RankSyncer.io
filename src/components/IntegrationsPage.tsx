import React, { useState } from "react";
import { 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  Database, 
  FileText, 
  Grid, 
  HelpCircle, 
  Layers, 
  Link2, 
  Lock, 
  Newspaper, 
  Search, 
  Settings, 
  Sparkles, 
  Terminal, 
  Info,
  ExternalLink,
  Laptop,
  Check,
  AlertCircle
} from "lucide-react";

interface IntegrationsPageProps {
  onBackToLanding: () => void;
  onLaunchApp: () => void;
  onPricingClick: () => void;
  projectsCount: number;
  activePlan: "free" | "premium";
  onTabChange?: (tab: string) => void;
}

interface IntegrationItem {
  id: string;
  name: string;
  category: "cms" | "storage" | "ai" | "analytics" | "automation" | "seo";
  imageUrl: string; 
  description: string;
  status: "available" | "soon";
  docsTitle: string;
  docsContent: {
    overview: string;
    preRequisites: string[];
    steps: string[];
    syncInterval: string;
  };
}

export const IntegrationsPage: React.FC<IntegrationsPageProps> = ({
  onBackToLanding,
  onLaunchApp,
  onPricingClick,
  projectsCount,
  activePlan,
  onTabChange
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeDocItem, setActiveDocItem] = useState<IntegrationItem | null>(null);

  const categories = [
    { id: "all", label: "All Integrations" },
    { id: "cms", label: "CMS & Publishing" },
    { id: "storage", label: "Storage & Documents" },
    { id: "ai", label: "AI Providers" },
    { id: "analytics", label: "Analytics" },
    { id: "automation", label: "Automation" },
    { id: "seo", label: "SEO Tools" },
  ];

  const integrations: IntegrationItem[] = [
    {
      id: "wordpress",
      name: "WordPress",
      category: "cms",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Direct WordPress.org JSON-REST integration. Synchronize metadata, categories, tags, features images, and layout options.",
      status: "available",
      docsTitle: "WordPress Integration Guide",
      docsContent: {
        overview: "Securely establish REST-based publication syncing from RankSyncer's background writing environment into your hosted WordPress blog.",
        preRequisites: [
          "WordPress self-hosted site (v5.6 or higher)",
          "An Application Password generated for your admin account",
          "SSL active (HTTPS enabled URL)"
        ],
        steps: [
          "Navigate to your WordPress Admin dashboard &gt; Users &gt; Profile.",
          "Scroll down to 'Application Passwords' and generate a new password named 'RankSyncer'.",
          "Copy the 24-character security key.",
          "Open RankSyncer Settings and paste your WordPress API endpoint, admin username, and application password.",
          "Run a connection test to bind the channel."
        ],
        syncInterval: "Near real-time (instant dispatch upon article generation or autopilot triggers)"
      }
    },
    {
      id: "webflow",
      name: "Webflow",
      category: "cms",
      imageUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Automate collections publication in Webflow. Full rich-text rendering output with custom property mappings.",
      status: "available",
      docsTitle: "Webflow CMS Synchronization",
      docsContent: {
        overview: "Publish articles directly into Webflow CMS draft and live collections via secure v2 Webflow APIs.",
        preRequisites: [
          "Webflow workspace with a CMS-enabled hosting plan or active staging project",
          "A Personal Access Token (v2 Webflow developer credential)"
        ],
        steps: [
          "Go to Webflow Dashboard &gt; Site Settings &gt; Integrations &gt; App Development.",
          "Create an App or Generate a Personal Access Token with read/write access to CMS items.",
          "In RankSyncer settings, insert your API Token and Collection ID reference.",
          "Execute a manual test sync to verify customized schema property bindings."
        ],
        syncInterval: "Instantaneous API synchronization"
      }
    },
    {
      id: "ghost",
      name: "Ghost CMS",
      category: "cms",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80",
      description: "Deploy lightning-fast publications to your secure Ghost theme with dynamic meta title and excerpt values.",
      status: "available",
      docsTitle: "Ghost CMS Integration Manual",
      docsContent: {
        overview: "Syndicate flat-file post collections into Ghost headless blogs via Admin Integration keys.",
        preRequisites: [
          "Ghost self-hosted or Ghost Pro blog deployment",
          "Active Admin API Key and API URL"
        ],
        steps: [
          "Navigate to Ghost Admin &gt; Settings &gt; Integrations &gt; Add custom integration.",
          "Name the integration 'RankSyncer' and hit create.",
          "Copy both the custom API URL and the Admin API Key.",
          "Enter these in RankSyncer's Ghost panel, and hit save configurations."
        ],
        syncInterval: "Real-time deployment"
      }
    },
    {
      id: "framer",
      name: "Framer CMS",
      category: "cms",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80",
      description: "Direct headless sync mapping for Framer portfolio or startup design layout frameworks.",
      status: "available",
      docsTitle: "Framer CMS Integration",
      docsContent: {
        overview: "Inject written articles directly into interactive Framer site tables via Framer Webhook endpoints.",
        preRequisites: [
          "Active Framer account with a CMS-supported site plan",
          "An active webhook endpoint URL configured to sync table schemas"
        ],
        steps: [
          "Open your Framer project, locate active site collection settings.",
          "Generate a custom API key under workspace settings.",
          "Copy your framed collection ID.",
          "Provide these parameters in RankSyncer's Framer portal and test the pipeline linkage."
        ],
        syncInterval: "Web-triggered dispatch (instant)"
      }
    },
    {
      id: "shopify",
      name: "Shopify Store Blog",
      category: "cms",
      imageUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Push premium content-marketing content safely into your active Shopify Online store blog sections.",
      status: "available",
      docsTitle: "Shopify Storefront Blog Sync",
      docsContent: {
        overview: "Drive organic search users directly to product pages close to conversion points, utilizing Shopify's GraphQL APIs.",
        preRequisites: [
          "Shopify Store Admin account permissions",
          "Custom API distribution access Token with `write_content` scopes active"
        ],
        steps: [
          "Open Shopify Admin &gt; Settings &gt; Apps and sales channels &gt; Develop Apps.",
          "Create a secure custom app and configure Admin API scopes, checking 'write_content' and 'read_content'.",
          "Install App and copy the Admin API access token securely.",
          "Provide Store URL, Access Token, and Target Blog ID inside the settings layout of RankSyncer."
        ],
        syncInterval: "Scheduled or instant publication"
      }
    },
    {
      id: "nextjs",
      name: "Next.js Blog Starter",
      category: "cms",
      imageUrl: "https://images.unsplash.com/photo-1618005158179-023f9ec367eb?w=80&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Auto-synced flat files (MDX or Markdown) generated and committed directly into your active GitHub codebases.",
      status: "available",
      docsTitle: "Next.js Headless Code Pipeline",
      docsContent: {
        overview: "Automatically compile and push optimized Markdown files directly into active GitHub repositories, firing optional redeployment webhooks on Vercel.",
        preRequisites: [
          "GitHub Personal Access Token (PAT) with repository write permissions",
          "Target repository containing clean posts/ or blogs/ content layouts"
        ],
        steps: [
          "Configure GitHub Developer Personal access token.",
          "Sync directory directories and layout specifications matching standard Nextjs App Router.",
          "Input Vercel Webhook endpoint to invoke live builds after file commit operations.",
          "Test live file generation pipelines directly in Settings panel."
        ],
        syncInterval: "Git commit updates executed seamlessly"
      }
    },
    {
      id: "notion",
      name: "Notion Directory Sync",
      category: "cms",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80",
      description: "Publish content-marketing articles dynamically into shared Notion databases for administrative drafting or client sign-off.",
      status: "available",
      docsTitle: "Notion Integration Hub Setup",
      docsContent: {
        overview: "Translate generated articles to nested Notion workspace blocks within database indices.",
        preRequisites: [
          "Notion Workspace with permission to install custom integrations",
          "Internal Integration Token and custom relation database ID"
        ],
        steps: [
          "Open notion.so/my-integrations and click 'New Integration'. Name it 'RankSyncer'.",
          "Grant internal connection access and copy the Integration secret token.",
          "Open your target notion page, tap the triple dots option &gt; Connections &gt; Add connection, choose RankSyncer.",
          "Add the database page ID parameters globally inside RankSyncer parameters."
        ],
        syncInterval: "Synchronic blocks population (instant)"
      }
    },
    {
      id: "wix",
      name: "Wix Site CMS",
      category: "cms",
      imageUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=80",
      description: "Direct headless sync API mapping for Wix site layouts and blog templates.",
      status: "soon",
      docsTitle: "Wix Integration Roadmap",
      docsContent: {
        overview: "We are actively developing Wix Headless API schema sync for Wix blogs.",
        preRequisites: [
          "Wix site with Wix REST collection keys"
        ],
        steps: [
          "Coming soon in version 1.3"
        ],
        syncInterval: "Real-time sync"
      }
    },
    {
      id: "gdrive",
      name: "Google Drive",
      category: "storage",
      imageUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=80",
      description: "Automatically back up blog drafts, images, and HTML/Markdown assets seamlessly into custom shared folders.",
      status: "available",
      docsTitle: "Google Drive Backup Setup",
      docsContent: {
        overview: "Organize drafts in shared storage structures before triggering client review workflows.",
        preRequisites: [
          "Authorized cloud workspace account",
          "RankSyncer folder generation credentials"
        ],
        steps: [
          "Navigate to Workspace integrations in setting console.",
          "Click 'Connect Google Workspace Account'.",
          "Approve permissions to view & write content assets inside drive folders.",
          "Verify test backups sync automatically upon article production."
        ],
        syncInterval: "Instant cloud backups"
      }
    },
    {
      id: "dropbox",
      name: "Dropbox Business",
      category: "storage",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80",
      description: "Automate folders upload of research datasets, localized PDFs, and social graphical vectors.",
      status: "soon",
      docsTitle: "Dropbox Sync API Link",
      docsContent: {
        overview: "In development. Will connect directory storage folder assets via Dropbox App Access channels.",
        preRequisites: ["Enterprise tier account active"],
        steps: ["Coming soon"],
        syncInterval: "Dynamic sync options"
      }
    },
    {
      id: "onedrive",
      name: "Microsoft OneDrive",
      category: "storage",
      imageUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=80",
      description: "Secure flat-files backups containing article content targeting Office365 architectures.",
      status: "soon",
      docsTitle: "OneDrive Office Integration",
      docsContent: {
        overview: "Future release module. Seamless sync mappings supporting Microsoft ecosystem users.",
        preRequisites: ["Active Office 365 licensing"],
        steps: ["Coming soon"],
        syncInterval: "Continuous synchronization"
      }
    },
    {
      id: "openai",
      name: "OpenAI GPT-4o Engine",
      category: "ai",
      imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=80&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Configure custom private API keys to process SEO article outline compositions or multi-language rewrites.",
      status: "available",
      docsTitle: "OpenAI LLM Engine Credentials",
      docsContent: {
        overview: "Leverage private OpenAI API access keys to power advanced semantic structuring, outperforming public model pools.",
        preRequisites: [
          "OpenAI billing account with positive credit logs",
          "Active API Key (sk-proj-...)"
        ],
        steps: [
          "Log into platform.openai.com, navigate to 'API Keys' &gt; Create new secret key.",
          "Copy key securely.",
          "Paste inside RankSyncer API keys pane.",
          "Select model tier choices (GPT-4o or GPT-4o-mini) to serve outline pipelines."
        ],
        syncInterval: "Used on-demand"
      }
    },
    {
      id: "gemini",
      name: "Google Gemini v1.5 Pro",
      category: "ai",
      imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=80&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Power semantic Topical Clusters and dynamic high-fidelity SEO articles with native Gemini 1.5 models.",
      status: "available",
      docsTitle: "Google Gemini Core Integration",
      docsContent: {
        overview: "Unleash extreme 1M+ token context lengths for advanced outranking strategies utilizing native Gemini API keys.",
        preRequisites: [
          "Google AI Studio API credential key"
        ],
        steps: [
          "Acquire a credential key from AI Studio.",
          "Paste credential key inside your private settings area.",
          "Set model preferences and default tones."
        ],
        syncInterval: "Infinite scale on demand"
      }
    },
    {
      id: "anthropic",
      name: "Anthropic Claude 3.5 Sonnet",
      category: "ai",
      imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=80&auto=format&fit=crop&q=80",
      description: "Direct Claude API support for hyper-personalized human-like blog voices and pristine code snippets.",
      status: "available",
      docsTitle: "Anthropic Claude Key Bindings",
      docsContent: {
        overview: "Inject custom Claude 3.5 Sonnet endpoints for writing pipelines.",
        preRequisites: [
          "Anthropic Developer Console key"
        ],
        steps: [
          "Create a secure developer account at console.anthropic.com.",
          "Paste active integration keys inside Settings configurations.",
          "Simulate outputs in Sandbox content playground tests."
        ],
        syncInterval: "Near-instant call parameters"
      }
    },
    {
      id: "gsc",
      name: "Google Search Console",
      category: "analytics",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Direct real-time traffic feed and keyword queries metric sync down to RankSyncer dashboard widgets.",
      status: "available",
      docsTitle: "Google Search Console Connectivity",
      docsContent: {
        overview: "Extract active click rates, impressions counts, average scores, and tracking keywords from GSC.",
        preRequisites: [
          "Verified Google Search Console site authority"
        ],
        steps: [
          "Navigate to 'Monitor Projects' or 'Dashboard' tab inside the RankSyncer App.",
          "Find 'Connect Google Search Console' option.",
          "Approve OAuth verification requests.",
          "Select the active target web domain index matching your projects list."
        ],
        syncInterval: "Daily automated synchronizations"
      }
    },
    {
      id: "ga4",
      name: "Google Analytics 4",
      category: "analytics",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&auto=format&fit=crop&q=80",
      description: "Capture user sessions length, tracking drop rates, and conversion benchmarks.",
      status: "available",
      docsTitle: "Analytics 4 Data Extraction",
      docsContent: {
        overview: "Inject live session tracking indicators straight into campaign monitoring dashboards.",
        preRequisites: [
          "Google Analytics dashboard site ID code"
        ],
        steps: [
          "Select properties inside your GSC config wizard.",
          "Integrate GA4 tags into the header of tracked properties.",
          "Configure reporting metrics views."
        ],
        syncInterval: "Continuous hourly stream mappings"
      }
    },
    {
      id: "plausible",
      name: "Plausible Analytics",
      category: "analytics",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&auto=format&fit=crop&q=80",
      description: "Privacy-focused, lightweight tracking alternative for lightweight nextjs structures.",
      status: "soon",
      docsTitle: "Plausible Custom Integration",
      docsContent: {
        overview: "Future tracking metrics addition for minimalist blogs.",
        preRequisites: ["Plausible site token identifiers"],
        steps: ["Coming soon"],
        syncInterval: "Instant stats"
      }
    },
    {
      id: "zapier",
      name: "Zapier",
      category: "automation",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80",
      description: "Trigger automated marketing flows over thousands of SaaS applications on successful publication.",
      status: "soon",
      docsTitle: "Zapier Automated Actions",
      docsContent: {
        overview: "Deliver live Webhook structures to invoke Zap triggers on social media platforms.",
        preRequisites: ["Active Zapier premium workflows account"],
        steps: ["Coming soon"],
        syncInterval: "Instantaneous execution"
      }
    },
    {
      id: "make",
      name: "Make.com (Integromat)",
      category: "automation",
      imageUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=80",
      description: "Design highly-customized, multi-layered publishing filters with Make scenario canvas layouts.",
      status: "soon",
      docsTitle: "Make Scenario Sync Integration",
      docsContent: {
        overview: "Synchronize raw outputs to Make JSON formats on publishing clicks.",
        preRequisites: ["Make custom webhook links"],
        steps: ["Coming soon"],
        syncInterval: "Trigger-based syncing"
      }
    },
    {
      id: "slack",
      name: "Slack Notify",
      category: "automation",
      imageUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=80&auto=format&fit=crop&q=80",
      description: "Broadcast instant notification messages to team channels once articles go live.",
      status: "soon",
      docsTitle: "Slack Incoming Webhook",
      docsContent: {
        overview: "In progress. Configure automated notification channels securely.",
        preRequisites: ["Slack channel admin rights"],
        steps: ["Coming soon"],
        syncInterval: "Real-time automated summaries"
      }
    },
    {
      id: "ahrefs",
      name: "Ahrefs Metrics API",
      category: "seo",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&auto=format&fit=crop&q=80",
      description: "Extract direct backlink volumes, difficulty values, and competitor domain indices.",
      status: "soon",
      docsTitle: "Ahrefs API Credentials Setup",
      docsContent: {
        overview: "Extract direct metrics and competitor analysis tables.",
        preRequisites: ["Ahrefs Enterprise API permissions"],
        steps: ["Coming soon"],
        syncInterval: "Regular cron checks"
      }
    },
    {
      id: "semrush",
      name: "Semrush Business",
      category: "seo",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&auto=format&fit=crop&q=80",
      description: "Import rich competitor keyword pools directly into topical map research modules.",
      status: "soon",
      docsTitle: "Semrush API Integration",
      docsContent: {
        overview: "Synchronize live search metrics datasets directly.",
        preRequisites: ["Active Semrush development API token keys"],
        steps: ["Coming soon"],
        syncInterval: "Daily automated syncing"
      }
    },
    {
      id: "autopilot",
      name: "RankSyncer Autopilot",
      category: "seo",
      imageUrl: "https://images.unsplash.com/photo-1618005158179-023f9ec367eb?w=80&auto=format&fit=crop&q=80",
      description: "AI-driven loop analyzer that triggers generation pipelines when search metrics indicate position drops.",
      status: "available",
      docsTitle: "Autopilot SEO Control",
      docsContent: {
        overview: "Our signature in-house search optimization engine. Monitors your connected GSC indicators and triggers optimized updates to reclaim organic traffic.",
        preRequisites: [
          "GSC dashboard and CMS integrations properly configured and test inputs verified as green"
        ],
        steps: [
          "Enter your core Dashboard space, enable the 'Autonomous Autopilot' toggle switch.",
          "Tune cluster keyword metrics and set threshold limits.",
          "Let RankSyncer perform autonomous crawls and re-sync optimizations!"
        ],
        syncInterval: "Runs automated checks continuous every 12 hours"
      }
    }
  ];

  const filteredIntegrations = selectedCategory === "all"
    ? integrations
    : integrations.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#faf8f9] text-slate-800 font-sans relative overflow-x-hidden selection:bg-emerald-150 selection:text-emerald-950">
      
      {/* Decorative Grid overlays */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(16, 185, 129, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-emerald-100/20 to-[#4ade80]/10 rounded-full filter blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-gradient-to-tr from-[#34d399]/15 to-transparent rounded-full filter blur-[120px] pointer-events-none z-0" />

      {/* Main Header inside Landing mode menu (sticky) */}
      <header className="sticky top-0 z-50 bg-[#faf8f9]/85 backdrop-blur-md border-b border-emerald-100/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="cursor-pointer" onClick={onBackToLanding}>
            <div className="flex items-center space-x-3">
              <span className="font-sans font-black tracking-tighter text-lg text-slate-900 flex items-center gap-1.5 hover:opacity-85">
                <span className="h-6 w-6 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black text-xs h-6 w-6 shadow-xs border border-emerald-500/30">R</span>
                RankSyncer<span className="text-emerald-600 font-black">.</span>
              </span>
            </div>
          </div>

          {/* Nav items matching the requirements */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <button onClick={onBackToLanding} className="hover:text-emerald-600 transition-colors cursor-pointer font-semibold text-slate-600">
              How It Works
            </button>
            <button onClick={onBackToLanding} className="hover:text-emerald-600 transition-colors cursor-pointer font-semibold text-slate-600">
              Features
            </button>
            <button 
              onClick={() => setSelectedCategory("all")} 
              className="text-emerald-600 transition-colors font-bold flex items-center gap-1 cursor-pointer"
            >
              Integrations
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            </button>
            <button onClick={onBackToLanding} className="hover:text-emerald-600 transition-colors cursor-pointer font-semibold text-slate-600">
              AI Playground
            </button>
            <button onClick={onPricingClick} className="hover:text-emerald-600 transition-colors cursor-pointer font-semibold text-slate-600">
              Pricing
            </button>
            <button onClick={onLaunchApp} className="hover:text-emerald-600 transition-colors cursor-pointer font-semibold text-slate-600">
              Control Panel ({projectsCount} site{projectsCount !== 1 ? 's' : ''})
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            <button 
              onClick={onLaunchApp}
              className="text-sm font-bold text-slate-700 hover:text-emerald-600 px-3 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={onLaunchApp}
              className="bg-slate-900 text-white hover:bg-emerald-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
            >
              Launch Console
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100/40 text-emerald-800 text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-emerald-500/10">
          <Layers className="h-3 w-3" />
          Native CMS Sync Ecosystem
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
          Integrate. Automate. <span className="text-emerald-600">Relax.</span>
        </h1>
        
        <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium leading-relaxed">
          RankSyncer connects to your favorite platforms and takes care of publishing, so you don’t have to.
        </p>
      </section>

      {/* FILTER BUTTONS ROW */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 relative mb-10">
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-slate-100 pb-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* INTEGRATIONS GRID SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 relative pb-24">
        
        {/* Render sections grouped dynamically */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map(item => (
            <div 
              key={item.id}
              className="group bg-white/40 backdrop-blur-md rounded-3xl border border-slate-200/60 p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              id={`integ-card-${item.id}`}
            >
              {/* Glow Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-transparent to-emerald-500/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <div className="space-y-4">
                {/* Logo and status badge row */}
                <div className="flex items-center justify-between">
                  {/* Styled circular container for logo placeholder */}
                  <div className="h-12 w-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black relative overflow-hidden shadow-xs">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{item.name.charAt(0)}</span>
                    )}
                  </div>

                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                    item.status === 'available'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                  }`}>
                    {item.status === 'available' ? 'Available' : 'Coming Soon'}
                  </span>
                </div>

                {/* Info block */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 capitalize font-bold tracking-wider text-[9px]">
                    {item.category === 'cms' ? 'CMS & Publishing' : 
                     item.category === 'storage' ? 'Storage & Backup' : 
                     item.category === 'ai' ? 'AI Model Provider' : 
                     item.category === 'analytics' ? 'Analytics Indexer' : 
                     item.category === 'automation' ? 'Web Automation' : 'SEO Core Services'}
                  </p>
                  <p className="text-slate-500 text-xs mt-3 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* View Docs action button */}
              <div className="border-t border-slate-100/80 pt-4 mt-5">
                <button
                  onClick={() => setActiveDocItem(item)}
                  className="w-full py-1.5 flex items-center justify-between transition-all group/btn text-slate-500 group-hover:text-emerald-600 cursor-pointer"
                >
                  <span className="text-xs font-black tracking-tight group-hover/btn:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse hidden group-hover:inline-block" />
                    View Docs
                  </span>
                  
                  {/* Glowing Arrow Indicator */}
                  <span className="p-1 rounded-lg bg-slate-100 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 transition-all shadow-2xs">
                    <ArrowRight className="h-3 w-3 transform group-hover/btn:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic empty state handling if filter is empty */}
        {filteredIntegrations.length === 0 && (
          <div className="text-center py-16 bg-white/50 backdrop-blur-md rounded-3xl border border-slate-200 p-8">
            <Info className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-sm font-black text-slate-900">No Integrations in this Category</h4>
            <p className="text-slate-500 text-xs mt-1">We are actively developing pipeline adapters for these tools.</p>
            <button 
              onClick={() => setSelectedCategory("all")}
              className="mt-4 px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
            >
              Show All Services
            </button>
          </div>
        )}
      </main>

      {/* DOCUMENTATION VIEW LAYOUT DRAWER MODAL */}
      {activeDocItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 antialiased">
          {/* Black high opacity backing to highlight modal */}
          <div 
            onClick={() => setActiveDocItem(null)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
          />
          
          <div className="relative bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-slate-950 text-white rounded-xl flex items-center justify-center font-black overflow-hidden shadow-xs">
                  <img src={activeDocItem.imageUrl} alt={activeDocItem.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{activeDocItem.docsTitle}</h3>
                  <p className="text-[10px] text-emerald-600 font-extrabold uppercase bg-emerald-50 px-2 py-0.5 rounded mt-0.5 inline-block border border-emerald-100/50">
                    Integration Docs
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setActiveDocItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed font-sans">
              
              {/* Block 1: Overview */}
              <div className="space-y-1">
                <span className="block text-[10px] font-black uppercase text-slate-400">Overview Synopsys</span>
                <p className="text-slate-650 font-medium bg-slate-50/50 p-3 rounded-2xl border border-slate-150 leading-relaxed">
                  {activeDocItem.docsContent.overview}
                </p>
              </div>

              {/* Block 2: Prerequisites */}
              {activeDocItem.docsContent.preRequisites && activeDocItem.docsContent.preRequisites[0] !== "Coming soon" && (
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-black uppercase text-slate-400">Pre-Requisites Required</span>
                  <ul className="space-y-1">
                    {activeDocItem.docsContent.preRequisites.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Block 3: Step-by-step Setup instructions */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase text-slate-400">Integration Procedures</span>
                {activeDocItem.docsContent.steps && activeDocItem.docsContent.steps[0] !== "Coming soon" ? (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                    {activeDocItem.docsContent.steps.map((st, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="h-4.5 w-4.5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-slate-700 font-medium leading-relaxed pt-0.5" dangerouslySetInnerHTML={{ __html: st }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-amber-800 text-[11px] font-semibold">
                      This connector is currently in design and integration simulation phase. You can test native publications endpoints via our core WordPress and manual webhook models right away.
                    </p>
                  </div>
                )}
              </div>

              {/* Block 4: Sync metrics */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-2.5">
                <div>
                  <span className="block text-[9px] font-black uppercase text-slate-400">Sync Interval Duty</span>
                  <span className="block text-[11px] text-slate-800 font-extrabold">{activeDocItem.docsContent.syncInterval}</span>
                </div>

                <button 
                  onClick={() => {
                    setActiveDocItem(null);
                    onLaunchApp();
                    if (onTabChange) onTabChange("settings");
                  }}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white text-[11px] font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  Configure Now
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-200/50 py-10 mt-12 bg-white/50 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-xs text-slate-450 font-bold uppercase tracking-widest">&copy; 2026 RankSyncer. All Rights Secured.</p>
          <div className="flex justify-center space-x-4 text-xs text-slate-500">
            <a href="#how-it-works" className="hover:underline" onClick={onBackToLanding}>How It Works</a>
            <span>&middot;</span>
            <a href="#features" className="hover:underline" onClick={onBackToLanding}>Features</a>
            <span>&middot;</span>
            <button onClick={onPricingClick} className="hover:underline cursor-pointer">Pricing</button>
          </div>
        </div>
      </footer>

    </div>
  );
};
