import { SEOProvider } from './base';
import { KeywordResearchInput, KeywordResearchResult } from '../types';

export class AhrefsProvider implements SEOProvider {
  name = 'Ahrefs Keyword Intelligence API';

  isAvailable(): boolean {
    return !!process.env.AHREFS_API_KEY;
  }

  async search(input: KeywordResearchInput): Promise<Partial<KeywordResearchResult>> {
    const apiKey = process.env.AHREFS_API_KEY;
    if (!apiKey) {
      throw new Error('Ahrefs API key is not configured');
    }

    const { keyword, country } = input;
    console.log(`[AHREFS API]: Retrieving insights for "${keyword}" (Country: ${country})`);

    try {
      // Ahrefs v3 Keyword Info API Endpoint
      const baseUrl = 'https://api.ahrefs.com/v3/key-database/lookup';
      const url = `${baseUrl}?select=keyword,volume,difficulty,cpc&keyword=${encodeURIComponent(keyword)}&country=${country.toLowerCase()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ahrefs API responded with status ${response.status}`);
      }

      const data = await response.json() as any;
      const metrics = data?.keyword_info?.[0] || data?.keywords?.[0];

      if (metrics) {
        return {
          keyword: metrics.keyword || keyword,
          searchVolume: parseInt(metrics.volume) || 0,
          keywordDifficulty: Math.round(metrics.difficulty) || 30,
          cpc: parseFloat(metrics.cpc) || 0,
          competition: parseFloat(metrics.competition) || (Math.round(metrics.difficulty) / 100),
          providerUsed: this.name,
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('No matched keyword info found in Ahrefs API response.');
    } catch (err: any) {
      console.warn(`[AHREFS API FAILED]: ${err.message}`);
      throw err;
    }
  }
}

export const ahrefsProvider = new AhrefsProvider();
