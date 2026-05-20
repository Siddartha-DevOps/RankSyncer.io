export interface Project {
  id: string;
  name: string;
  domain: string;
  visibilityIndex: number; // 0-100
  avgPosition: number;
  organicTraffic: number;
  cmsPlatform: 'wordpress' | 'webflow' | 'ghost' | 'custom';
  crawlStatus: 'STALE' | 'CRAWLING' | 'COMPLETED' | 'FAILED';
  lastCrawledAt: string | null;
  crawlHistory: number[]; // Trend Data
  gscConnected?: boolean;
  gscClicks30d?: number;
  gscImpressions30d?: number;
  gscCtr30d?: number;
}

export interface Keyword {
  id: string;
  projectId: string;
  term: string;
  volume: number;
  difficulty: number; // 0-100
  intent: 'Informational' | 'Transactional' | 'Commercial' | 'Navigational';
  currentRank: number;
  previousRank: number;
  lastCheckedRank?: string;
  rankTrendUrl?: string;
  history?: { date: string; rank: number }[];
}

export interface Article {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  targetKeyword: string;
  wordCount: number;
  seoScore: number;
  status: 'Draft' | 'Reviewing' | 'Ready' | 'Published';
  content: string;
  lastEdited: string;
  metaDescription: string;
}

export interface CrawlerLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
  module: 'SERP_CRAWLER' | 'BACKLINK_CHECK' | 'AI_WRITER' | 'CMS_SYNC' | 'AUTOPILOT_DAEMON' | 'GSC_SYNC';
}

export interface AutopilotQueueItem {
  id: string;
  projectId: string;
  keywordTerm: string;
  triggerReason: string; // e.g. "Rank dropped from 4 to 12"
  timestamp: string;
  status: 'pending' | 'drafting' | 'completed' | 'failed';
  draftArticleId?: string;
}

export interface SecondaryKeywordTarget {
  term: string;
  min: number;
  max: number;
  current: number; // dynamically computed
}

export interface CompetitorPage {
  rank: number;
  url: string;
  domain: string;
  wordCount: number;
  headingsCount: number;
  authority: 'Elite' | 'Great' | 'Standard' | 'Emerging';
}

export interface SerpQuestion {
  id: string;
  question: string;
  source: string;
}
