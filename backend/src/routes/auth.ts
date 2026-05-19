import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import { hashPassword, comparePassword } from '../utils/crypto';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        plan: 'STARTER',
        articlesLimit: config.PLAN_LIMITS['STARTER'],
      },
      select: { id: true, email: true, name: true, plan: true, createdAt: true },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.JWT_SECRET as any,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.JWT_SECRET as any,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        articlesUsed: user.articlesUsed,
        articlesLimit: user.articlesLimit,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        articlesUsed: true,
        articlesLimit: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2).optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().min(8).optional(),
    });
    const { name, currentPassword, newPassword } = schema.parse(req.body);

    const updateData: any = {};
    if (name) updateData.name = name;

    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      const isValid = await comparePassword(currentPassword, user!.passwordHash);
      if (!isValid) throw new AppError('Current password is incorrect', 400);
      updateData.passwordHash = await hashPassword(newPassword);
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: { id: true, email: true, name: true, plan: true },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
