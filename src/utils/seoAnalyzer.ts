import { Article } from '../types';

export interface StructuralMetrics {
  wordCount: number;
  h2Count: number;
  h3Count: number;
  listCount: number;
  imageCount: number;
}

export interface AdvancedSeoScoreDetails {
  total: number;
  titleCheck: boolean;
  metaDescCheck: boolean;
  metaLengthCheck: boolean;
  wordCountCheck: boolean;
  primaryDensityCheck: 'Under' | 'Optimal' | 'Over';
  nlpCoverageCount: number;
  formattingCheck: boolean;
}

/**
 * Counts occurrences of a substring inside a text.
 */
export function countOccurrences(text: string, substring: string): number {
  if (!text || !substring) return 0;
  const normalizedText = text.toLowerCase();
  const normalizedSub = substring.toLowerCase();
  
  // Scaping regex characters in case of search term containing characters like ? * etc
  const escapedSub = normalizedSub.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = normalizedText.match(new RegExp(escapedSub, 'g'));
  return matches ? matches.length : 0;
}

/**
 * Parses markdown to count H2s, H3s, Lists, and Images.
 */
export function parseMarkdownStructure(content: string): StructuralMetrics {
  if (!content) {
    return { wordCount: 0, h2Count: 0, h3Count: 0, listCount: 0, imageCount: 0 };
  }

  const lines = content.split('\n');
  let h2Count = 0;
  let h3Count = 0;
  let listCount = 0;
  let imageCount = 0;

  // Simple markdown parsing rules
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) h2Count++;
    else if (trimmed.startsWith('### ')) h3Count++;
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) listCount++;
    
    // Check for standard image tags ![Alt](url) or <img>
    if (/!\[.*\]\(.*\)/.test(trimmed) || /<img\s/.test(trimmed)) imageCount++;
  });

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return { wordCount, h2Count, h3Count, listCount, imageCount };
}

/**
 * Computes deep on-page SEO metrics and returns comprehensive evaluation indicators.
 */
export function evaluateSeoMetrics(
  article: Article,
  secondaryKeywordsList: { term: string; min: number; max: number }[]
): AdvancedSeoScoreDetails {
  const content = article.content || '';
  const title = article.title || '';
  const metaDesc = article.metaDescription || '';
  const primaryTerm = article.targetKeyword.toLowerCase();

  let score = 10; // Baseline score

  // 1. Primary Keyword in Title
  const hasPrimaryInTitle = title.toLowerCase().includes(primaryTerm);
  if (hasPrimaryInTitle) score += 15;

  // 2. Primary Keyword in Meta Description
  const hasPrimaryInMeta = metaDesc.toLowerCase().includes(primaryTerm);
  if (hasPrimaryInMeta) score += 10;

  // 3. Meta length check (ideal between 110 and 160 characters)
  const metaLength = metaDesc.length;
  const metaLengthOk = metaLength >= 100 && metaLength <= 165;
  if (metaLengthOk) score += 10;

  // 4. Word count calculation
  const metrics = parseMarkdownStructure(content);
  const wordCountOk = metrics.wordCount >= 1000;
  if (wordCountOk) score += 20;
  else if (metrics.wordCount >= 500) score += 10;

  // 5. Primary density evaluations
  const primaryCount = countOccurrences(content, primaryTerm);
  let primaryDensityCheck: 'Under' | 'Optimal' | 'Over' = 'Under';
  if (primaryCount > 5) {
    score += 5; // Negative impact/cap due to stuffing
    primaryDensityCheck = 'Over';
  } else if (primaryCount >= 2 && primaryCount <= 5) {
    score += 15;
    primaryDensityCheck = 'Optimal';
  } else {
    score += 5;
    primaryDensityCheck = 'Under';
  }

  // 6. NLP Coverage Count (Secondary keywords)
  let nlpCoverageCount = 0;
  secondaryKeywordsList.forEach(({ term }) => {
    const occurrences = countOccurrences(content, term);
    if (occurrences > 0) {
      nlpCoverageCount++;
    }
  });
  
  // Up to 15 points based on secondary keyword coverage percentage
  const coveragePercent = nlpCoverageCount / (secondaryKeywordsList.length || 1);
  score += Math.round(coveragePercent * 15);

  // 7. Structural & formatting rules check (H2 headings & list presence)
  const hasGoodStructure = metrics.h2Count >= 3 && metrics.listCount >= 2;
  if (hasGoodStructure) score += 5;

  return {
    total: Math.min(100, score),
    titleCheck: hasPrimaryInTitle,
    metaDescCheck: hasPrimaryInMeta,
    metaLengthCheck: metaLengthOk,
    wordCountCheck: wordCountOk,
    primaryDensityCheck,
    nlpCoverageCount,
    formattingCheck: hasGoodStructure
  };
}
