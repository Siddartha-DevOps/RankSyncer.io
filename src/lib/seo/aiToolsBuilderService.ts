import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";

const aiToolsDbPath = path.join(process.cwd(), "ai_tools_db.json");

// Initialize Gemini safely and lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// ==========================================
// DB TYPES & REPRESENTATIONS
// ==========================================

export interface ToolInputField {
  key: string;
  label: string;
  type: "number" | "text" | "select" | "checkbox";
  defaultValue: string;
  placeholder?: string;
  options?: string[]; // Used for select type
}

export interface ToolOutputField {
  key: string;
  label: string;
  formulaExpr: string; // Javascript expression string, e.g., "cost / visitors" or "difficulty * 1.5"
  suffix?: string;     // e.g. "%", "$", " Days"
  prefix?: string;     // e.g. "$"
  desc?: string;       // explanatory text
}

export interface AiTool {
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
    schema_markup: string; // Stringified JSON, e.g. Application/Calculator schema
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

export interface AiToolTemplate {
  id: string;
  category: "SEO" | "SaaS" | "Marketing" | "Finance" | "Real Estate" | "E-commerce" | "Agency" | "Local";
  tool_name: string;
  tool_type: string;
  description: string;
  inputFields: ToolInputField[];
  outputFields: ToolOutputField[];
  faqs: Array<{ question: string; answer: string }>;
  ctaHeadline: string;
}

export interface AiToolSubmission {
  id: string;
  tool_id: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  lead_info?: {
    email?: string;
    name?: string;
    website?: string;
  };
  created_at: string;
}

export interface AiToolAnalytic {
  id: string;
  tool_id: string;
  event_type: "view" | "usage" | "lead"; // Track views, clicks/runs, and lead submissions
  timestamp: string;
}

export interface AiToolLead {
  id: string;
  tool_id: string;
  email: string;
  name?: string;
  website_url?: string;
  inputs_snapshot?: string; // stringified JSON inputs
  created_at: string;
}

export interface AiToolsDb {
  ai_tools: AiTool[];
  ai_tool_templates: AiToolTemplate[];
  ai_tool_submissions: AiToolSubmission[];
  ai_tool_analytics: AiToolAnalytic[];
  ai_tool_leads: AiToolLead[];
}

// ==========================================
// DATABASE PERSISTENCE CODE
// ==========================================

export function readAiToolsDb(): AiToolsDb {
  try {
    if (!fs.existsSync(aiToolsDbPath)) {
      const initialDb: AiToolsDb = {
        ai_tools: [],
        ai_tool_templates: [],
        ai_tool_submissions: [],
        ai_tool_analytics: [],
        ai_tool_leads: [],
      };
      
      seedSampleAiToolsData(initialDb);
      fs.writeFileSync(aiToolsDbPath, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const raw = fs.readFileSync(aiToolsDbPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[AI TOOLS DB READ ERROR]:", err);
    return {
      ai_tools: [],
      ai_tool_templates: [],
      ai_tool_submissions: [],
      ai_tool_analytics: [],
      ai_tool_leads: [],
    };
  }
}

export function writeAiToolsDb(db: AiToolsDb): void {
  try {
    fs.writeFileSync(aiToolsDbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[AI TOOLS DB WRITE ERROR]:", err);
  }
}

// ==========================================
// SEEDING THE DB WITH RICH MOCK DATA
// ==========================================

function seedSampleAiToolsData(db: AiToolsDb) {
  // Add templates based on starter templates requested
  db.ai_tool_templates = [
    {
      id: "tmpl-seo",
      category: "SEO",
      tool_name: "Keyword Difficulty Calculator",
      tool_type: "calculator",
      description: "Estimate organic link cost & DR requirements to safely rank on page 1 of Google.",
      inputFields: [
        { key: "keyword_difficulty", label: "Keyword Difficulty (KD %)", type: "number", defaultValue: "45", placeholder: "0-100" },
        { key: "avg_competitor_dr", label: "Average Competitor DR", type: "number", defaultValue: "65", placeholder: "0-100" },
        { key: "external_backlinks", label: "My Current DR and Backlink count", type: "number", defaultValue: "2", placeholder: "Count of referral domains" }
      ],
      outputFields: [
        { key: "backlinks_needed", label: "High-DR Referring Domains Needed", formulaExpr: "Math.max(1, Math.round((avg_competitor_dr * (keyword_difficulty / 100)) - external_backlinks))", suffix: " Domains", prefix: "", desc: "Estimated outreach targets required." },
        { key: "outreach_budget", label: "Estimated Backlink Budget", formulaExpr: "Math.max(1, Math.round((avg_competitor_dr * (keyword_difficulty / 100)) - external_backlinks)) * 150", suffix: "", prefix: "$", desc: "Estimated budget to match competitor strength." },
        { key: "days_to_rank", label: "Time Needed to Secure Index Position", formulaExpr: "Math.round(30 + (keyword_difficulty * 1.8))", suffix: " Days", prefix: "", desc: "Minimum time needed under typical crawling velocity." }
      ],
      faqs: [
        { question: "What is Keyword Difficulty?", answer: "KD is an estimate of how hard it is to rank on the first page of Google for a specific query, primarily based on the backlink profiles of top competitors." },
        { question: "How does competitor DR affect my campaign?", answer: "Domain Rating is logarithmic; matching DR requires significantly more authority hooks if they rank on long-aged nodes." }
      ],
      ctaHeadline: "Generate Custom Automated Cluster Outlines with RankSyncer Creator!"
    },
    {
      id: "tmpl-saas",
      category: "SaaS",
      tool_name: "SaaS Cost and ROI Calculator",
      tool_type: "calculator",
      description: "Measure potential annual savings when replacing custom developers with automated systems.",
      inputFields: [
        { key: "developer_hourly_rate", label: "Dev Hourly Rate", type: "number", defaultValue: "75", placeholder: "$ / Hour" },
        { key: "hours_spent_monthly", label: "Dev Hours Spent Monthly on SEO tasks", type: "number", defaultValue: "30", placeholder: "Hours/mo" },
        { key: "saas_subscription_cost", label: "RankSyncer Monthly Fee", type: "number", defaultValue: "99", placeholder: "$ / Month" }
      ],
      outputFields: [
        { key: "current_monthly_spending", label: "Current Monthly Cost", formulaExpr: "developer_hourly_rate * hours_spent_monthly", suffix: "", prefix: "$", desc: "What you spend today on developers." },
        { key: "annual_savings", label: "Total Projected Annual Savings", formulaExpr: "((developer_hourly_rate * hours_spent_monthly) - saas_subscription_cost) * 12", suffix: "", prefix: "$", desc: "Keep more of your capital inside your product." },
        { key: "savings_ratio", label: "Efficiency Ratio", formulaExpr: "Math.round(((developer_hourly_rate * hours_spent_monthly - saas_subscription_cost) / (developer_hourly_rate * hours_spent_monthly)) * 100)", suffix: "% Saved", prefix: "", desc: "% of your spend returned to margin." }
      ],
      faqs: [
        { question: "Does automation compromise SEO copy quality?", answer: "No. Autonomous SEO generation from modern AI models outperforms generic agency copywriters because schemas and internal links are injected automatically." }
      ],
      ctaHeadline: "Start Automated Optimization with Our Full Suite Trial!"
    },
    {
      id: "tmpl-marketing",
      category: "Marketing",
      tool_name: "Content ROI & CTR Growth Estimator",
      tool_type: "calculator",
      description: "Analyze the traffic and pipeline revenue you are leaving on the search table.",
      inputFields: [
        { key: "monthly_traffic", label: "Current Monthly Search Visits", type: "number", defaultValue: "10000", placeholder: "Visits" },
        { key: "conversion_rate", label: "Signup Conversion Rate (%)", type: "number", defaultValue: "2.5", placeholder: "e.g. 2.5" },
        { key: "customer_value", label: "Customer Lifetime Value (LTV)", type: "number", defaultValue: "1200", placeholder: "$" }
      ],
      outputFields: [
        { key: "current_revenue", label: "Current Search Channel Revenue", formulaExpr: "monthly_traffic * (conversion_rate / 100) * customer_value", suffix: "/mo", prefix: "$", desc: "Estimated monthly revenue value generated today." },
        { key: "future_revenue", label: "Revenue with 20% Search Growth", formulaExpr: "monthly_traffic * 1.2 * (conversion_rate / 100) * customer_value", suffix: "/mo", prefix: "$", desc: "Revenue under basic optimizations." },
        { key: "increment_value", label: "Additional Monthly Income Opportunity", formulaExpr: "(monthly_traffic * 0.2) * (conversion_rate / 100) * customer_value", suffix: "/mo", prefix: "$", desc: "Direct value of ranking higher on intent-oriented terms." }
      ],
      faqs: [
        { question: "How is conversion rate measured?", answer: "Conversion rating counts search visitors who execute an invitation task (like an email signup) compared to raw visits on the nodes." }
      ],
      ctaHeadline: "Claim Your Site CTR Growth Program Today!"
    },
    {
      id: "tmpl-finance",
      category: "Finance",
      tool_name: "Compound Savings Calculator",
      tool_type: "calculator",
      description: "Track compound investment growth over time to attract high-intent financial traffic.",
      inputFields: [
        { key: "principal", label: "Initial Investment", type: "number", defaultValue: "5000", placeholder: "$" },
        { key: "rate", label: "Annual Rate of Return (%)", type: "number", defaultValue: "8", placeholder: "Annual %" },
        { key: "years", label: "Number of Years", type: "number", defaultValue: "10", placeholder: "Years" }
      ],
      outputFields: [
        { key: "total_saved", label: "Total Asset Future Value", formulaExpr: "Math.round(principal * Math.pow(1 + (rate / 100), years))", suffix: "", prefix: "$", desc: "Capital valuation after compound growth period." },
        { key: "interest_earned", label: "Compound Interest Earned", formulaExpr: "Math.round(principal * Math.pow(1 + (rate / 100), years)) - principal", suffix: "", prefix: "$", desc: "Interest yielded passively over the selected period." }
      ],
      faqs: [
        { question: "What is Compound Interest?", answer: "Compound interest is interest calculated on the initial principal, which also includes all of the accumulated interest of previous periods." }
      ],
      ctaHeadline: "Maximize Financial Services Lead Conversion with Custom Widgets!"
    },
    {
      id: "tmpl-realestate",
      category: "Real Estate",
      tool_name: "Mortgage Calculator",
      tool_type: "calculator",
      description: "Estimate monthly mortgage payments to capture real estate intent.",
      inputFields: [
        { key: "home_price", label: "Property Purchase Price", type: "number", defaultValue: "400000", placeholder: "$" },
        { key: "down_payment", label: "Down Payment Amount", type: "number", defaultValue: "80000", placeholder: "$" },
        { key: "interest_rate", label: "Interest Rate (%)", type: "number", defaultValue: "6.5", placeholder: "%" },
        { key: "term_years", label: "Loan Term (Years)", type: "number", defaultValue: "30", placeholder: "Years" }
      ],
      outputFields: [
        { key: "loan_amount", label: "Principal Loan Amount Required", formulaExpr: "home_price - down_payment", suffix: "", prefix: "$", desc: "The capital borrowed from lenders." },
        { key: "monthly_payment", label: "Projected Monthly Principal & Interest", formulaExpr: "Math.round(((home_price - down_payment) * (interest_rate / 100 / 12) * Math.pow(1 + (interest_rate / 100 / 12), term_years * 12)) / (Math.pow(1 + (interest_rate / 100 / 12), term_years * 12) - 1))", suffix: " / Month", prefix: "$", desc: "P&I payment assuming no additional escrow or taxes." }
      ],
      faqs: [
        { question: "Can down payments affect mortgage insurance?", answer: "Most institutions require PMI (Private Mortgage Insurance) if down payments are lower than 20% of the properties aggregate pricing value." }
      ],
      ctaHeadline: "Streamline Mortgage Calculations & Capture Hot Real Estate Leads!"
    },
    {
      id: "tmpl-ecommerce",
      category: "E-commerce",
      tool_name: "Margin and Profit Optimizer",
      tool_type: "calculator",
      description: "Calculate retail margins, profits, and break-even targets for storefronts.",
      inputFields: [
        { key: "cost_of_goods", label: "Product Cost of Goods (COGS)", type: "number", defaultValue: "15", placeholder: "$" },
        { key: "selling_price", label: "Selling Unit Price", type: "number", defaultValue: "49", placeholder: "$" },
        { key: "monthly_units", label: "Monthly Units Sold", type: "number", defaultValue: "250", placeholder: "Units" }
      ],
      outputFields: [
        { key: "unit_margin", label: "Profit Margin per Unit", formulaExpr: "selling_price - cost_of_goods", suffix: "", prefix: "$", desc: "Revenues net of cost." },
        { key: "margin_percent", label: "Gross Margin Ratio", formulaExpr: "Math.round(((selling_price - cost_of_goods) / selling_price) * 100)", suffix: "%", prefix: "", desc: "Percentage of profit per dollar revenue." },
        { key: "monthly_profit", label: "Total Net Monthly Profit", formulaExpr: "(selling_price - cost_of_goods) * monthly_units", suffix: " / Month", prefix: "$", desc: "Consolidated monthly gross profitability estimate." }
      ],
      faqs: [],
      ctaHeadline: "Scale E-commerce Operations with Smart Search Funnels!"
    }
  ];

  // Some seeded active published tools
  db.ai_tools = [
    {
      id: "tool-seeded-1",
      user_id: "user-s-1",
      project_id: "p-1",
      tool_name: "SEO Content ROI Calculator",
      tool_type: "calculator",
      tool_slug: "seo-content-roi-calculator",
      publish_status: "published",
      views: 148,
      conversions: 37,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      description: "An interactive calculator to find out how much incremental revenue organic content assets can drive for your SaaS based on traffic growth variables.",
      niche: "SaaS SEO Marketing",
      industry: "Marketing Technology",
      target_audience: "SaaS CEOs and CMOs",
      website_url: "ranksyncer.io",
      inputFields: [
        { key: "monthly_visitors", label: "Average Blog SEO Traffic", type: "number", defaultValue: "5000", placeholder: "Visitors per month" },
        { key: "trial_cv", label: "CVR to Free Trials (%)", type: "number", defaultValue: "3", placeholder: "e.g. 3%" },
        { key: "trial_to_paid", label: "Trial-to-Paid Conversion (%)", type: "number", defaultValue: "20", placeholder: "e.g. 20%" },
        { key: "arpu", label: "Average Contract Value (ACV)", type: "number", defaultValue: "1500", placeholder: "$" }
      ],
      outputFields: [
        { key: "trials", label: "Expected Signups Generated", formulaExpr: "monthly_visitors * (trial_cv / 100)", suffix: " Trials/mo", prefix: "", desc: "Trial accounts generated from visitor pool." },
        { key: "paid_customers", label: "New Closes per Month", formulaExpr: "monthly_visitors * (trial_cv / 100) * (trial_to_paid / 100)", suffix: " Buyers/mo", prefix: "", desc: "Active purchasing contracts closed." },
        { key: "value", label: "Monthly Revenue Increase", formulaExpr: "monthly_visitors * (trial_cv / 100) * (trial_to_paid / 100) * arpu", suffix: " / Month", prefix: "$", desc: "Estimated monthly search traffic channel revenue." }
      ],
      seo_settings: {
        title: "SEO Content ROI Calculator: Project Search Pipeline Earnings",
        meta_description: "Measure the concrete revenue value hidden behind organic keywords. Input traffic, conversions, and contract pricing value to capture high value leads.",
        slug: "seo-content-roi-calculator",
        schema_markup: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "SEO Content ROI Calculator",
          "applicationCategory": "BusinessApplication",
          "browserRequirements": "Requires JavaScript",
          "operatingSystem": "All"
        }),
        internal_links: ["https://ranksyncer.io/editor", "https://ranksyncer.io/keywords"],
        intro_markdown: "## Find Out What Your Search Engine Traffic is Worth\nMany business managers view publishing search content purely as an expensive cost item. This **SEO ROI Calculator** refutes that by letting you compute values objectively based on conversions.\n\nInput your parameters below and watch the math outline your true organic growth opportunities.",
        conclusion_markdown: "## Ready to Turn Keywords into Revenue Customers?\nStop flying blind on search performance. RankSyncer empowers you to discover profitable long-tails list items, write with active SEO grading, and sync directly to Ghost or WordPress inside 3 clicks."
      },
      faqs: [
        { question: "How does ARPU scale this calculation?", answer: "High contract values make search investments exponentially more profitable, even if the keywords attract smaller volumes." },
        { question: "Is content marketing actually a reliable pipeline channel?", answer: "Yes. Unlike paid ads which stop instantly when budgets halt, high ranking content keeps yielding click-through-traffic and trial leads on continuous autocompletion." }
      ],
      cta_settings: {
        headline: "Multiply Lead Capture with Autonomous SEO Publishing!",
        buttonText: "Integrate RankSyncer SEO Suite",
        linkUrl: "https://ranksyncer.io",
        bannerStyle: "indigo"
      },
      lead_settings: {
        enabled: true,
        title: "Get The Deep SEO ROI Growth Report Outlining Competitor Gaps",
        buttonText: "Receive Detailed Analysis",
        formType: "email",
        successMsg: "Fantastic! Your customized competitor traffic gap playbook has been dispatched to your email address.",
        showResultsOnlyAfterSubmit: false
      }
    }
  ];

  // Seed metrics to provide Recharts visuals
  db.ai_tool_leads = [
    { id: "lead-tl-1", tool_id: "tool-seeded-1", email: "jeff@saasbuilders.net", name: "Jeff G.", website_url: "saasbuilders.net", inputs_snapshot: JSON.stringify({ monthly_visitors: 4000, trial_cv: 2.5, trial_to_paid: 15, arpu: 99 }), created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: "lead-tl-2", tool_id: "tool-seeded-1", email: "sharah@leadgenninja.com", name: "Sarah Taylor", website_url: "leadgenninja.com", inputs_snapshot: JSON.stringify({ monthly_visitors: 12000, trial_cv: 4, trial_to_paid: 22, arpu: 250 }), created_at: new Date(Date.now() - 2 * 86400000).toISOString() }
  ];

  db.ai_tool_submissions = [
    { id: "sub-ts-1", tool_id: "tool-seeded-1", inputs: { monthly_visitors: 2500, trial_cv: 2, trial_to_paid: 10, arpu: 50 }, outputs: { trials: 50, paid_customers: 5, value: 250 }, lead_info: { email: "jeff@saasbuilders.net", name: "Jeff G." }, created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: "sub-ts-2", tool_id: "tool-seeded-1", inputs: { monthly_visitors: 12000, trial_cv: 4, trial_to_paid: 22, arpu: 250 }, outputs: { trials: 480, paid_customers: 105.6, value: 26400 }, lead_info: { email: "sharah@leadgenninja.com", name: "Sarah Taylor" }, created_at: new Date(Date.now() - 2 * 86400000).toISOString() }
  ];

  db.ai_tool_analytics = [
    // Views
    { id: "an-v-1", tool_id: "tool-seeded-1", event_type: "view", timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: "an-v-2", tool_id: "tool-seeded-1", event_type: "view", timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: "an-v-3", tool_id: "tool-seeded-1", event_type: "view", timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: "an-v-4", tool_id: "tool-seeded-1", event_type: "view", timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: "an-v-5", tool_id: "tool-seeded-1", event_type: "view", timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: "an-v-6", tool_id: "tool-seeded-1", event_type: "view", timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: "an-v-7", tool_id: "tool-seeded-1", event_type: "view", timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
    
    // Usage runs
    { id: "an-u-1", tool_id: "tool-seeded-1", event_type: "usage", timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: "an-u-2", tool_id: "tool-seeded-1", event_type: "usage", timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: "an-u-3", tool_id: "tool-seeded-1", event_type: "usage", timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
    
    // Leads captured
    { id: "an-l-1", tool_id: "tool-seeded-1", event_type: "lead", timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: "an-l-2", tool_id: "tool-seeded-1", event_type: "lead", timestamp: new Date(Date.now() - 2 * 86400000).toISOString() }
  ];
}

// ==========================================
// OUTSTANDING HIGH FIDELITY AI BUILDER CORE
// ==========================================

export async function executeAiToolBuilderGen(
  websiteUrl: string,
  businessNiche: string,
  industry: string,
  targetAudience: string,
  desiredToolType: string
): Promise<Partial<AiTool>> {
  const ai = getAiClient();
  
  if (!ai) {
    return generateSimulatedToolFallback(websiteUrl, businessNiche, industry, targetAudience, desiredToolType);
  }

  try {
    const prompt = `Act as an expert product engineer and growth hacking SEO consultant. 
    You need to generate a complete, working interactive web tool/calculator concept designed to sit on a company's website to attract organic traffic, establish topical authority, and capture leads.

    Input Information:
    - Company URL: "${websiteUrl || 'Not provided'}"
    - Business Niche: "${businessNiche}"
    - Industry: "${industry}"
    - Target Audience: "${targetAudience}"
    - Desired Tool / Calculator Type: "${desiredToolType}"

    Please automatically output a meticulously planned structured calculator/tool payload based EXACTLY on the following JSON schema. 
    Make sure output Fields 'formulaExpr' are VALID elementary inline Javascript algebraic operations where variables correspond EXACTLY to input parameter keys. Do not use complex methods unless simple Math like 'Math.max()', 'Math.round()', 'Math.pow()' are needed.
    `;

    const schema = {
      type: Type.OBJECT,
      properties: {
        tool_name: { type: Type.STRING, description: "Elegant, polished name of the tool, e.g. 'Enterprise ROI Calculator'." },
        tool_type: { type: Type.STRING, description: "Calculators, Assessors, Generators" },
        tool_slug: { type: Type.STRING, description: "kebab-case URL slug optimized for SEO." },
        description: { type: Type.STRING, description: "Engaging 2-sentence marketing introduction." },
        inputFields: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING, description: "camel_case parameter key, e.g., 'monthly_visits'." },
              label: { type: Type.STRING, description: "Human user friendly label, e.g., 'Expected Monthly Traffic'." },
              type: { type: Type.STRING, description: "Must be 'number'." }, // Keep it simple and working
              defaultValue: { type: Type.STRING, description: "Sensible starting numeric value as a string." },
              placeholder: { type: Type.STRING, description: "Helpful input hint text." }
            },
            required: ["key", "label", "type", "defaultValue"]
          }
        },
        outputFields: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING, description: "camel_case parameter key, e.g., 'annual_savings'." },
              label: { type: Type.STRING, description: "Human reader output tag, e.g. 'Projected Annual Capital Saved'." },
              formulaExpr: { type: Type.STRING, description: "A simple, executable JS algebraic statement involving keys of inputFields. e.g., 'monthly_visits * 12 * 0.15' or 'Math.round((initial_value * 1.8) + penalty)'. Do NOT prefix with variable names, only write the expression itself." },
              suffix: { type: Type.STRING, description: "Units appended after, e.g., '%', ' Hours'." },
              prefix: { type: Type.STRING, description: "Units prepended before, e.g., '$'." },
              desc: { type: Type.STRING, description: "A sentence explaining how this math serves the user's strategic goals." }
            },
            required: ["key", "label", "formulaExpr"]
          }
        },
        faqs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            },
            required: ["question", "answer"]
          }
        },
        seo_title: { type: Type.STRING, description: "Optimize SEO metadata title tag." },
        seo_meta_desc: { type: Type.STRING, description: "A high-CTR meta description under 155 characters." },
        seo_schema_markup: { type: Type.STRING, description: "Stringified JSON-LD format Application/Calculator schemas." },
        seo_intro_markdown: { type: Type.STRING, description: "2-3 paragraphs of expert SEO introduction context in Markdown." },
        seo_conclusion_markdown: { type: Type.STRING, description: "Rich strategic wrap up in Markdown with internal link references." },
        cta_headline: { type: Type.STRING, description: "Captivating CTA promotion." },
        cta_button_text: { type: Type.STRING, description: "Urgent button call to action." },
        lead_title: { type: Type.STRING, description: "The lead magnet hook, e.g., 'Unlock your custom conversion audit blueprint'." },
        lead_button_text: { type: Type.STRING, description: "ActionButton text for lead capture." }
      },
      required: [
        "tool_name",
        "tool_type",
        "tool_slug",
        "description",
        "inputFields",
        "outputFields",
        "faqs",
        "seo_title",
        "seo_meta_desc",
        "seo_schema_markup",
        "seo_intro_markdown",
        "seo_conclusion_markdown",
        "cta_headline",
        "cta_button_text",
        "lead_title",
        "lead_button_text"
      ]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8,
        systemInstruction: "You are the primary RankSyncer Interactive widget engineer. You output valid JSON conforming exactly to the requested schema. All formulas use mathematical expressions derived solely from input keys provided."
      }
    });

    if (response && response.text) {
      const p = JSON.parse(response.text.trim());
      
      // Map to full AiTool layout
      return {
        tool_name: p.tool_name,
        tool_type: p.tool_type || desiredToolType || "calculator",
        tool_slug: p.tool_slug,
        description: p.description,
        inputFields: p.inputFields,
        outputFields: p.outputFields,
        faqs: p.faqs,
        seo_settings: {
          title: p.seo_title,
          meta_description: p.seo_meta_desc,
          slug: p.tool_slug,
          schema_markup: p.seo_schema_markup,
          internal_links: ["https://ranksyncer.io/free-tools", "https://ranksyncer.io/seo-audit"],
          intro_markdown: p.seo_intro_markdown,
          conclusion_markdown: p.seo_conclusion_markdown
        },
        cta_settings: {
          headline: p.cta_headline,
          buttonText: p.cta_button_text,
          linkUrl: "https://ranksyncer.io",
          bannerStyle: "indigo"
        },
        lead_settings: {
          enabled: true,
          title: p.lead_title,
          buttonText: p.lead_button_text,
          formType: "email",
          successMsg: "Got it! Your personalized lead audit copy has been safely dispatched.",
          showResultsOnlyAfterSubmit: false
        }
      };
    } else {
      throw new Error("Empty text response encountered during tool structural generation.");
    }
  } catch (err) {
    console.error("[GEMINI TOOL BUILDER GENERATOR FAILED]:", err);
    return generateSimulatedToolFallback(websiteUrl, businessNiche, industry, targetAudience, desiredToolType);
  }
}

// ==========================================
// HIGH SOUNDING SUBSTANTIAL CALCULATOR GENERATOR FALLBACKS
// ==========================================

function generateSimulatedToolFallback(
  websiteUrl: string,
  businessNiche: string,
  industry: string,
  targetAudience: string,
  desiredToolType: string
): Partial<AiTool> {
  const genericToolType = desiredToolType || "ROI Calculator";
  const nameSlug = genericToolType.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  
  return {
    tool_name: `Automated ${genericToolType}`,
    tool_type: "calculator",
    tool_slug: `${nameSlug}-custom`,
    description: `A custom generated dynamic interactive calculation interface designed for ${targetAudience || 'broad public targets'} to evaluate metrics in ${industry || 'their specialized domain'}.`,
    inputFields: [
      { key: "volume_annual", label: "Estimated Annual Sales Volume", type: "number", defaultValue: "20000", placeholder: "e.g. 20000 units" },
      { key: "cvr_growth", label: "Expected Growth Rate (%)", type: "number", defaultValue: "15", placeholder: "e.g. 15%" },
      { key: "cost_base", label: "Base Unit Production Cost ($)", type: "number", defaultValue: "45", placeholder: "e.g. $45" }
    ],
    outputFields: [
      { key: "scaled_volume", label: "Optimized Future Sales Volume", formulaExpr: "Math.round(volume_annual * (1 + (cvr_growth / 100)))", suffix: " Units", prefix: "", desc: "Projected output under steady target conversions." },
      { key: "aggregate_cost_savings", label: "Gross Savings Opportunity", formulaExpr: "Math.round(volume_annual * (cvr_growth / 100) * (cost_base * 0.12))", suffix: "", prefix: "$", desc: "Capital optimized under automated workflow efficiencies." }
    ],
    faqs: [
      { question: "How are savings margins predicted?", answer: "Savings calculations are based on standard 12% operational waste reductions achieved by modular search automation." },
      { question: "Can I embed this widget onto WordPress?", answer: "Yes! High grade iframe scripts and snippet copy builders are issued immediately upon publishing." }
    ],
    seo_settings: {
      title: `Free ${genericToolType} for ${industry || 'Modern Leaders'}`,
      meta_description: `Optimize domain traffic and capture prospective enterprise emails using this free interactive custom ${genericToolType}.`,
      slug: `${nameSlug}-custom`,
      schema_markup: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": `Automated ${genericToolType}`,
        "applicationCategory": "BusinessApplication"
      }),
      internal_links: ["https://ranksyncer.io/seo-audit"],
      intro_markdown: `## Accelerate Conversions with Interactive Value\nTraditional landing page templates fail to maintain reader focus because they look identical. This custom interactive **${genericToolType}** changes that by presenting personalized math calculations immediately.`,
      conclusion_markdown: "## Unlock Full Account Access\nElevate your monitoring systems with Keyword Research Suite, Topical Clusters, Automated Backlink Registries, and automated CMS workers."
    },
    cta_settings: {
      headline: "Need Deeper Audits across 1000+ Keyword targets?",
      buttonText: "Schedule Free Consultation",
      linkUrl: "https://ranksyncer.io",
      bannerStyle: "indigo"
    },
    lead_settings: {
      enabled: true,
      title: "Deliver the Interactive Results Report in PDF to My Inbox",
      buttonText: "Send My Report",
      formType: "email",
      successMsg: "Success! The calculation analysis summary has been pushed to your email.",
      showResultsOnlyAfterSubmit: false
    }
  };
}
