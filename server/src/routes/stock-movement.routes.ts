import { Router, Request, Response } from 'express';
import { Role, StockMovementType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

const movementInclude = {
  product: true,
  warehouse: true,
  user: { select: { id: true, firstName: true, lastName: true } },
};

// GET /api/stock-movements
router.get('/', async (_req, res: Response) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: movementInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(movements);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/stock-movements/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const movement = await prisma.stockMovement.findUnique({
      where: { id: Number(req.params.id) },
      include: movementInclude,
    });
    if (!movement) {
      res.status(404).json({ message: 'Stock movement not found' });
      return;
    }
    res.json(movement);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/stock-movements  — also updates StockLevel & Product.quantityOnHand
router.post('/', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { productId, warehouseId, type, quantity, reference, note } = req.body;
    if (!productId || !warehouseId || !type || quantity === undefined) {
      res.status(400).json({ message: 'productId, warehouseId, type and quantity are required' });
      return;
    }
    if (!Object.values(StockMovementType).includes(type)) {
      res.status(400).json({
        message: `type must be one of: ${Object.values(StockMovementType).join(', ')}`,
      });
      return;
    }

    const delta =
      type === StockMovementType.IN || type === StockMovementType.TRANSFER_IN
        ? Math.abs(Number(quantity))
        : type === StockMovementType.OUT || type === StockMovementType.TRANSFER_OUT
          ? -Math.abs(Number(quantity))
          : Number(quantity); // ADJUSTMENT: positive = add, negative = subtract

    const userId = (req as AuthRequest).user!.id;

    const movement = await prisma.$transaction(async (tx) => {
      const mov = await tx.stockMovement.create({
        data: {
          productId: Number(productId),
          warehouseId: Number(warehouseId),
          userId,
          type,
          quantity: Number(quantity),
          reference,
          note,
        },
        include: movementInclude,
      });

      // Upsert stock level for this product+warehouse pair
      await tx.stockLevel.upsert({
        where: {
          productId_warehouseId: {
            productId: Number(productId),
            warehouseId: Number(warehouseId),
          },
        },
        create: {
          productId: Number(productId),
          warehouseId: Number(warehouseId),
          quantity: Math.max(0, delta),
        },
        update: { quantity: { increment: delta } },
      });

      // Keep product.quantityOnHand in sync
      await tx.product.update({
        where: { id: Number(productId) },
        data: { quantityOnHand: { increment: delta } },
      });

      return mov;
    });

    res.status(201).json(movement);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
