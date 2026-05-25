import { SEOProvider } from './base';
import { KeywordResearchInput, KeywordResearchResult } from '../types';

export class GrepwordsProvider implements SEOProvider {
  name = 'Grepwords SEO Engine';

  isAvailable(): boolean {
    return !!process.env.GREPWORDS_API_KEY;
  }

  async search(input: KeywordResearchInput): Promise<Partial<KeywordResearchResult>> {
    const apiKey = process.env.GREPWORDS_API_KEY;
    if (!apiKey) {
      throw new Error('Grepwords API Key not configured');
    }

    const { keyword, country } = input;
    console.log(`[GREPWORDS]: Querying Grepwords API for keyword: "${keyword}"`);

    try {
      const url = `https://api.grepwords.com/v1/lookup?apikey=${apiKey}&q=${encodeURIComponent(keyword)}&c=${country.toLowerCase()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Grepwords API error status: ${response.status}`);
      }

      const data = await response.json() as any;
      const metrics = data?.keyword;

      if (metrics) {
        return {
          keyword: metrics.q || keyword,
          searchVolume: parseInt(metrics.volume) || 0,
          keywordDifficulty: parseInt(metrics.difficulty) || 35,
          cpc: parseFloat(metrics.cpc) || 0,
          competition: parseFloat(metrics.competition) || 0.2,
          providerUsed: this.name,
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('No metric payload found in Grepwords response');
    } catch (err: any) {
      console.warn(`[GREPWORDS FAILED]: ${err.message}`);
      throw err;
    }
  }
}

export const grepwordsProvider = new GrepwordsProvider();
