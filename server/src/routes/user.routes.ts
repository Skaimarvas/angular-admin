import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

// GET /api/users
router.get('/', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (_req, res: Response) => {
  try {
    const users = await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'desc' } });
    res.json(users);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/:id
router.get('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: userSelect,
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/users  — SUPER_ADMIN only
router.post('/', requireRole(Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ message: 'email, password, firstName, lastName are required' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, role: role ?? Role.USER },
      select: userSelect,
    });
    res.status(201).json(user);
  } catch {
    res.status(409).json({ message: 'Email already exists' });
  }
});

// PUT /api/users/:id
router.put('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const authUser = (req as AuthRequest).user!;
    const { firstName, lastName, isActive, role } = req.body;
    const data: Partial<{ firstName: string; lastName: string; isActive: boolean; role: Role }> = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (isActive !== undefined) data.isActive = isActive;
    // Only SUPER_ADMIN can change roles
    if (role !== undefined && authUser.role === Role.SUPER_ADMIN) data.role = role;
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
      select: userSelect,
    });
    res.json(user);
  } catch {
    res.status(404).json({ message: 'User not found' });
  }
});

// DELETE /api/users/:id  — SUPER_ADMIN only
router.delete('/:id', requireRole(Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: 'User not found' });
  }
});

export default router;
