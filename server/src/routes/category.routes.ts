import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

// GET /api/categories
router.get('/', async (_req, res: Response) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: Number(req.params.id) },
      include: { products: true },
    });
    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }
    res.json(category);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/categories
router.post('/', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: 'name is required' });
      return;
    }
    const category = await prisma.category.create({ data: { name, description } });
    res.status(201).json(category);
  } catch {
    res.status(409).json({ message: 'Category name already exists' });
  }
});

// PUT /api/categories/:id
router.put('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const category = await prisma.category.update({
      where: { id: Number(req.params.id) },
      data: { name, description },
    });
    res.json(category);
  } catch {
    res.status(404).json({ message: 'Category not found' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: 'Category not found or has linked products' });
  }
});

export default router;
