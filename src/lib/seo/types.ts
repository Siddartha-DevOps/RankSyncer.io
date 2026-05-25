export interface KeywordResearchInput {
  keyword: string;
  country: string; // e.g., 'US', 'IN', 'GB'
  language: string; // e.g., 'en', 'es', 'fr'
  device: 'desktop' | 'mobile';
}

export type SearchIntent = 'Informational' | 'Transactional' | 'Commercial' | 'Navigational';

export interface KeywordMetric {
  keyword: string;
  searchVolume: number;
  keywordDifficulty: number; // 0-100
  cpc: number; // USD
  competition: number; // 0-1
  intent: SearchIntent;
}

export interface KeywordTrendPoint {
  date: string; // "YYYY-MM" or readable e.g., "Jan", "Feb"
  volume: number;
}

export interface RelatedKeywordItem extends KeywordMetric {
  trend?: KeywordTrendPoint[];
}

export interface SerpRankedPage {
  rank: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  wordCount?: number;
  headingsCount?: number;
  headings?: { [key: string]: string[] }; // h1, h2 lists
  authority?: 'Elite' | 'Great' | 'Standard' | 'Emerging';
  authorityScore?: number; // 0-100
}

export interface AiInsights {
  easiestKeywords: string[];    // Related terms that are easiest to rank for
  highIntentKeywords: string[];  // Best search intent opportunities (Commercial / Transactional)
  contentGapSuggestions: string[]; // Topics or subtopics that competitors missed
  insightsText: string;          // Natural language tactical brief
}

export interface KeywordResearchResult {
  keyword: string;
  country: string;
  language: string;
  device: 'desktop' | 'mobile';
  searchVolume: number;
  keywordDifficulty: number;
  cpc: number;
  competition: number;
  intent: SearchIntent;
  trends: KeywordTrendPoint[];
  relatedKeywords: RelatedKeywordItem[];
  questions: RelatedKeywordItem[];
  serpResults: SerpRankedPage[];
  aiInsights?: AiInsights;
  timestamp: string;
  providerUsed: string;
  cached?: boolean;
}

export interface UsageQuota {
  creditsLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
}
