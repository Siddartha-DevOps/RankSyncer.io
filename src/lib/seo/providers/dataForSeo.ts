import { SEOProvider } from './base';
import { KeywordResearchInput, KeywordResearchResult } from '../types';

export class DataForSeoProvider implements SEOProvider {
  name = 'DataForSEO Labs API';

  isAvailable(): boolean {
    return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
  }

  async search(input: KeywordResearchInput): Promise<Partial<KeywordResearchResult>> {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    if (!login || !password) {
      throw new Error('DataForSEO Credentials not fully configured');
    }

    const { keyword, country, language } = input;
    console.log(`[DATAFORSEO]: Querying DataForSEO API for keyword: "${keyword}"`);

    try {
      const auth = Buffer.from(`${login}:${password}`).toString('base64');
      
      // Hit DataForSEO Google Keyword Info endpoint
      const response = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/bulk_search_volume/live', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            keywords: [keyword],
            location_code: country === 'US' ? 2840 : 21156, // Simple fallback mapper for location codes (e.g., 2840 is US, 21156 is India, etc.)
            language_code: language === 'en' ? 'en' : language,
          }
        ]),
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error state: ${response.status} - ${await response.text()}`);
      }

      const data = await response.json() as any;
      const resultObj = data?.tasks?.[0]?.result?.[0]?.items?.[0];

      if (resultObj) {
        return {
          keyword: resultObj.keyword || keyword,
          searchVolume: resultObj.search_volume || 0,
          keywordDifficulty: resultObj.keyword_difficulty || 25,
          cpc: resultObj.cpc || 0,
          competition: resultObj.competition || 0.1,
          providerUsed: this.name,
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('No items returned in DataForSEO task result');
    } catch (err: any) {
      console.warn(`[DATAFORSEO FAILED]: ${err.message}`);
      throw err;
    }
  }
}

export const dataForSeoProvider = new DataForSeoProvider();
