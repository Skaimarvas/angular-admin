import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

// GET /api/customers
router.get('/', async (_req, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } });
    res.json(customers);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(req.params.id) },
      include: { sales: { orderBy: { saleDate: 'desc' }, take: 20 } },
    });
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/customers
router.post('/', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { code, name, email, phone, address } = req.body;
    if (!code || !name) {
      res.status(400).json({ message: 'code and name are required' });
      return;
    }
    const customer = await prisma.customer.create({ data: { code, name, email, phone, address } });
    res.status(201).json(customer);
  } catch {
    res.status(409).json({ message: 'Customer code or email already exists' });
  }
});

// PUT /api/customers/:id
router.put('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;
    const customer = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data: { name, email, phone, address },
    });
    res.json(customer);
  } catch {
    res.status(404).json({ message: 'Customer not found' });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.customer.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: 'Customer not found' });
  }
});

export default router;
