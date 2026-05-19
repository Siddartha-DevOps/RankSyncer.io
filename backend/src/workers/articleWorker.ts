import { Worker, Job as BullJob } from 'bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/prisma';
import { seoAgent } from '../ai/agents/seoAgent';
import { logger } from '../utils/logger';

export const articleWorker = new Worker(
  'article-generation',
  async (job: BullJob) => {
    const { projectId, keywordId, articleId } = job.data;

    try {
      // 1. Fetch metadata
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { project: true, keyword: true },
      });

      if (!article) throw new Error('Article not found');

      await prisma.article.update({
        where: { id: article.id },
        data: { status: 'GENERATING' },
      });

      // Update Job table
      await prisma.job.updateMany({
        where: { projectId, payload: { path: ['articleId'], equals: articleId } },
        data: { status: 'PROCESSING' },
      });

      // 2. Generate Outline
      const keyword = article.keyword?.term || article.title;
      const outline = await seoAgent.generateOutline(
        keyword,
        article.project.niche || 'General',
        article.project.toneOfVoice
      );

      // 3. Generate Sections
      let fullHtml = '';
      const contentBlocks: any[] = [];

      for (const heading of outline.headings) {
        const sectionContent = await seoAgent.generateSection(
          heading.text,
          `Part of an article titled "${outline.title}"`,
          heading.keywords
        );
        
        const hTag = `<h${heading.level}>${heading.text}</h${heading.level}>`;
        fullHtml += `${hTag}\n${sectionContent}\n\n`;
        
        contentBlocks.push({
          type: 'heading',
          level: heading.level,
          text: heading.text,
        });
        contentBlocks.push({
          type: 'content',
          html: sectionContent,
        });
      }

      // 4. Save Final Article
      await prisma.article.update({
        where: { id: article.id },
        data: {
          htmlContent: fullHtml,
          content: contentBlocks,
          status: 'READY',
          metaTitle: outline.title,
          metaDescription: outline.metaDescription,
        },
      });

      // 5. Update user limits
      await prisma.user.update({
        where: { id: article.project.userId },
        data: { articlesUsed: { increment: 1 } },
      });

      logger.info(`✅ Article generated: ${article.id}`);
      return { success: true, articleId: article.id };
    } catch (error: any) {
      logger.error(`❌ Article Worker Failed: ${error.message}`);
      
      await prisma.article.update({
        where: { id: articleId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  },
  { connection: redisConnection }
);
