import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { encrypt } from '../utils/crypto';
import { publishQueue } from '../workers/queues';

const router = Router();

const cmsSchema = z.object({
  projectId: z.string().uuid(),
  cmsType: z.enum(['WORDPRESS', 'GHOST', 'SHOPIFY', 'CUSTOM_WEBHOOK']),
  siteUrl: z.string().url(),
  apiKey: z.string().min(5),
  apiSecret: z.string().optional(),
});

// POST /api/cms/integrate
router.post('/integrate', async (req: AuthRequest, res, next) => {
  try {
    const data = cmsSchema.parse(req.body);

    const project = await prisma.project.findFirst({
      where: { id: data.projectId, userId: req.user!.id },
    });
    if (!project) throw new AppError('Project not found', 404);

    const encryptedKey = encrypt(data.apiKey);
    const encryptedSecret = data.apiSecret ? encrypt(data.apiSecret) : null;

    const integration = await prisma.cMSIntegration.create({
      data: {
        projectId: data.projectId,
        cmsType: data.cmsType as any,
        siteUrl: data.siteUrl,
        apiKey: encryptedKey,
        apiSecret: encryptedSecret,
        isActive: true,
      },
    });

    res.status(201).json({ integration: { id: integration.id, siteUrl: integration.siteUrl, cmsType: integration.cmsType } });
  } catch (error) {
    next(error);
  }
});

// GET /api/cms/integrations
router.get('/integrations', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) throw new AppError('Project ID is required', 400);

    const integrations = await prisma.cMSIntegration.findMany({
      where: { projectId: projectId as string, isActive: true },
      select: { id: true, siteUrl: true, cmsType: true, isVerified: true },
    });

    res.json({ integrations });
  } catch (error) {
    next(error);
  }
});

// POST /api/cms/publish
router.post('/publish', async (req: AuthRequest, res, next) => {
  try {
    const { articleId, integrationId } = req.body;

    const article = await prisma.article.findFirst({
      where: { id: articleId, project: { userId: req.user!.id } },
    });
    if (!article) throw new AppError('Article not found', 404);

    const job = await publishQueue.add('publish-article', {
      articleId,
      integrationId,
    });

    res.json({ message: 'Publishing started', jobId: job.id });
  } catch (error) {
    next(error);
  }
});

export default router;
