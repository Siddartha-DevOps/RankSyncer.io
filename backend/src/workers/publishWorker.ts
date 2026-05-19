import { Worker, Job as BullJob } from 'bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { decrypt } from '../utils/crypto';

export const publishWorker = new Worker(
  'cms-publishing',
  async (job: BullJob) => {
    const { articleId, integrationId } = job.data;

    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
      });

      const integration = await prisma.cMSIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!article || !integration) throw new Error('Missing article or integration');

      const apiKey = decrypt(integration.apiKey);

      if (integration.cmsType === 'WORDPRESS') {
        logger.info(`📤 Publishing to WordPress: ${integration.siteUrl}`);
        
        const response = await fetch(`${integration.siteUrl}/wp-json/wp/v2/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
          },
          body: JSON.stringify({
            title: article.title,
            content: article.htmlContent,
            status: 'publish',
            slug: article.slug,
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`WordPress error: ${err}`);
        }

        const data: any = await response.json();

        await prisma.article.update({
          where: { id: articleId },
          data: {
            status: 'PUBLISHED',
            cmsPostId: String(data.id),
            publishedUrl: data.link,
          },
        });
      }

      return { success: true };
    } catch (error: any) {
      logger.error(`❌ Publish Worker Failed: ${error.message}`);
      throw error;
    }
  },
  { connection: redisConnection }
);
