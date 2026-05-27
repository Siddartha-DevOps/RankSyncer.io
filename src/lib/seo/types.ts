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
  opportunityScore?: number;
  timestamp: string;
  providerUsed: string;
  cached?: boolean;
}

export interface UsageQuota {
  creditsLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
}

export interface DiscoveredKeyword {
  id: string;
  projectId: string;
  keyword: string;
  term: string;
  intent: SearchIntent;
  volume: number;
  difficulty: number;
  cpc: number;
  cluster: string;
  opportunityScore: number;
  reasoning: string;
  suggestedTitle: string;
  createdAt: string;
  ownerId: string;
  generatedBy?: string;
  suggestedArticleType?: string;
  contentAngle?: string;
  serpCompetition?: 'Low' | 'Medium' | 'High';
  topicalRelevance?: number;
  keywordType?: string;
  sourceType?: string;
}

export interface TopicCluster {
  id: string;
  projectId: string;
  clusterName: string;
  primaryKeyword: string;
  supportingKeywords: string[];
  clusterDifficulty: number;
  contentOpportunityScore: number;
  createdAt: string;
  ownerId: string;
}

export interface DiscoveryJob {
  id: string;
  projectId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalKeywords: number;
  niche: string;
  country: string;
  language: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  sourceType?: string;
  sourceValue?: string;
  selectedKeywordTypes?: string[];
}

export interface KeywordCacheItem {
  id: string;
  projectId: string;
  domain: string;
  niche: string;
  rawResultJson: string; // Serialized generated response
  createdAt: string;
  ownerId: string;
}

