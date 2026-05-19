import { Worker, Job as BullJob } from 'bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import * as cheerio from 'cheerio';

export const keywordWorker = new Worker(
  'keyword-analysis',
  async (job: BullJob) => {
    const { projectId, domain } = job.data;

    try {
      if (job.name === 'crawl-website') {
        logger.info(`🔍 Deep crawling website: ${domain}`);
        
        let response;
        try {
           response = await fetch(domain);
        } catch (e) {
           logger.error(`Failed to fetch ${domain}`);
           await prisma.project.update({ where: { id: projectId }, data: { crawlStatus: 'FAILED' } });
           return { success: false, error: 'Unreachable domain' };
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);

        // Advanced extraction logic
        const title = $('title').text() || '';
        const metaDesc = $('meta[name="description"]').attr('content') || '';
        const h1s = $('h1').map((_, el) => $(el).text()).get();
        
        // Simulating keyword extraction from content
        const seedKeywords = Array.from(new Set([
          ...title.split(/\||-/).map(s => s.trim()),
          ...metaDesc.split(/[,.]/).map(s => s.trim()),
          ...h1s
        ].filter(v => v && v.length > 3 && v.length < 50)));

        logger.info(`✨ Extracted ${seedKeywords.length} seed keywords for analysis.`);

        for (const term of seedKeywords.slice(0, 20)) {
          // AI simulation of keyword metrics (Real SaaS would call DataForSEO)
          // We use deterministic random based on string length to simulate real data
          const seed = term.length;
          const volume = Math.floor((seed * 150) % 5000) + 50;
          const difficulty = Math.floor((seed * 7) % 100);
          
          await prisma.keyword.upsert({
            where: { projectId_term: { projectId, term } },
            update: {
               volume,
               difficulty,
               intent: seed % 2 === 0 ? 'informational' : 'transactional'
            },
            create: {
              projectId,
              term,
              volume,
              difficulty,
              intent: seed % 2 === 0 ? 'informational' : 'transactional'
            }
          });
        }

        await prisma.project.update({
          where: { id: projectId },
          data: { 
            crawlStatus: 'COMPLETED', 
            lastCrawledAt: new Date(),
            niche: seedKeywords[0] || 'General' 
          }
        });
      }

      if (job.name === 'create-content-plan') {
         const keywords = await prisma.keyword.findMany({ where: { projectId } });
         if (keywords.length > 0) {
            await prisma.contentPlan.create({
              data: {
                projectId,
                name: 'Initial SEO Growth Plan',
                description: `Automatically generated based on ${keywords.length} identified keywords.`
              }
            });
         }
      }

      return { success: true };
    } catch (error: any) {
      logger.error(`❌ Keyword Worker Failed: ${error.message}`);
      throw error;
    }
  },
  { connection: redisConnection }
);
