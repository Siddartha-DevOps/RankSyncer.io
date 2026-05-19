import { Router } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/analytics
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, days = 30 } = req.query;
    if (!projectId) throw new AppError('Project ID is required', 400);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const analytics = await prisma.projectAnalytics.findMany({
      where: {
        projectId: projectId as string,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ analytics });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/summary
router.get('/summary', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) throw new AppError('Project ID is required', 400);

    const latest = await prisma.projectAnalytics.findFirst({
      where: { projectId: projectId as string },
      orderBy: { date: 'desc' },
    });

    const previous = await prisma.projectAnalytics.findFirst({
      where: { projectId: projectId as string },
      orderBy: { date: 'desc' },
      skip: 1,
    });

    res.json({ latest, previous });
  } catch (error) {
    next(error);
  }
});

export default router;
