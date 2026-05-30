import React, { useState } from "react";
import { 
  Book, 
  Key, 
  Terminal, 
  Webhook, 
  Cpu, 
  Copy, 
  Check, 
  Code, 
  Play, 
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight
} from "lucide-react";

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-emerald-950/40 bg-zinc-950 text-emerald-400 font-mono text-[13px] leading-relaxed my-3 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-950/20 bg-zinc-900/80 text-zinc-400 text-xs select-none">
        <span>{language.toUpperCase()}</span>
        <button 
          onClick={copyToClipboard}
          className="flex items-center gap-1 py-1 px-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/20 rounded transition-all duration-150 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-zinc-300">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function DeveloperDocs() {
  const [activeSec, setActiveSec] = useState("started");

  const [testResult, setTestResult] = useState<any>(null);
  const [testingEndpoint, setTestingEndpoint] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  // Endpoint explorer datasets
  const handleTestEndpoint = async (endpoint: string, method: "POST" | "GET", body: any) => {
    setIsTesting(true);
    setTestingEndpoint(endpoint);
    try {
      const res = await fetch(`/api/developer${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer rs_live_3f78a2e1d09c8b6a5f4e3d2c1b0a9f8e"
        },
        body: method === "POST" ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ error: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  const codeSnippets = {
    authCurl: `curl -X GET "https://api.ranksyncer.com/api/developer/v1/keywords/intelligence?keyword=growth+marketing" \\
  -H "Authorization: Bearer rs_live_your_secret_hash_here" \\
  -H "Content-Type: application/json"`,

    authNode: `import { GoogleGenAI } from "@google/genai";
// Initialize developer integration client
const response = await fetch("https://api.ranksyncer.com/api/developer/v1/content/create", {
  method: "POST",
  headers: {
    "Authorization": "Bearer rs_live_your_secret_hash_here",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    keyword: "SEO Content Automation",
    targetWordCount: 1200
  })
});
const data = await response.json();
console.log(data.articleId, data.draft);`,

    cliInstall: `# Install Ranksyncer CLI globally
npm install -g ranksyncer-cli

# Login and authorize using your console api key
ranksyncer login rs_live_3f78a2e1e09c8b6a5f4e3d2c1b...`,

    webhookPayload: `{
  "id": "evt-d8a9e2d7c1",
  "event": "article.published",
  "timestamp": "2026-05-30T11:00:00Z",
  "data": {
    "articleId": "art-9988",
    "title": "Top 10 Emerging SEO Trends in 2026",
    "slug": "top-10-seo-trends-2026",
    "publishedAt": "2026-05-30T10:59:00Z",
    "cms": "Ghost"
  }
}`
  };

  const sections = [
    { id: "started", name: "Getting Started", icon: Book },
    { id: "auth", name: "Authentication", icon: Key },
    { id: "content-apis", name: "Content Planner APIs", icon: Code },
    { id: "keyword-apis", name: "Keywords & Intent APIs", icon: Layers },
    { id: "seo-apis", name: "SEO & Backlinks APIs", icon: Cpu },
    { id: "cli-ref", name: "CLI Reference", icon: Terminal },
    { id: "webhooks", name: "Webhooks Dispatch", icon: Webhook }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 space-y-1">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest px-3 mb-2">Documentation Index</div>
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSec === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => {
                setActiveSec(sec.id);
                setTestResult(null);
                setTestingEndpoint("");
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left cursor-pointer ${
                isActive 
                  ? "bg-emerald-950/40 text-emerald-400 border-l-4 border-emerald-500 pl-2" 
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
              <span>{sec.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Documentation Area */}
      <div className="lg:col-span-3 min-h-[500px] bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6 lg:p-8 space-y-8">
        
        {/* SECTION: GETTING STARTED */}
        {activeSec === "started" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400">
              <Book className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Quickstart Guide</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Getting Started</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Welcome to the **RankSyncer Developer Platform**. Our secure, production-grade REST API and command-line interfaces (CLI) are engineered to let marketing teams, large agencies, and software developers programmatically command all RankSyncer modules.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 space-y-2">
                <div className="p-1.5 bg-emerald-950 text-emerald-400 rounded-lg w-fit">
                  <Key className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">1. Secure Authentication</h4>
                <p className="text-xs text-zinc-400">Obtain an API key from Developer Settings and proxy requests to prevent client token leak.</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 space-y-2">
                <div className="p-1.5 bg-sky-950 text-sky-400 rounded-lg w-fit">
                  <Terminal className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">2. Run Command CLI</h4>
                <p className="text-xs text-zinc-400">Execute rapid site audits, write optimized SEO articles directly from your local system terminal.</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-850 space-y-2">
                <div className="p-1.5 bg-purple-950 text-purple-400 rounded-lg w-fit">
                  <Webhook className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white">3. Register Webhooks</h4>
                <p className="text-xs text-zinc-400">Dispatch instant notifications to your server hooks when articles complete drafts or push live.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-zinc-300 leading-relaxed">
              <span className="font-semibold text-emerald-400 block mb-1">Production SaaS SLA Guarantees:</span>
              Developer APIs achieve optimal global low latency. Standard Enterprise API keys support active streaming, semantic content re-indexing, AI models proxy, and live SEO crawler updates.
            </div>
          </div>
        )}

        {/* SECTION: AUTHENTICATION */}
        {activeSec === "auth" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400">
              <Key className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Security Architecture</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Authentication</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Every API call to the RankSyncer developers gateway must bear your unique authorization token. We support standard header authentication values using the Bearer schema.
            </p>

            <div className="my-4">
              <span className="text-xs font-semibold text-zinc-400 block mb-2">cURL Example Request:</span>
              <CodeBlock code={codeSnippets.authCurl} language="bash" />
            </div>

            <div className="my-4">
              <span className="text-xs font-semibold text-zinc-400 block mb-2">NodeJS Request Example:</span>
              <CodeBlock code={codeSnippets.authNode} language="javascript" />
            </div>

            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 text-xs text-zinc-300 leading-relaxed">
              <span className="font-semibold text-amber-400 block mb-1">⚠️ Security Warning:</span>
              Never store API keys inside client-side JS bundles. API keys carry full permissions to manage, generate, and edit account plans, and must be strictly processed from back-end controllers.
            </div>
          </div>
        )}

        {/* SECTION: CONTENT PLANNER APIS */}
        {activeSec === "content-apis" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400">
              <Code className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">REST Endpoints</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Content Planner Endpoints</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Whip up ready-to-index drafts and outline structures with advanced auto-SEO-structured articles, powered by our Gemini content models.
            </p>

            <div className="border border-zinc-800 rounded-xl overflow-hidden mt-6">
              <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-950 text-emerald-400 font-bold font-mono text-[11px] px-2.5 py-1 rounded">POST</span>
                  <span className="text-xs font-mono font-medium text-zinc-300">/v1/content/plan</span>
                </div>
                <button 
                  onClick={() => handleTestEndpoint("/v1/content/plan", "POST", { niche: "Enterprise CRM", competitors: ["hubspot.com"] })}
                  disabled={isTesting}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{isTesting && testingEndpoint === "/v1/content/plan" ? "Calling..." : "Run Test"}</span>
                </button>
              </div>
              <div className="p-4 space-y-3 bg-zinc-950/35">
                <p className="text-xs text-zinc-400">Generate a structured multi-week SEO content cluster detailing keyword target volumes, difficulties, search intent types, and optimized titles.</p>
                <div className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Request Body:</div>
                <pre className="p-3 bg-zinc-950/80 rounded border border-zinc-900 text-[11px] text-zinc-300 font-mono">
{`{
  "niche": "Enterprise CRM",
  "competitors": ["hubspot.com", "salesforce.com"]
}`}
                </pre>
              </div>
            </div>

            <div className="border border-zinc-800 rounded-xl overflow-hidden mt-4">
              <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-950 text-emerald-400 font-bold font-mono text-[11px] px-2.5 py-1 rounded">POST</span>
                  <span className="text-xs font-mono font-medium text-zinc-300">/v1/content/clusters</span>
                </div>
                <button 
                  onClick={() => handleTestEndpoint("/v1/content/clusters", "POST", { seedKeywords: ["seo engine", "marketing platform", "automated clusters"] })}
                  disabled={isTesting}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{isTesting && testingEndpoint === "/v1/content/clusters" ? "Calling..." : "Run Test"}</span>
                </button>
              </div>
              <div className="p-4 space-y-3 bg-zinc-950/35">
                <p className="text-xs text-zinc-400">Pass an array of seed keyword structures to compile a topical silo maps group.</p>
                <div className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Request Body:</div>
                <pre className="p-3 bg-zinc-950/80 rounded border border-zinc-900 text-[11px] text-zinc-300 font-mono">
{`{
  "seedKeywords": ["seo engine", "marketing platform", "automated clusters"]
}`}
                </pre>
              </div>
            </div>

            {/* Test Results Terminal Overlay */}
            {testResult && (
              <div className="mt-6 space-y-2 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-fade-in">
                <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800 font-mono text-xs text-emerald-400 select-none">
                  <span>LIVE ENDPOINT RESPONSE TERMINAL</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <pre className="p-4 bg-zinc-950 text-[11.5px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-[300px]">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* SECTION: KEYWORD APIS */}
        {activeSec === "keyword-apis" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400">
              <Layers className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">REST Endpoints</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Keywords & Intent Intelligence</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Extract semantic query suggestions, competitive density ratios, organic ranking difficulties, trend matrices, and suggested search intents.
            </p>

            <div className="border border-zinc-800 rounded-xl overflow-hidden mt-6">
              <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-950 text-emerald-400 font-bold font-mono text-[11px] px-2.5 py-1 rounded">POST</span>
                  <span className="text-xs font-mono font-medium text-zinc-300">/v1/keywords/generate</span>
                </div>
                <button 
                  onClick={() => handleTestEndpoint("/v1/keywords/generate", "POST", { seedKeyword: "saas link building" })}
                  disabled={isTesting}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{isTesting && testingEndpoint === "/v1/keywords/generate" ? "Calling..." : "Run Test"}</span>
                </button>
              </div>
              <div className="p-4 space-y-3 bg-zinc-950/35">
                <p className="text-xs text-zinc-400">Generate high-affinity semantic LSI word targets with estimated cost-per-click values and Keyword Difficulties.</p>
                <div className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Request Body:</div>
                <pre className="p-3 bg-zinc-950/80 rounded border border-zinc-900 text-[11px] text-zinc-300 font-mono">
{`{
  "seedKeyword": "saas link building"
}`}
                </pre>
              </div>
            </div>

            {testResult && (
              <div className="mt-6 space-y-2 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-fade-in">
                <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800 font-mono text-xs text-emerald-400">
                  <span>LIVE ENDPOINT RESPONSE TERMINAL</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <pre className="p-4 bg-zinc-950 text-[11.5px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-[300px]">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* SECTION: SEO APIS */}
        {activeSec === "seo-apis" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400">
              <Cpu className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">REST Endpoints</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">SEO Audits, Backlinks & Competitors</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Programmatically invoke crawler profiles targeting site core vitals, crawlability hurdles, external backlink health ratios, competitor keyword positioning, and domain ratings.
            </p>

            <div className="border border-zinc-800 rounded-xl overflow-hidden mt-6">
              <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-950 text-emerald-400 font-bold font-mono text-[11px] px-2.5 py-1 rounded">POST</span>
                  <span className="text-xs font-mono font-medium text-zinc-300">/v1/seo/audit</span>
                </div>
                <button 
                  onClick={() => handleTestEndpoint("/v1/seo/audit", "POST", { domain: "rankings-pros.tech" })}
                  disabled={isTesting}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{isTesting && testingEndpoint === "/v1/seo/audit" ? "Calling..." : "Run Test"}</span>
                </button>
              </div>
              <div className="p-4 space-y-3 bg-zinc-950/35">
                <p className="text-xs text-zinc-400">Trigger standard crawlers for accessibility compliance audits, indexing statuses, meta tags health ratios.</p>
                <div className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Request Body:</div>
                <pre className="p-3 bg-zinc-950/80 rounded border border-zinc-900 text-[11px] text-zinc-300 font-mono">
{`{
  "domain": "rankings-pros.tech"
}`}
                </pre>
              </div>
            </div>

            {testResult && (
              <div className="mt-6 space-y-2 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl animate-fade-in">
                <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800 font-mono text-xs text-emerald-400">
                  <span>LIVE ENDPOINT RESPONSE TERMINAL</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <pre className="p-4 bg-zinc-950 text-[11.5px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-[300px]">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* SECTION: CLI REFERENCE */}
        {activeSec === "cli-ref" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400">
              <Terminal className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Shell Interface</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">CLI Companion Reference</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Use `ranksyncer-cli` to construct automate cron jobs and programmatically command SEO operations directly from standard terminals. Supports full JSON pipeline redirections, automation triggers, and site analyses.
            </p>

            <div className="my-4">
              <span className="text-xs font-semibold text-zinc-400 block mb-2">CLI Global installation and authenticate pairing:</span>
              <CodeBlock code={codeSnippets.cliInstall} language="bash" />
            </div>

            <div className="text-xs font-semibold text-zinc-300 uppercase tracking-widest mt-6">Core Commands Index:</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-850 space-y-1">
                <span className="text-xs font-mono text-emerald-400">ranksyncer generate-article [keyword]</span>
                <p className="text-xs text-zinc-400">Writes a full AI content model outline for standard output.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-850 space-y-1">
                <span className="text-xs font-mono text-emerald-400">ranksyncer audit-site [domain]</span>
                <p className="text-xs text-zinc-400">Instructs central crawlers to compile an immediate audit.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-850 space-y-1">
                <span className="text-xs font-mono text-emerald-400">ranksyncer list-keywords --volume=1000</span>
                <p className="text-xs text-zinc-400">Lists highly matching associated trends.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-850 space-y-1">
                <span className="text-xs font-mono text-emerald-400">ranksyncer publish [articleId] --dest=ghost</span>
                <p className="text-xs text-zinc-400">Command Ghost or Framer synchronization pipelines.</p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: WEBHOOKS DISPATCH */}
        {activeSec === "webhooks" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-400">
              <Webhook className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Webhook Deliveries</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Webhook Integration Payload</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              When content generates, syncs, or auditing reports complete, RankSyncer issues standard HTTPS POST event headers packed with complete meta structures in JSON format.
            </p>

            <div className="my-4">
              <span className="text-xs font-semibold text-zinc-400 block mb-2">Example `article.published` Webhook Event Payload:</span>
              <CodeBlock code={codeSnippets.webhookPayload} language="json" />
            </div>

            <div className="text-xs font-semibold text-zinc-300 uppercase tracking-widest mt-6">List of Supported Event Webhook States:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-300">
              <div className="flex items-center gap-2 bg-zinc-950/40 p-2.5 rounded border border-zinc-850">
                <span className="w-2 h-2 rounded bg-emerald-500"></span>
                <span>`article.generated` — AI model writing completed.</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/40 p-2.5 rounded border border-zinc-850">
                <span className="w-2 h-2 rounded bg-emerald-500"></span>
                <span>`article.published` — Live Sync to external CMS success.</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/40 p-2.5 rounded border border-zinc-850">
                <span className="w-2 h-2 rounded bg-sky-500"></span>
                <span>`audit.completed` — Dynamic spider diagnostic ready.</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950/40 p-2.5 rounded border border-zinc-850">
                <span className="w-2 h-2 rounded bg-purple-500"></span>
                <span>`keywords.completed` — Large cluster sets resolved.</span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
