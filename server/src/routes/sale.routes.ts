import { Router, Request, Response } from 'express';
import { Role, SaleStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

const saleInclude = {
  customer: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true } },
  items: { include: { product: true } },
  payments: true,
};

// GET /api/sales
router.get('/', async (_req, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      include: saleInclude,
      orderBy: { saleDate: 'desc' },
    });
    res.json(sales);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/sales/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: Number(req.params.id) },
      include: saleInclude,
    });
    if (!sale) {
      res.status(404).json({ message: 'Sale not found' });
      return;
    }
    res.json(sale);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/sales  — any authenticated user can create a draft sale
router.post('/', async (req: Request, res: Response) => {
  try {
    const { saleNumber, customerId, tax, discount, items } = req.body;
    if (!saleNumber || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'saleNumber and at least one item are required' });
      return;
    }
    type ItemInput = { productId: number; quantity: number; unitPrice: number; discount?: number };
    const itemsData = items as ItemInput[];

    const subtotal = itemsData.reduce(
      (acc, i) => acc + Number(i.unitPrice) * Number(i.quantity) - Number(i.discount ?? 0),
      0,
    );
    const taxAmt = Number(tax ?? 0);
    const discountAmt = Number(discount ?? 0);
    const total = subtotal + taxAmt - discountAmt;
    const createdById = (req as AuthRequest).user!.id;

    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        customerId: customerId ? Number(customerId) : undefined,
        createdById,
        subtotal,
        tax: taxAmt,
        discount: discountAmt,
        total,
        dueAmount: total,
        items: {
          create: itemsData.map((i) => ({
            productId: Number(i.productId),
            quantity: Number(i.quantity),
            unitPrice: i.unitPrice,
            discount: i.discount ?? 0,
            total: Number(i.unitPrice) * Number(i.quantity) - Number(i.discount ?? 0),
          })),
        },
      },
      include: saleInclude,
    });
    res.status(201).json(sale);
  } catch {
    res.status(409).json({ message: 'Sale number already exists or invalid data' });
  }
});

// PUT /api/sales/:id  — update header; ADMIN+ required
router.put('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { customerId, status } = req.body;
    const authUser = (req as AuthRequest).user!;
    const sale = await prisma.sale.update({
      where: { id: Number(req.params.id) },
      data: {
        customerId: customerId !== undefined ? (customerId ? Number(customerId) : null) : undefined,
        status,
        approvedById: status === SaleStatus.CONFIRMED ? authUser.id : undefined,
      },
      include: saleInclude,
    });
    res.json(sale);
  } catch {
    res.status(404).json({ message: 'Sale not found' });
  }
});

// PATCH /api/sales/:id/status
router.patch(
  '/:id/status',
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!Object.values(SaleStatus).includes(status)) {
        res.status(400).json({
          message: `status must be one of: ${Object.values(SaleStatus).join(', ')}`,
        });
        return;
      }
      const authUser = (req as AuthRequest).user!;
      const sale = await prisma.sale.update({
        where: { id: Number(req.params.id) },
        data: {
          status,
          approvedById: status === SaleStatus.CONFIRMED ? authUser.id : undefined,
        },
        include: saleInclude,
      });
      res.json(sale);
    } catch {
      res.status(404).json({ message: 'Sale not found' });
    }
  },
);

// DELETE /api/sales/:id
router.delete('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.sale.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: 'Sale not found' });
  }
});

export default router;
