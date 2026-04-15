import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

// GET /api/products
router.get('/', async (_req, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        category: true,
        stockLevels: { include: { warehouse: true } },
      },
    });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/products
router.post('/', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { sku, name, description, categoryId, costPrice, salePrice, reorderLevel } = req.body;
    if (!sku || !name || costPrice === undefined || salePrice === undefined) {
      res.status(400).json({ message: 'sku, name, costPrice and salePrice are required' });
      return;
    }
    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        categoryId: categoryId ? Number(categoryId) : undefined,
        costPrice,
        salePrice,
        reorderLevel: reorderLevel ?? 0,
      },
      include: { category: true },
    });
    res.status(201).json(product);
  } catch {
    res.status(409).json({ message: 'SKU already exists' });
  }
});

// PUT /api/products/:id
router.put('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { name, description, categoryId, costPrice, salePrice, reorderLevel, isActive } = req.body;
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
        categoryId: categoryId !== undefined ? (categoryId ? Number(categoryId) : null) : undefined,
        costPrice,
        salePrice,
        reorderLevel,
        isActive,
      },
      include: { category: true },
    });
    res.json(product);
  } catch {
    res.status(404).json({ message: 'Product not found' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: 'Product not found' });
  }
});

export default router;
