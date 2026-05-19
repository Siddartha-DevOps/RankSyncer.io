import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { keywordQueue } from '../workers/queues';

const router = Router();

// GET /api/keywords
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, search } = req.query;
    if (!projectId) throw new AppError('Project ID is required', 400);

    const keywords = await prisma.keyword.findMany({
      where: {
        projectId: projectId as string,
        term: search ? { contains: search as string, mode: 'insensitive' } : undefined,
      },
      orderBy: { volume: 'desc' },
    });
    res.json({ keywords });
  } catch (error) {
    next(error);
  }
});

// POST /api/keywords
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      projectId: z.string().uuid(),
      term: z.string().min(1),
    });
    const { projectId, term } = schema.parse(req.body);

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id },
    });
    if (!project) throw new AppError('Project not found', 404);

    const keyword = await prisma.keyword.upsert({
      where: { projectId_term: { projectId, term } },
      update: {},
      create: {
        projectId,
        term,
        volume: 0,
        difficulty: 0,
      },
    });

    res.status(201).json({ keyword });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/keywords/:id
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const keyword = await prisma.keyword.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!keyword || keyword.project.userId !== req.user!.id) {
      throw new AppError('Keyword not found', 404);
    }

    await prisma.keyword.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
