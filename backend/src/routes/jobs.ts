import { Router } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, project: { userId: req.user!.id } },
    });
    res.json({ job });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { projectId } = req.query;
    const jobs = await prisma.job.findMany({
      where: { 
        projectId: projectId as string,
        project: { userId: req.user!.id } 
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
});

export default router;
