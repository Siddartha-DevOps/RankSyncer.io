import OpenAI from 'openai';
import { config } from '../../config/env';
import { logger } from '../../utils/logger';

export interface ArticleOutline {
  title: string;
  headings: { level: number; text: string; keywords: string[] }[];
  metaDescription: string;
}

export class SEOAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  /**
   * Researches the keyword to find what's currently ranking.
   */
  async researchKeyword(keyword: string): Promise<string[]> {
    logger.info(`🔍 Researching SERP for: ${keyword}`);
    
    // In a real implementation, this calls DataForSEO, SerpAPI, or a scraper.
    // For now, we simulate the research output of top competitors.
    const prompt = `
      Researching the keyword: "${keyword}".
      Based on your knowledge of current SEO trends, tell me the top 3-5 sub-topics or "intent markers" that search engines currently reward for this keyword.
      Be specific. Return a comma-separated list of topics.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [{ role: 'system', content: 'You are a SERP analyst.' }, { role: 'user', content: prompt }],
      });
      return response.choices[0].message.content?.split(',').map(s => s.trim()) || [];
    } catch (error) {
      logger.error('SEOAgent Research Error:', error);
      return [];
    }
  }

  /**
   * Generates a high-quality SEO article outline based on a target keyword and niche.
   */
  async generateOutline(keyword: string, niche: string, tone: string): Promise<ArticleOutline> {
    const research = await this.researchKeyword(keyword);
    
    const prompt = `
      You are an expert SEO Strategist. Create a detailed article outline for the target keyword: "${keyword}".
      Niche: ${niche}
      Tone: ${tone}
      SERP Research Findings: ${research.join(', ')}
      
      Requirements:
      1. Include H1, H2, and H3 headings.
      2. Each heading should specify which secondary keywords to include.
      3. Create a compelling meta description.
      4. Ensure the outline covers the search intent based on research findings.
      
      Return as JSON in this format:
      {
        "title": "...",
        "headings": [{ "level": 1, "text": "...", "keywords": ["..."] }],
        "metaDescription": "..."
      }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [{ role: 'system', content: 'You are a technical SEO expert.' }, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      logger.error('SEOAgent Outline Error:', error);
      throw error;
    }
  }

  /**
   * Generates the actual content for a heading block.
   */
  async generateSection(
    heading: string,
    context: string,
    keywords: string[],
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<string> {
    const prompt = `
      Write a section for an SEO article.
      Heading: ${heading}
      Context/Scope: ${context}
      Keywords to naturally include: ${keywords.join(', ')}
      Desired length: ${length}
      
      Formatting: Use HTML tags (p, ul, li, strong) but NO H-tags.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      logger.error('SEOAgent Section Error:', error);
      throw error;
    }
  }
}

export const seoAgent = new SEOAgent();
