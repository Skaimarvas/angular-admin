import { Router, Request, Response } from 'express';
import { Role, PaymentMethod, PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

// GET /api/payments
router.get('/', async (_req, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { sale: true },
      orderBy: { paidAt: 'desc' },
    });
    res.json(payments);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/payments/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: Number(req.params.id) },
      include: { sale: true },
    });
    if (!payment) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }
    res.json(payment);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/payments  — records payment and recalculates sale payment status atomically
router.post('/', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    const { saleId, method, amount, reference, note } = req.body;
    if (!saleId || !method || amount === undefined) {
      res.status(400).json({ message: 'saleId, method and amount are required' });
      return;
    }
    if (!Object.values(PaymentMethod).includes(method)) {
      res.status(400).json({
        message: `method must be one of: ${Object.values(PaymentMethod).join(', ')}`,
      });
      return;
    }

    const payment = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id: Number(saleId) } });
      if (!sale) throw new Error('SALE_NOT_FOUND');

      const pmt = await tx.payment.create({
        data: { saleId: Number(saleId), method, amount, reference, note },
        include: { sale: true },
      });

      const newPaid = Number(sale.paidAmount) + Number(amount);
      const newDue = Number(sale.total) - newPaid;
      const paymentStatus =
        newDue <= 0
          ? PaymentStatus.PAID
          : newPaid > 0
            ? PaymentStatus.PARTIAL
            : PaymentStatus.UNPAID;

      await tx.sale.update({
        where: { id: sale.id },
        data: {
          paidAmount: newPaid,
          dueAmount: Math.max(0, newDue),
          paymentStatus,
        },
      });

      return pmt;
    });

    res.status(201).json(payment);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'SALE_NOT_FOUND') {
      res.status(404).json({ message: 'Sale not found' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// DELETE /api/payments/:id
router.delete('/:id', requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response) => {
  try {
    await prisma.payment.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(404).json({ message: 'Payment not found' });
  }
});

export default router;
