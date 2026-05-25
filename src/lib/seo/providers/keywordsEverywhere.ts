import { SEOProvider } from './base';
import { KeywordResearchInput, KeywordResearchResult } from '../types';

export class KeywordsEverywhereProvider implements SEOProvider {
  name = 'Keywords Everywhere API';

  isAvailable(): boolean {
    return !!process.env.KEYWORDS_EVERYWHERE_API_KEY;
  }

  async search(input: KeywordResearchInput): Promise<Partial<KeywordResearchResult>> {
    const apiKey = process.env.KEYWORDS_EVERYWHERE_API_KEY;
    if (!apiKey) {
      throw new Error('Keywords Everywhere API Key not configured');
    }

    const { keyword, country } = input;
    console.log(`[KEYWORDS EVERYWHERE]: Making real API call for keyword: "${keyword}"`);

    try {
      const response = await fetch('https://api.keywordseverywhere.com/v1/get_keyword_data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'keywords[]': keyword,
          'country': country.toLowerCase(),
          'currency': 'USD',
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Keywords Everywhere API error state: ${response.status} - ${await response.text()}`);
      }

      const data = await response.json() as any;
      
      // Keywords Everywhere returns an array inside `data.data`
      if (data && data.data && data.data.length > 0) {
        const metrics = data.data[0];
        
        // Map to standard layout
        return {
          keyword: metrics.keyword || keyword,
          searchVolume: parseInt(metrics.vol) || 0,
          keywordDifficulty: parseInt(metrics.competition) * 100 || 30, // Keywords Everywhere returns competition as float 0-1
          cpc: parseFloat(metrics.cpc) || 0,
          competition: parseFloat(metrics.competition) || 0,
          providerUsed: this.name,
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('No metric results returned from Keywords Everywhere API');
    } catch (err: any) {
      console.warn(`[KEYWORDS EVERYWHERE FAILED]: ${err.message}`);
      throw err;
    }
  }
}

export const keywordsEverywhereProvider = new KeywordsEverywhereProvider();
