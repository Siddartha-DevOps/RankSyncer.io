import { Router } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) throw new AppError('Project ID is required', 400);

    const plans = await prisma.contentPlan.findMany({
      where: { projectId: projectId as string },
      include: { articles: { select: { id: true, title: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

export default router;
