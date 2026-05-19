import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { articleQueue } from '../workers/queues';
import { config } from '../config/env';

const router = Router();

// GET /api/articles
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) throw new AppError('Project ID is required', 400);

    const articles = await prisma.article.findMany({
      where: { projectId: projectId as string },
      include: { keyword: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ articles });
  } catch (error) {
    next(error);
  }
});

// GET /api/articles/:id
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const article = await prisma.article.findFirst({
      where: { id: req.params.id, project: { userId: req.user!.id } },
      include: { project: true, keyword: true },
    });
    if (!article) throw new AppError('Article not found', 404);
    res.json({ article });
  } catch (error) {
    next(error);
  }
});

// POST /api/articles
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      projectId: z.string().uuid(),
      keywordId: z.string().uuid().optional(),
      title: z.string().min(5),
    });
    const { projectId, keywordId, title } = schema.parse(req.body);

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id },
      include: { user: true },
    });
    if (!project) throw new AppError('Project not found', 404);

    // Check Article Limits
    if (project.user.articlesUsed >= project.user.articlesLimit) {
      throw new AppError('Article limit reached for your plan.', 403);
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const article = await prisma.article.create({
      data: {
        projectId,
        keywordId,
        title,
        slug,
        status: 'DRAFT',
      },
    });

    res.status(201).json({ article });
  } catch (error) {
    next(error);
  }
});

// POST /api/articles/:id/generate
router.post('/:id/generate', async (req: AuthRequest, res, next) => {
  try {
    const article = await prisma.article.findFirst({
      where: { id: req.params.id, project: { userId: req.user!.id } },
      include: { project: true }
    });

    if (!article) throw new AppError('Article not found', 404);
    if (article.status === 'GENERATING') throw new AppError('Generation already in progress', 400);

    await prisma.article.update({
      where: { id: req.params.id },
      data: { status: 'GENERATING' }
    });

    const job = await articleQueue.add('generate-article', {
      articleId: article.id,
      projectId: article.projectId
    });

    await prisma.job.create({
      data: {
        projectId: article.projectId,
        type: 'GENERATE_ARTICLE',
        status: 'PENDING',
        payload: { articleId: article.id, jobId: job.id }
      }
    });

    res.json({ message: 'Generation started', jobId: job.id });
  } catch (error) {
    next(error);
  }
});

export default router;
