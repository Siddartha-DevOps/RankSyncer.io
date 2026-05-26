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

// ==========================================
// ENTERPRISE MULTILINGUAL SYSTEM TYPES
// ==========================================

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  isPremium?: boolean;
}

export interface ArticleTranslation {
  id: string;
  article_id: string;
  language_code: string;
  translated_title: string;
  translated_slug: string;
  translated_content: string;
  localized_meta_title: string;
  localized_meta_description: string;
  generation_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  errorMessage?: string;
}

export interface MultilingualKeyword {
  id: string;
  article_id: string;
  language_code: string;
  original_term: string;
  localized_term: string;
  search_volume?: number;
  difficulty?: number;
}

export interface MultilingualGenerationLog {
  id: string;
  article_id: string;
  language_code: string;
  action: 'detect' | 'generate' | 'translate' | 'publish' | 'retry';
  status: 'success' | 'warn' | 'error' | 'queued';
  message: string;
  timestamp: string;
  token_usage?: number;
  credit_cost?: number;
}

export interface MultilingualQueueItem {
  id: string;
  article_id: string;
  language_code: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retries: number;
  created_at: string;
  updated_at: string;
  errorMessage?: string;
}

export interface MultilingualConfigState {
  default_language: string;
  premium_only_advanced_localization: boolean;
  automatic_translation_on_publish: boolean;
  credits_limit: number;
  credits_used: number;
}

// ==========================================
// ENTERPRISE AI BRAND VOICE ENGINE TYPES
// ==========================================

export interface BrandVoiceProfile {
  id: string;
  user_id: string;
  projectId: string; // can represent project_id or workspace_id
  voice_name: string;
  tone: string;
  embedding_vector?: number[]; // Real geometric vectors
  confidence_score: number; // Quality / completeness score (0-100)
  training_status: 'pending' | 'processing' | 'completed' | 'failed';
  source_type: 'files' | 'crawl' | 'paste' | 'mixed';
  created_at: string;
  styleLockMode: boolean; // Style lock premium mode
  
  // Custom interactive style variables
  style_metadata: {
    sentenceLengthPreference: 'short' | 'average' | 'long' | 'varied';
    vocabularyComplexity: 'simple' | 'collegiate' | 'highly_technical';
    toneProfile: string;
    humorLevel: number; // 0-100
    formalityLevel: number; // 0-100
    emotionalStyle: string;
    ctaBehavior: string;
    paragraphStructure: string;
    punctuationHabits: string[];
    storytellingStyle: string;
    headlinePatterns: string[];
    persuasiveTechniques: string[];
    transitionPatterns: string[];
    conversationalStyle: string;
  };
}

export interface WritingPatternAnalytics {
  vocabularyFingerprint: { term: string; score: number }[];
  sentenceLengthDistribution: { category: string; count: number }[];
  headlineScore: number;
  structureConsistencyIndex: number;
}

export interface VoiceGenerationLog {
  id: string;
  user_id: string;
  projectId: string;
  voice_profile_id: string;
  voice_name: string;
  article_title: string;
  article_id?: string;
  similarity_rating: number; // 0-100
  authenticity_score: number; // 0-100
  ai_detection_reduction_score: number; // 0-100
  voice_consistency_score: number; // 0-100
  timestamp: string;
}

export interface ProjectVoiceAssignment {
  projectId: string;
  activeVoiceId: string | null;
  styleLockActive: boolean;
}


