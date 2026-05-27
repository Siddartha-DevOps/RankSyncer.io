import { SEOProvider } from './base';
import { KeywordResearchInput, KeywordResearchResult } from '../types';

export class SemrushProvider implements SEOProvider {
  name = 'SEMrush Keyword Analytics API';

  isAvailable(): boolean {
    return !!process.env.SEMRUSH_API_KEY;
  }

  async search(input: KeywordResearchInput): Promise<Partial<KeywordResearchResult>> {
    const apiKey = process.env.SEMRUSH_API_KEY;
    if (!apiKey) {
      throw new Error('SEMrush API key is not configured');
    }

    const { keyword, country } = input;
    console.log(`[SEMRUSH API]: Querying metrics for "${keyword}" (Country DB: ${country})`);

    try {
      // SEMrush Keyword Overview database endpoint (phrase_this)
      const db = country.toLowerCase() === 'us' ? 'us' : country.toLowerCase();
      const url = `https://api.semrush.com/?type=phrase_this&key=${apiKey}&phrase=${encodeURIComponent(keyword)}&database=${db}&export_columns=Ph,Nq,Kd,Cp,Co`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`SEMrush API responded with status ${response.status}`);
      }

      const text = await response.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      if (lines.length < 2) {
        throw new Error('SEMrush returned an empty metrics table');
      }

      // SEMrush returns columns matching the requested export_columns order
      // Line 1: Header (Keyword;Search Volume;Keyword Difficulty;CPC;Competition)
      // Line 2: Values (organic traffic;12000;48;1.20;0.8)
      const headers = lines[0].split(';');
      const values = lines[1].split(';');

      const result: any = {};
      headers.forEach((h, index) => {
        result[h.toLowerCase()] = values[index];
      });

      // Map columns: ph = keyword, nq = search volume, kd = difficulty, cp = CPC, co = competition
      const searchVolume = parseInt(result['nq'] || result['search volume']) || 0;
      const keywordDifficulty = parseInt(result['kd'] || result['keyword difficulty']) || 35;
      const cpc = parseFloat(result['cp'] || result['cpc']) || 0;
      const competition = parseFloat(result['co'] || result['competition']) || 0.1;

      return {
        keyword: result['ph'] || keyword,
        searchVolume,
        keywordDifficulty,
        cpc,
        competition,
        providerUsed: this.name,
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.warn(`[SEMRUSH API FAILED]: ${err.message}`);
      throw err;
    }
  }
}

export const semrushProvider = new SemrushProvider();
