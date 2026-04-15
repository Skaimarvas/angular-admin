import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

// GET /api/stock-levels
router.get('/', async (_req, res: Response) => {
  try {
    const levels = await prisma.stockLevel.findMany({
      include: { product: true, warehouse: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(levels);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/stock-levels/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const level = await prisma.stockLevel.findUnique({
      where: { id: Number(req.params.id) },
      include: { product: true, warehouse: true },
    });
    if (!level) {
      res.status(404).json({ message: 'Stock level not found' });
      return;
    }
    res.json(level);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/stock-levels
router.post('/', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { productId, warehouseId, quantity, reserved } = req.body;
    if (!productId || !warehouseId) {
      res.status(400).json({ message: 'productId and warehouseId are required' });
      return;
    }
    const level = await prisma.stockLevel.create({
      data: {
        productId: Number(productId),
        warehouseId: Number(warehouseId),
        quantity: quantity ?? 0,
        reserved: reserved ?? 0,
      },
      include: { product: true, warehouse: true },
    });
    res.status(201).json(level);
  } catch {
    res.status(409).json({ message: 'Stock level for this product/warehouse already exists' });
  }
});

// PUT /api/stock-levels/:id
router.put('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { quantity, reserved } = req.body;
    const level = await prisma.stockLevel.update({
      where: { id: Number(req.params.id) },
      data: { quantity, reserved },
      include: { product: true, warehouse: true },
    });
    res.json(level);
  } catch {
    res.status(404).json({ message: 'Stock level not found' });
  }
});

// DELETE /api/stock-levels/:id
router.delete('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.stockLevel.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: 'Stock level not found' });
  }
});

export default router;
