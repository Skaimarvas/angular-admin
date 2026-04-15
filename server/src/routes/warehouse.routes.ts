import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

// GET /api/warehouses
router.get('/', async (_req, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
    res.json(warehouses);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/warehouses/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: Number(req.params.id) },
      include: { stockLevels: { include: { product: true } } },
    });
    if (!warehouse) {
      res.status(404).json({ message: 'Warehouse not found' });
      return;
    }
    res.json(warehouse);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/warehouses
router.post('/', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { code, name, location } = req.body;
    if (!code || !name) {
      res.status(400).json({ message: 'code and name are required' });
      return;
    }
    const warehouse = await prisma.warehouse.create({ data: { code, name, location } });
    res.status(201).json(warehouse);
  } catch {
    res.status(409).json({ message: 'Warehouse code already exists' });
  }
});

// PUT /api/warehouses/:id
router.put('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { name, location, isActive } = req.body;
    const warehouse = await prisma.warehouse.update({
      where: { id: Number(req.params.id) },
      data: { name, location, isActive },
    });
    res.json(warehouse);
  } catch {
    res.status(404).json({ message: 'Warehouse not found' });
  }
});

// DELETE /api/warehouses/:id
router.delete('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.warehouse.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: 'Warehouse not found' });
  }
});

export default router;
