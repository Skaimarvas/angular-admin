import { Router, Request, Response } from 'express';
import { Role, PurchaseStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

const purchaseInclude = {
  supplier: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  items: { include: { product: true } },
};

// GET /api/purchases
router.get('/', async (_req, res: Response) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: purchaseInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(purchases);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/purchases/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: Number(req.params.id) },
      include: purchaseInclude,
    });
    if (!purchase) {
      res.status(404).json({ message: 'Purchase not found' });
      return;
    }
    res.json(purchase);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/purchases  — creates purchase + line items in one transaction
router.post('/', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { purchaseNumber, supplierId, expectedDate, items } = req.body;
    if (!purchaseNumber || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'purchaseNumber and at least one item are required' });
      return;
    }
    type ItemInput = { productId: number; quantity: number; unitCost: number };
    const itemsData = items as ItemInput[];
    const total = itemsData.reduce((acc, i) => acc + Number(i.unitCost) * Number(i.quantity), 0);
    const createdById = (req as AuthRequest).user!.id;

    const purchase = await prisma.purchase.create({
      data: {
        purchaseNumber,
        supplierId: supplierId ? Number(supplierId) : undefined,
        createdById,
        total,
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        items: {
          create: itemsData.map((i) => ({
            productId: Number(i.productId),
            quantity: Number(i.quantity),
            unitCost: i.unitCost,
            total: Number(i.unitCost) * Number(i.quantity),
          })),
        },
      },
      include: purchaseInclude,
    });
    res.status(201).json(purchase);
  } catch {
    res.status(409).json({ message: 'Purchase number already exists or invalid data' });
  }
});

// PUT /api/purchases/:id  — update header fields
router.put('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { supplierId, expectedDate, receivedDate, status } = req.body;
    const purchase = await prisma.purchase.update({
      where: { id: Number(req.params.id) },
      data: {
        supplierId: supplierId !== undefined ? (supplierId ? Number(supplierId) : null) : undefined,
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        receivedDate: receivedDate ? new Date(receivedDate) : undefined,
        status,
      },
      include: purchaseInclude,
    });
    res.json(purchase);
  } catch {
    res.status(404).json({ message: 'Purchase not found' });
  }
});

// PATCH /api/purchases/:id/status
router.patch(
  '/:id/status',
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!Object.values(PurchaseStatus).includes(status)) {
        res.status(400).json({
          message: `status must be one of: ${Object.values(PurchaseStatus).join(', ')}`,
        });
        return;
      }
      const purchase = await prisma.purchase.update({
        where: { id: Number(req.params.id) },
        data: {
          status,
          receivedDate: status === PurchaseStatus.RECEIVED ? new Date() : undefined,
        },
        include: purchaseInclude,
      });
      res.json(purchase);
    } catch {
      res.status(404).json({ message: 'Purchase not found' });
    }
  },
);

// DELETE /api/purchases/:id
router.delete('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.purchase.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: 'Purchase not found' });
  }
});

export default router;
