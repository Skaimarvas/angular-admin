import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

// GET /api/suppliers
router.get('/', async (_req, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    res.json(suppliers);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(req.params.id) },
      include: { purchases: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!supplier) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }
    res.json(supplier);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/suppliers
router.post('/', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { code, name, contactName, email, phone, address } = req.body;
    if (!code || !name) {
      res.status(400).json({ message: 'code and name are required' });
      return;
    }
    const supplier = await prisma.supplier.create({
      data: { code, name, contactName, email, phone, address },
    });
    res.status(201).json(supplier);
  } catch {
    res.status(409).json({ message: 'Supplier code or email already exists' });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { name, contactName, email, phone, address } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: { name, contactName, email, phone, address },
    });
    res.json(supplier);
  } catch {
    res.status(404).json({ message: 'Supplier not found' });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.supplier.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: 'Supplier not found' });
  }
});

export default router;
