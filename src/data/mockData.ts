import { Project, Keyword, Article, CrawlerLog, CompetitorPage, SerpQuestion } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p-1',
    name: 'SaaS Builder Core',
    domain: 'saasbuilder.io',
    visibilityIndex: 68.4,
    avgPosition: 14.2,
    organicTraffic: 14250,
    cmsPlatform: 'wordpress',
    crawlStatus: 'COMPLETED',
    lastCrawledAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    crawlHistory: [45, 48, 52, 59, 61, 65, 68]
  },
  {
    id: 'p-2',
    name: 'Vegan Delights Blog',
    domain: 'vegandelights.com',
    visibilityIndex: 42.1,
    avgPosition: 24.8,
    organicTraffic: 6820,
    cmsPlatform: 'ghost',
    crawlStatus: 'COMPLETED',
    lastCrawledAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    crawlHistory: [30, 31, 35, 33, 38, 40, 42]
  },
  {
    id: 'p-3',
    name: 'Indie Creator Lab',
    domain: 'indiecreatorlab.com',
    visibilityIndex: 12.5,
    avgPosition: 44.1,
    organicTraffic: 840,
    cmsPlatform: 'webflow',
    crawlStatus: 'STALE',
    lastCrawledAt: null,
    crawlHistory: [5, 8, 10, 10, 11, 12, 12]
  }
];

export const INITIAL_KEYWORDS: Keyword[] = [
  { 
    id: 'k-1', 
    projectId: 'p-1', 
    term: 'best micro saas ideas 2026', 
    volume: 2400, 
    difficulty: 32, 
    intent: 'Informational', 
    currentRank: 3, 
    previousRank: 7,
    history: [
      { date: '05-14', rank: 7 },
      { date: '05-15', rank: 6 },
      { date: '05-16', rank: 5 },
      { date: '05-17', rank: 5 },
      { date: '05-18', rank: 4 },
      { date: '05-19', rank: 3 },
      { date: '05-20', rank: 3 }
    ]
  },
  { 
    id: 'k-2', 
    projectId: 'p-1', 
    term: 'how to build saas without coding', 
    volume: 5400, 
    difficulty: 68, 
    intent: 'Informational', 
    currentRank: 12, 
    previousRank: 18,
    history: [
      { date: '05-14', rank: 18 },
      { date: '05-15', rank: 17 },
      { date: '05-16', rank: 15 },
      { date: '05-17', rank: 14 },
      { date: '05-18', rank: 14 },
      { date: '05-19', rank: 12 },
      { date: '05-20', rank: 12 }
    ]
  },
  { 
    id: 'k-3', 
    projectId: 'p-1', 
    term: 'convert nextjs to desktop app', 
    volume: 980, 
    difficulty: 15, 
    intent: 'Commercial', 
    currentRank: 1, 
    previousRank: 1,
    history: [
      { date: '05-14', rank: 1 },
      { date: '05-15', rank: 1 },
      { date: '05-16', rank: 1 },
      { date: '05-17', rank: 1 },
      { date: '05-18', rank: 1 },
      { date: '05-19', rank: 1 },
      { date: '05-20', rank: 1 }
    ]
  },
  { 
    id: 'k-4', 
    projectId: 'p-1', 
    term: 'saas tech stack checklist', 
    volume: 1600, 
    difficulty: 45, 
    intent: 'Commercial', 
    currentRank: 8, 
    previousRank: 14,
    history: [
      { date: '05-14', rank: 14 },
      { date: '05-15', rank: 12 },
      { date: '05-16', rank: 11 },
      { date: '05-17', rank: 9 },
      { date: '05-18', rank: 9 },
      { date: '05-19', rank: 8 },
      { date: '05-20', rank: 8 }
    ]
  },
  { 
    id: 'k-5', 
    projectId: 'p-1', 
    term: 'free tailwind templates boilerplate', 
    volume: 8200, 
    difficulty: 72, 
    intent: 'Transactional', 
    currentRank: 44, 
    previousRank: 59,
    history: [
      { date: '05-14', rank: 59 },
      { date: '05-15', rank: 55 },
      { date: '05-16', rank: 52 },
      { date: '05-17', rank: 48 },
      { date: '05-18', rank: 46 },
      { date: '05-19', rank: 44 },
      { date: '05-20', rank: 44 }
    ]
  },
  
  { 
    id: 'k-6', 
    projectId: 'p-2', 
    term: 'easy vegan dinner recipes 30 mins', 
    volume: 18100, 
    difficulty: 74, 
    intent: 'Informational', 
    currentRank: 15, 
    previousRank: 19,
    history: [
      { date: '05-14', rank: 19 },
      { date: '05-15', rank: 17 },
      { date: '05-16', rank: 16 },
      { date: '05-17', rank: 15 },
      { date: '05-18', rank: 15 },
      { date: '05-19', rank: 15 },
      { date: '05-20', rank: 15 }
    ]
  },
  { 
    id: 'k-7', 
    projectId: 'p-2', 
    term: 'high protein plant based meal prep', 
    volume: 12400, 
    difficulty: 58, 
    intent: 'Commercial', 
    currentRank: 6, 
    previousRank: 4,
    history: [
      { date: '05-14', rank: 4 },
      { date: '05-15', rank: 4 },
      { date: '05-16', rank: 5 },
      { date: '05-17', rank: 5 },
      { date: '05-18', rank: 6 },
      { date: '05-19', rank: 6 },
      { date: '05-20', rank: 6 }
    ]
  },
  { 
    id: 'k-8', 
    projectId: 'p-2', 
    term: 'best plant milk brands ranked', 
    volume: 3200, 
    difficulty: 42, 
    intent: 'Commercial', 
    currentRank: 2, 
    previousRank: 10,
    history: [
      { date: '05-14', rank: 10 },
      { date: '05-15', rank: 8 },
      { date: '05-16', rank: 6 },
      { date: '05-17', rank: 4 },
      { date: '05-18', rank: 3 },
      { date: '05-19', rank: 2 },
      { date: '05-20', rank: 2 }
    ]
  },
  { 
    id: 'k-9', 
    projectId: 'p-2', 
    term: 'vegan cheese that melts reddit', 
    volume: 1750, 
    difficulty: 29, 
    intent: 'Transactional', 
    currentRank: 1, 
    previousRank: 2,
    history: [
      { date: '05-14', rank: 2 },
      { date: '05-15', rank: 2 },
      { date: '05-16', rank: 1 },
      { date: '05-17', rank: 1 },
      { date: '05-18', rank: 1 },
      { date: '05-19', rank: 1 },
      { date: '05-20', rank: 1 }
    ]
  },
 
  { 
    id: 'k-10', 
    projectId: 'p-3', 
    term: 'solopreneur business plan map', 
    volume: 940, 
    difficulty: 23, 
    intent: 'Informational', 
    currentRank: 34, 
    previousRank: 45,
    history: [
      { date: '05-14', rank: 45 },
      { date: '05-15', rank: 41 },
      { date: '05-16', rank: 38 },
      { date: '05-17', rank: 36 },
      { date: '05-18', rank: 35 },
      { date: '05-19', rank: 34 },
      { date: '05-20', rank: 34 }
    ]
  },
  { 
    id: 'k-11', 
    projectId: 'p-3', 
    term: 'monetize newsletter guide 2026', 
    volume: 1100, 
    difficulty: 49, 
    intent: 'Commercial', 
    currentRank: 52, 
    previousRank: 80,
    history: [
      { date: '05-14', rank: 80 },
      { date: '05-15', rank: 74 },
      { date: '05-16', rank: 68 },
      { date: '05-17', rank: 62 },
      { date: '05-18', rank: 58 },
      { date: '05-19', rank: 52 },
      { date: '05-20', rank: 52 }
    ]
  }
];

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'a-1',
    projectId: 'p-1',
    title: 'Top 7 Best Micro SaaS Ideas for Solo Builders in 2026',
    slug: 'best-micro-saas-ideas-2026',
    targetKeyword: 'best micro saas ideas 2026',
    wordCount: 1450,
    seoScore: 92,
    status: 'Published',
    content: `# Top 7 Best Micro SaaS Ideas for Solo Builders in 2026\n\nStarting a software business has never been more straightforward. In 2026, the trend has shifted heavily away from over-engineered mega-platforms toward target-focused, high-efficiency micro-tools. Let's delve into the absolute **best micro saas ideas 2026** has to offer.\n\n## 1. Niche API Mocking Services\nDevelopers constantly spend time crafting local backend configurations just to test frontend layouts. A dedicated mock generator with fine-tuned latency simulation can solve this in seconds.\n\n## 2. Dynamic SEO Crawler and Sync Utilities\nAutomating your internal asset linking is a major win. Providing custom automated analytics reports directly to a CMS without human overhead is why micro-automation is a lucrative field.\n\n## 3. Webhooks-to-SMS Gateway\nMany modern developers prefer basic SMS notifications over checking Slack channels if they're on-the-go. An elegant service that connects triggers to text updates in a simple pricing model is highly desirable.\n\n## Conclusion\nPick a laser-focused niche, prototype it in a weekend, launch immediately on social networks, and start ranking for highly specific technical queries!`,
    lastEdited: new Date(Date.now() - 3600000 * 2).toISOString(),
    metaDescription: 'Discover the top 7 high-gravity micro SaaS ideas for solo developers in 2026. Stand out, generate revenue fast, and automate publishing.'
  },
  {
    id: 'a-2',
    projectId: 'p-1',
    title: 'How to Build SaaS Without Coding: The Modern Stack',
    slug: 'how-to-build-saas-without-coding',
    targetKeyword: 'how to build saas without coding',
    wordCount: 820,
    seoScore: 78,
    status: 'Ready',
    content: `# How to Build SaaS Without Coding\n\nThere is an immense opportunity in learning **how to build saas without coding** right now. Modern tools allow you to piece together visual databases, secure user auth, and responsive UI interfaces easily.\n\n## Step 1: Design your Database visually\nUsing visual relational databases is a great way to map your schema. Set up tables for your users, items, and transactions.\n\n## Step 2: Configure workflows and automation\nConnect web hooks to automate repetitive queries when actions trigger. No code doesn't mean no logic! Use step automation.\n\n## Step 3: Publish directly to your core domain\nOnce set up, route to your own URL and sync with active payment processors. Your platform is ready to launch!`,
    lastEdited: new Date(Date.now() - 3600000 * 48).toISOString(),
    metaDescription: 'A comprehensive visual guide on how to build SaaS without coding using modern workflow orchestrators and visual engines.'
  },
  {
    id: 'a-3',
    projectId: 'p-2',
    title: '9 High Protein Plant Based Meal Prep Tips for Busy Builders',
    slug: 'high-protein-plant-based-meal-prep',
    targetKeyword: 'high protein plant based meal prep',
    wordCount: 1100,
    seoScore: 84,
    status: 'Reviewing',
    content: `# High Protein Plant Based Meal Prep Tips for Busy Builders\n\nFueling a high-focus day doesn't require animal proteins. Let's look at doing a proper **high protein plant based meal prep** routine that takes less than an hour on Sunday but lasts all week.\n\n## Why Plant Prep Matters\nEating vegan clean keeps your mind sharp, avoids digestion crashes, and reduces food waste.\n\n## Essential Ingredients:\n1. Organic Tempeh cubes (21g protein per 100g)\n2. Sprouted Red Lentils (high fiber & zinc)\n3. Shelled Edamame (instant freezer protein boost)\n\nTry roasting these with basic micro greens and avocado dressings to keep energy high!`,
    lastEdited: new Date(Date.now() - 3600000 * 12).toISOString(),
    metaDescription: 'Optimize your energy levels with these quick, delicious, high protein plant based meal prep tips. Perfect for busy creators.'
  }
];

export const INITIAL_LOGS: CrawlerLog[] = [
  { id: 'l-1', timestamp: new Date(Date.now() - 150000).toISOString(), type: 'info', message: 'RankSyncer worker booted on thread Pool-X03', module: 'SERP_CRAWLER' },
  { id: 'l-2', timestamp: new Date(Date.now() - 130000).toISOString(), type: 'info', message: 'Scanning domain saasbuilder.io for keyword gaps', module: 'SERP_CRAWLER' },
  { id: 'l-3', timestamp: new Date(Date.now() - 100000).toISOString(), type: 'success', message: 'Found 4 new high-opportunity semantic clusters. Syncing with Content Planner...', module: 'SERP_CRAWLER' },
  { id: 'l-4', timestamp: new Date(Date.now() - 80000).toISOString(), type: 'info', message: 'Checking backlinks for vegandelights.com (Ahrefs open API node proxy)', module: 'BACKLINK_CHECK' },
  { id: 'l-5', timestamp: new Date(Date.now() - 60000).toISOString(), type: 'success', message: 'Backlink database sync successful: 42 root high-authority referrers logged', module: 'BACKLINK_CHECK' }
];

export const SECONDARY_KEYWORDS_MAP: Record<string, { term: string; min: number; max: number }[]> = {
  'best micro saas ideas 2026': [
    { term: 'micro saas ideas', min: 3, max: 6 },
    { term: 'solo saas builder', min: 2, max: 4 },
    { term: 'best tech stack', min: 1, max: 3 },
    { term: 'how to monetize', min: 1, max: 3 }
  ],
  'how to build saas without coding': [
    { term: 'no code saas', min: 3, max: 6 },
    { term: 'visual database builder', min: 2, max: 4 },
    { term: 'headless workflows', min: 1, max: 3 },
    { term: 'saas development stack', min: 1, max: 3 }
  ],
  'high protein plant based meal prep': [
    { term: 'plant based protein sources', min: 3, max: 6 },
    { term: 'vegan meal preparation', min: 2, max: 5 },
    { term: 'healthy vegan lunch recipes', min: 1, max: 3 },
    { term: 'macro tracking list', min: 1, max: 3 }
  ]
};

export const COMPETITORS_FOR_KEYWORDS: Record<string, CompetitorPage[]> = {
  'best micro saas ideas 2026': [
    { rank: 1, url: 'https://backlinko.com/micro-saas-ideas', domain: 'backlinko.com', wordCount: 1520, headingsCount: 9, authority: 'Elite' },
    { rank: 2, url: 'https://hubspot.com/blog/saas-business', domain: 'hubspot.com', wordCount: 1250, headingsCount: 6, authority: 'Elite' },
    { rank: 3, url: 'https://indiehackers.com/ideas-profit', domain: 'indiehackers.com', wordCount: 1410, headingsCount: 11, authority: 'Great' }
  ],
  'how to build saas without coding': [
    { rank: 1, url: 'https://nocode.mba/build-saas-guide', domain: 'nocode.mba', wordCount: 1150, headingsCount: 5, authority: 'Great' },
    { rank: 2, url: 'https://bubble.io/blog/no-code-growth', domain: 'bubble.io', wordCount: 1480, headingsCount: 9, authority: 'Elite' },
    { rank: 3, url: 'https://medium.com/indie-boost/saas-fast', domain: 'medium.com', wordCount: 950, headingsCount: 4, authority: 'Standard' }
  ],
  'high protein plant based meal prep': [
    { rank: 1, url: 'https://sweetpeasandsaffron.com/high-protein-vegan', domain: 'sweetpeasandsaffron.com', wordCount: 1680, headingsCount: 12, authority: 'Great' },
    { rank: 2, url: 'https://runningonrealfood.com/vegan-meal-prep', domain: 'runningonrealfood.com', wordCount: 1420, headingsCount: 8, authority: 'Elite' },
    { rank: 3, url: 'https://minimalistbaker.com/lentil-preps', domain: 'minimalistbaker.com', wordCount: 1120, headingsCount: 5, authority: 'Elite' }
  ]
};

export const QUESTIONS_FOR_KEYWORDS: Record<string, SerpQuestion[]> = {
  'best micro saas ideas 2026': [
    { id: 'q-1', question: 'What is a good example of micro SaaS?', source: 'Google PAA' },
    { id: 'q-2', question: 'Is micro SaaS profitable in 2026?', source: 'Google PAA' },
    { id: 'q-3', question: 'How do solo builders secure SaaS ideas?', source: 'Google SERP' }
  ],
  'how to build saas without coding': [
    { id: 'q-4', question: 'What is the best no-code platform to build SaaS?', source: 'Google PAA' },
    { id: 'q-5', question: 'Can you launch a SaaS in a weekend?', source: 'Google PAA' },
    { id: 'q-6', question: 'Do no code SaaS applications scale?', source: 'Google SERP' }
  ],
  'high protein plant based meal prep': [
    { id: 'q-7', question: 'How can vegans prep 100g of protein daily?', source: 'Google PAA' },
    { id: 'q-8', question: 'What are the cheapest plant based proteins?', source: 'Google PAA' },
    { id: 'q-9', question: 'Does meal prep stay fresh for 5 days?', source: 'Google SERP' }
  ]
};

/**
 * Returns dynamic secondary keyword targets for any keyword term,
 * ensuring fallbacks always feel premium and tailored to the topic.
 */
export function getSecondaryKeywords(term: string): { term: string; min: number; max: number }[] {
  const normalized = term.toLowerCase().trim();
  if (SECONDARY_KEYWORDS_MAP[normalized]) {
    return SECONDARY_KEYWORDS_MAP[normalized];
  }

  // Generate dynamic keywords based on splitting the phrase and adding standard phrases
  const words = normalized.split(/\s+/).filter(w => w.length > 3);
  const primaryWord = words[0] || 'seo';
  const secondaryWord = words[1] || 'traffic';
  
  return [
    { term: `${primaryWord} optimization tools`, min: 2, max: 4 },
    { term: `${secondaryWord} marketing strategy`, min: 1, max: 3 },
    { term: `advanced ${normalized} guide`, min: 1, max: 2 },
    { term: `best practices for ${primaryWord}`, min: 1, max: 3 }
  ];
}

/**
 * Returns dynamic competitor statistics if terms are not matching.
 */
export function getCompetitorPages(term: string): CompetitorPage[] {
  const normalized = term.toLowerCase().trim();
  if (COMPETITORS_FOR_KEYWORDS[normalized]) {
    return COMPETITORS_FOR_KEYWORDS[normalized];
  }

  // Generate nice representative competitor figures
  const hashed = term.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return [
    { rank: 1, url: `https://wikipedia.org/wiki/${term.replace(/\s+/g, '_')}`, domain: 'wikipedia.org', wordCount: Math.round(1350 + (hashed % 400)), headingsCount: Math.round(7 + (hashed % 5)), authority: 'Elite' },
    { rank: 2, url: `https://forbes.com/business-advice/${primarySlug(term)}`, domain: 'forbes.com', wordCount: Math.round(1120 + (hashed % 300)), headingsCount: Math.round(5 + (hashed % 4)), authority: 'Elite' },
    { rank: 3, url: `https://medium.com/marketing/${primarySlug(term)}`, domain: 'medium.com', wordCount: Math.round(980 + (hashed % 200)), headingsCount: Math.round(4 + (hashed % 3)), authority: 'Great' }
  ];
}

/**
 * Returns dynamic questions list.
 */
export function getSerpQuestions(term: string): SerpQuestion[] {
  const normalized = term.toLowerCase().trim();
  if (QUESTIONS_FOR_KEYWORDS[normalized]) {
    return QUESTIONS_FOR_KEYWORDS[normalized];
  }

  return [
    { id: `q-dyn-1-${Date.now()}`, question: `What are the golden rules of ${term}?`, source: 'Google PAA' },
    { id: `q-dyn-2-${Date.now()}`, question: `Easiest way to scale ${wordsRange(term, 1)} results?`, source: 'Google PAA' },
    { id: `q-dyn-3-${Date.now()}`, question: `How much budget do I need for ${term}?`, source: 'Google SERP' }
  ];
}

function primarySlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function wordsRange(text: string, count: number): string {
  return text.split(/\s+/).slice(0, count).join(' ');
}
