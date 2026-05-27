import { SEOProvider } from './base';
import { KeywordResearchInput, KeywordResearchResult } from '../types';

export class GoogleAdsProvider implements SEOProvider {
  name = 'Google Ads Keyword Planner API';

  isAvailable(): boolean {
    return !!(
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CUSTOMER_ID &&
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN
    );
  }

  async search(input: KeywordResearchInput): Promise<Partial<KeywordResearchResult>> {
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, ''); // must remove dashes
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;

    if (!devToken || !customerId || !clientId || !clientSecret || !refreshToken) {
      throw new Error('Google Ads API authentication parameters not fully configured');
    }

    const { keyword, country, language } = input;
    console.log(`[GOOGLE ADS]: Querying Google Keyword Planner REST API for: "${keyword}"`);

    try {
      // 1. Get OAuth access token using Google refresh token endpoint
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken
        }).toString()
      });

      if (!tokenRes.ok) {
        throw new Error(`Google OAuth token retrieval failed: ${await tokenRes.text()}`);
      }

      const tokenJson = await tokenRes.json() as any;
      const accessToken = tokenJson.access_token;

      // 2. Query generateKeywordIdeas REST API endpoint
      const googleAdsVersion = 'v16'; // standard stable Google Ads API version
      const url = `https://googleads.googleapis.com/${googleAdsVersion}/customers/${customerId}:generateKeywordIdeas`;

      // US location resource name: 'geoTargetConstants/2840'
      const geoConstant = country === 'US' ? 'geoTargetConstants/2840' : country === 'IN' ? 'geoTargetConstants/21156' : 'geoTargetConstants/2840';
      const langConstant = language === 'en' ? 'languageConstants/1000' : 'languageConstants/1000';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': devToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          geoTargetConstants: [geoConstant],
          language: langConstant,
          keywordSeed: {
            keywords: [keyword]
          },
          includeAdult: false
        })
      });

      if (!response.ok) {
        throw new Error(`Google Ads API returned error: ${response.status} - ${await response.text()}`);
      }

      const data = await response.json() as any;
      const matchedIdea = data?.results?.[0]; // first result matches seed keyword

      if (matchedIdea && matchedIdea.keywordIdeaMetrics) {
        const metrics = matchedIdea.keywordIdeaMetrics;
        const searchVolume = parseInt(metrics.avgMonthlySearches) || 0;
        
        // Google Ads returns low/medium/high competition indexes (or float competition index 0-100)
        const compIndex = parseFloat(metrics.competitionIndex) || 0;
        const keywordDifficulty = Math.round(compIndex) || 40; 
        
        // CPC ranges (returns micro amounts: 1,000,000 micros = 1 USD)
        const lowCpcMicros = parseFloat(metrics.lowTopOfPageBidMicros) || 0;
        const highCpcMicros = parseFloat(metrics.highTopOfPageBidMicros) || 0;
        const avgCpc = (lowCpcMicros + highCpcMicros) / 2 / 1000000;

        return {
          keyword: matchedIdea.text || keyword,
          searchVolume,
          keywordDifficulty,
          cpc: parseFloat(avgCpc.toFixed(2)),
          competition: parseFloat((keywordDifficulty / 100).toFixed(2)),
          providerUsed: this.name,
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('No matched keyword ideas returned from Google Keyword Planner');
    } catch (err: any) {
      console.warn(`[GOOGLE ADS API FAILED]: ${err.message}`);
      throw err;
    }
  }
}

export const googleAdsProvider = new GoogleAdsProvider();
