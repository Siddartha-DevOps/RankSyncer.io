import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { articleQueue, keywordQueue } from '../workers/queues';

const router = Router();

const createProjectSchema = z.object({
  domain: z.string().url('Must be a valid URL'),
  name: z.string().min(2),
  niche: z.string().optional(),
  targetAudience: z.string().optional(),
  toneOfVoice: z.enum(['professional', 'casual', 'authoritative', 'friendly', 'technical']).default('professional'),
  language: z.string().default('en'),
  country: z.string().default('US'),
});

// GET /api/projects
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: { keywords: true, articles: true, backlinks: true },
        },
        analytics: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: {
        _count: {
          select: { keywords: true, articles: true, backlinks: true, contentPlans: true },
        },
        cmsIntegrations: {
          select: { id: true, cmsType: true, siteUrl: true, isActive: true, isVerified: true },
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!project) throw new AppError('Project not found', 404);
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = createProjectSchema.parse(req.body);

    // Normalize domain
    const domain = data.domain.replace(/\/$/, '');

    const project = await prisma.project.create({
      data: {
        domain,
        name: data.name,
        niche: data.niche,
        targetAudience: data.targetAudience,
        toneOfVoice: data.toneOfVoice,
        language: data.language,
        country: data.country,
        userId: req.user!.id,
        crawlStatus: 'PENDING',
      },
    });

    // Trigger website analysis job
    await keywordQueue.add('crawl-website', {
      projectId: project.id,
      domain: project.domain,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    // Track job in DB
    await prisma.job.create({
      data: {
        projectId: project.id,
        type: 'CRAWL_WEBSITE',
        status: 'PENDING',
        payload: { domain },
      },
    });

    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!project) throw new AppError('Project not found', 404);

    const schema = createProjectSchema.partial();
    const data = schema.parse(req.body);

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ project: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!project) throw new AppError('Project not found', 404);

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/analyze
router.post('/:id/analyze', async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!project) throw new AppError('Project not found', 404);

    await prisma.project.update({
      where: { id: req.params.id },
      data: { crawlStatus: 'PENDING' },
    });

    await keywordQueue.add('crawl-website', {
      projectId: project.id,
      domain: project.domain,
    }, { attempts: 3 });

    res.json({ message: 'Analysis started', status: 'PENDING' });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/generate-plan
router.post('/:id/generate-plan', async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!project) throw new AppError('Project not found', 404);

    await keywordQueue.add('create-content-plan', {
      projectId: project.id,
    }, { attempts: 3 });

    res.json({ message: 'Content plan generation started' });
  } catch (error) {
    next(error);
  }
});

export default router;
