import { KeywordResearchInput, KeywordResearchResult, AiInsights } from './types';
import { liveScraperProvider } from './providers/liveScraper';
import { keywordsEverywhereProvider } from './providers/keywordsEverywhere';
import { dataForSeoProvider } from './providers/dataForSeo';
import { grepwordsProvider } from './providers/grepwords';
import { serpApiProvider } from './providers/serpApi';
import { valueSerpProvider } from './providers/valueSerp';
import { kwCacheManager } from './cache';
import { GoogleGenAI, Type } from '@google/genai';

export class KeywordResearchManager {
  private providers = [
    keywordsEverywhereProvider,
    dataForSeoProvider,
    grepwordsProvider,
    valueSerpProvider
  ];

  private getGeminiClient(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  /**
   * Main orchestrator for keyword research
   */
  async performResearch(input: KeywordResearchInput): Promise<KeywordResearchResult> {
    const { keyword, country, language, device } = input;
    
    // 1. Check Cache first
    const cached = kwCacheManager.get(keyword, country, language, device);
    if (cached) {
      return {
        ...cached,
        cached: true
      };
    }

    console.log(`[SEO MANAGER]: Orchestrated query requested for "${keyword}"`);

    // 2. Initialize aggregate result with core defaults from Live Scraper
    // The Live Scraper serves as the base structure containing rich autocomplete suggestions and queries
    const baseResult = await liveScraperProvider.search(input);
    let finalResult: KeywordResearchResult = {
      keyword,
      country,
      language,
      device,
      searchVolume: baseResult.searchVolume || 0,
      keywordDifficulty: baseResult.keywordDifficulty || 40,
      cpc: baseResult.cpc || 0,
      competition: baseResult.competition || 0.1,
      intent: baseResult.intent || 'Informational',
      trends: baseResult.trends || [],
      relatedKeywords: baseResult.relatedKeywords || [],
      questions: baseResult.questions || [],
      serpResults: baseResult.serpResults || [],
      timestamp: new Date().toISOString(),
      providerUsed: liveScraperProvider.name
    };

    // 3. Try to override search metrics (volume, difficulty, CPC) using premium providers in a chain of fallbacks
    let premiumDataFetched = false;
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          console.log(`[SEO MANAGER]: Trying premium provider: ${provider.name}`);
          
          // Implement Retry/Delay structure (max 2 attempts)
          let attempts = 0;
          let metrics: any = null;
          
          while (attempts < 2 && !metrics) {
            try {
              metrics = await provider.search(input);
            } catch (err: any) {
              attempts++;
              if (attempts === 2) throw err;
              console.warn(`[SEO MANAGER]: Retrying provider ${provider.name} in 800ms due to error: ${err.message}`);
              await new Promise(resolve => setTimeout(resolve, 800));
            }
          }

          if (metrics) {
            finalResult.searchVolume = metrics.searchVolume ?? finalResult.searchVolume;
            finalResult.keywordDifficulty = metrics.keywordDifficulty ?? finalResult.keywordDifficulty;
            finalResult.cpc = metrics.cpc ?? finalResult.cpc;
            finalResult.competition = metrics.competition ?? finalResult.competition;
            if (metrics.intent) finalResult.intent = metrics.intent;
            finalResult.providerUsed = `${provider.name} (Integrated Metrics)`;
            premiumDataFetched = true;
            console.log(`[SEO MANAGER]: Successfully loaded organic intelligence from verified provider "${provider.name}"`);
            break; // Stop fallbacks as we have premium metrics!
          }
        } catch (e: any) {
          console.warn(`[SEO MANAGER]: Failover triggered. Premium provider ${provider.name} failed:`, e.message);
          // Graceful degradation: let loop continue to next available provider
        }
      }
    }

    // 4. Try loading real organic SERPs from SerpAPI if configured
    if (serpApiProvider.isAvailable()) {
      try {
        console.log(`[SEO MANAGER]: Querying SerpAPI for real Google organic layout...`);
        const serpResults = await serpApiProvider.search(input);
        if (serpResults.serpResults && serpResults.serpResults.length > 0) {
          finalResult.serpResults = serpResults.serpResults;
          
          // If related keywords are also returned by organic scraping, merge them gracefully
          if (serpResults.relatedKeywords && serpResults.relatedKeywords.length > 0) {
            const existingRelated = new Set(finalResult.relatedKeywords.map(k => k.keyword.toLowerCase()));
            const merged = [...finalResult.relatedKeywords];
            
            serpResults.relatedKeywords.forEach(kw => {
              if (!existingRelated.has(kw.keyword.toLowerCase())) {
                merged.push(kw);
              }
            });
            finalResult.relatedKeywords = merged.slice(0, 15);
          }
          console.log(`[SEO MANAGER]: Integrated actual Google SERP ranks.`);
        }
      } catch (err: any) {
        console.warn(`[SEO MANAGER]: SerpAPI crawl skipped or failed. Falling back to synthesized SERPs: ${err.message}`);
      }
    }

    // 5. Generate AI intelligence (easiest rank, high intent, content gaps) in parallel using Server-Side Gemini
    const aiClient = this.getGeminiClient();
    if (aiClient) {
      try {
        console.log(`[SEO MANAGER]: Contacting Gemini API for smart keyword clustering insights...`);
        
        const prompt = `You are a world-class enterprise SEO director analyzing search metrics with a background in Ahrefs and Semrush.
        Perform clustering, intent analysis, and gap mapping on the researched keyword.
        
        Core Keyword: "${keyword}"
        Country: ${country} | Language: ${language}
        Domain Metrics: Volume: ${finalResult.searchVolume}, Difficulty: ${finalResult.keywordDifficulty}%, Intent: ${finalResult.intent}, CPC: $${finalResult.cpc}
        
        Related queries:
        ${finalResult.relatedKeywords.slice(0, 10).map(k => `- "${k.keyword}" (Vol: ${k.searchVolume}, Difficulty: ${k.keywordDifficulty}%)`).join('\n')}
        
        Questions:
        ${finalResult.questions.slice(0, 8).map(q => `- "${q.keyword}"`).join('\n')}
        
        Competitor URLs ranking in SERPs:
        ${finalResult.serpResults.slice(0, 5).map(s => `- Rank #${s.rank}: ${s.domain} (${s.title})`).join('\n')}
        
        Based on these real-time data logs, analyze:
        1. Easiest keywords: Which related or question phrases are easiest to rank for (< 40 difficulty) but still have search value?
        2. High Intent phrases: Commercial/Transactional keywords with higher CPC that should be targeting and monetized.
        3. Content Gap Suggestions: Sub-topics, technical guidelines, or visual content nodes competitors missed that your user should write immediately.
        4. Tactical insightsText: Provide 3 sentences of concise, bulletproof advice on how to outrank the current TOP 3 sites. Mention specific competitors by name where relevant.
        
        Respond with a JSON object following this EXACT schema, containing NO markdown wrapping:
        {
          "easiestKeywords": ["keyword variant 1", "keyword variant 2"],
          "highIntentKeywords": ["intent keyword 1", "intent keyword 2"],
          "contentGapSuggestions": ["content gap idea 1", "content gap idea 2"],
          "insightsText": "Tactical advice briefing..."
        }`;

        const gRes = await aiClient.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                easiestKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                highIntentKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                contentGapSuggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                insightsText: {
                  type: Type.STRING
                }
              },
              required: ['easiestKeywords', 'highIntentKeywords', 'contentGapSuggestions', 'insightsText']
            }
          }
        });

        const jsonStr = gRes.text?.trim() || '';
        const parsed = JSON.parse(jsonStr) as AiInsights;
        finalResult.aiInsights = parsed;
        console.log(`[SEO MANAGER]: Successfully generated Gemini SEO Insights.`);
      } catch (gErr: any) {
        console.warn(`[SEO MANAGER]: Gemini insight generation failed, using standard heuristic templates: ${gErr.message}`);
        // Fallback standard program heuristics
        finalResult.aiInsights = {
          easiestKeywords: finalResult.relatedKeywords
            .filter(k => k.keywordDifficulty < 45)
            .slice(0, 3)
            .map(k => k.keyword),
          highIntentKeywords: finalResult.relatedKeywords
            .filter(k => k.intent === 'Transactional' || k.intent === 'Commercial')
            .slice(0, 3)
            .map(k => k.keyword),
          contentGapSuggestions: [
            `Comprehensive technical comparison guide about ${keyword}`,
            `Interactive CPC calculator mapping commercial values`,
            `User-centric troubleshooting lists solving the main questions`
          ],
          insightsText: `Focus on expanding semantic variations of ${keyword}. High search engine results suggest top competitors rely heavily on long-tail configurations, making a dedicated tutorial series highly profitable.`
        };
      }
    }

    // 6. Save in Cache
    kwCacheManager.set(finalResult);

    return finalResult;
  }
}

export const kwResearchManager = new KeywordResearchManager();
