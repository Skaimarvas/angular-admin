require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function upsertUser(pool, { email, password, firstName, lastName, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO "User" ("email", "passwordHash", "firstName", "lastName", "role", "isActive", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, true, NOW())
     ON CONFLICT ("email") DO UPDATE
     SET "passwordHash" = EXCLUDED."passwordHash",
         "firstName" = EXCLUDED."firstName",
         "lastName" = EXCLUDED."lastName",
         "role" = EXCLUDED."role",
         "isActive" = true,
         "updatedAt" = NOW()
     RETURNING "id"`,
    [email, passwordHash, firstName, lastName, role]
  );

  return result.rows[0].id;
}

async function upsertCategory(pool, { name, description }) {
  const result = await pool.query(
    `INSERT INTO "Category" ("name", "description", "updatedAt")
     VALUES ($1, $2, NOW())
     ON CONFLICT ("name") DO UPDATE
     SET "description" = EXCLUDED."description",
         "updatedAt" = NOW()
     RETURNING "id"`,
    [name, description]
  );

  return result.rows[0].id;
}

async function upsertWarehouse(pool, { code, name, location }) {
  const result = await pool.query(
    `INSERT INTO "Warehouse" ("code", "name", "location", "isActive", "updatedAt")
     VALUES ($1, $2, $3, true, NOW())
     ON CONFLICT ("code") DO UPDATE
     SET "name" = EXCLUDED."name",
         "location" = EXCLUDED."location",
         "isActive" = true,
         "updatedAt" = NOW()
     RETURNING "id"`,
    [code, name, location]
  );

  return result.rows[0].id;
}

async function upsertProduct(pool, { sku, name, description, categoryId, costPrice, salePrice, reorderLevel }) {
  const result = await pool.query(
    `INSERT INTO "Product" (
        "sku", "name", "description", "categoryId", "costPrice", "salePrice", "reorderLevel", "isActive", "updatedAt"
      )
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
     ON CONFLICT ("sku") DO UPDATE
     SET "name" = EXCLUDED."name",
         "description" = EXCLUDED."description",
         "categoryId" = EXCLUDED."categoryId",
         "costPrice" = EXCLUDED."costPrice",
         "salePrice" = EXCLUDED."salePrice",
         "reorderLevel" = EXCLUDED."reorderLevel",
         "isActive" = true,
         "updatedAt" = NOW()
     RETURNING "id"`,
    [sku, name, description, categoryId, costPrice, salePrice, reorderLevel]
  );

  return result.rows[0].id;
}

async function upsertStockLevel(pool, { productId, warehouseId, quantity, reserved }) {
  await pool.query(
    `INSERT INTO "StockLevel" ("productId", "warehouseId", "quantity", "reserved", "updatedAt")
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT ("productId", "warehouseId") DO UPDATE
     SET "quantity" = EXCLUDED."quantity",
         "reserved" = EXCLUDED."reserved",
         "updatedAt" = NOW()`,
    [productId, warehouseId, quantity, reserved]
  );
}

async function upsertCustomer(pool, { code, name, email, phone, address }) {
  const result = await pool.query(
    `INSERT INTO "Customer" ("code", "name", "email", "phone", "address", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT ("code") DO UPDATE
     SET "name" = EXCLUDED."name",
         "email" = EXCLUDED."email",
         "phone" = EXCLUDED."phone",
         "address" = EXCLUDED."address",
         "updatedAt" = NOW()
     RETURNING "id"`,
    [code, name, email, phone, address]
  );

  return result.rows[0].id;
}

async function upsertSale(pool, sale) {
  const result = await pool.query(
    `INSERT INTO "Sale" (
        "saleNumber", "customerId", "createdById", "approvedById", "status", "subtotal", "tax", "discount",
        "total", "paidAmount", "dueAmount", "paymentStatus", "saleDate", "updatedAt"
      )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
     ON CONFLICT ("saleNumber") DO UPDATE
     SET "customerId" = EXCLUDED."customerId",
         "createdById" = EXCLUDED."createdById",
         "approvedById" = EXCLUDED."approvedById",
         "status" = EXCLUDED."status",
         "subtotal" = EXCLUDED."subtotal",
         "tax" = EXCLUDED."tax",
         "discount" = EXCLUDED."discount",
         "total" = EXCLUDED."total",
         "paidAmount" = EXCLUDED."paidAmount",
         "dueAmount" = EXCLUDED."dueAmount",
         "paymentStatus" = EXCLUDED."paymentStatus",
         "saleDate" = EXCLUDED."saleDate",
         "updatedAt" = NOW()
     RETURNING "id"`,
    [
      sale.saleNumber,
      sale.customerId,
      sale.createdById,
      sale.approvedById,
      sale.status,
      sale.subtotal,
      sale.tax,
      sale.discount,
      sale.total,
      sale.paidAmount,
      sale.dueAmount,
      sale.paymentStatus,
      sale.saleDate,
    ]
  );

  return result.rows[0].id;
}

async function upsertSaleItem(pool, { saleId, productId, quantity, unitPrice, discount, total }) {
  await pool.query(
    `INSERT INTO "SaleItem" ("saleId", "productId", "quantity", "unitPrice", "discount", "total", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT ("saleId", "productId") DO UPDATE
     SET "quantity" = EXCLUDED."quantity",
         "unitPrice" = EXCLUDED."unitPrice",
         "discount" = EXCLUDED."discount",
         "total" = EXCLUDED."total",
         "updatedAt" = NOW()`,
    [saleId, productId, quantity, unitPrice, discount, total]
  );
}

async function upsertPayment(pool, { saleId, method, amount, paidAt, reference, note }) {
  const existing = await pool.query(
    `SELECT "id" FROM "Payment" WHERE "saleId" = $1 AND "reference" = $2 LIMIT 1`,
    [saleId, reference]
  );

  if (existing.rows.length > 0) {
    await pool.query(
      `UPDATE "Payment"
       SET "method" = $1, "amount" = $2, "paidAt" = $3, "note" = $4
       WHERE "id" = $5`,
      [method, amount, paidAt, note, existing.rows[0].id]
    );
    return;
  }

  await pool.query(
    `INSERT INTO "Payment" ("saleId", "method", "amount", "paidAt", "reference", "note")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [saleId, method, amount, paidAt, reference, note]
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const email = process.env.SUPER_ADMIN_EMAIL || '';
  const password = process.env.SUPER_ADMIN_PASSWORD || '';
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME || '';
  const lastName = process.env.SUPER_ADMIN_LAST_NAME || '';

  const passwordHash = await bcrypt.hash(password, 10);
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await pool.query(
      `INSERT INTO "User" ("email", "passwordHash", "firstName", "lastName", "role", "isActive", "updatedAt")
       VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', true, NOW())
       ON CONFLICT ("email") DO UPDATE
       SET "passwordHash" = EXCLUDED."passwordHash",
           "firstName" = EXCLUDED."firstName",
           "lastName" = EXCLUDED."lastName",
           "role" = 'SUPER_ADMIN',
           "isActive" = true,
           "updatedAt" = NOW()`,
      [email, passwordHash, firstName, lastName]
    );

    const superAdminRow = await pool.query(
      `SELECT "id" FROM "User" WHERE "email" = $1 LIMIT 1`,
      [email]
    );
    const superAdminId = superAdminRow.rows[0]?.id;

    const adminOneId = await upsertUser(pool, {
      email: 'admin.one@erp.local',
      password: 'Admin@1234',
      firstName: 'Aiden',
      lastName: 'Cole',
      role: 'ADMIN',
    });

    const adminTwoId = await upsertUser(pool, {
      email: 'admin.two@erp.local',
      password: 'Admin@1234',
      firstName: 'Mia',
      lastName: 'Hughes',
      role: 'ADMIN',
    });

    await upsertUser(pool, {
      email: 'user.one@erp.local',
      password: 'User@1234',
      firstName: 'Liam',
      lastName: 'Turner',
      role: 'USER',
    });

    await upsertUser(pool, {
      email: 'user.two@erp.local',
      password: 'User@1234',
      firstName: 'Sophia',
      lastName: 'Bennett',
      role: 'USER',
    });

    await upsertUser(pool, {
      email: 'user.three@erp.local',
      password: 'User@1234',
      firstName: 'Noah',
      lastName: 'Price',
      role: 'USER',
    });

    const categoryHardwareId = await upsertCategory(pool, {
      name: 'Hardware',
      description: 'Hardware devices and accessories',
    });
    const categoryOfficeId = await upsertCategory(pool, {
      name: 'Office Supplies',
      description: 'Operational and office consumables',
    });

    const warehouseCentralId = await upsertWarehouse(pool, {
      code: 'WH-CENTRAL',
      name: 'Central Warehouse',
      location: 'Riga - Main Hub',
    });
    const warehouseEastId = await upsertWarehouse(pool, {
      code: 'WH-EAST',
      name: 'East Warehouse',
      location: 'Riga - East',
    });

    const scannerProductId = await upsertProduct(pool, {
      sku: 'INV-SCAN-001',
      name: 'Wireless Barcode Scanner',
      description: '2D wireless scanner',
      categoryId: categoryHardwareId,
      costPrice: 55.0,
      salePrice: 95.0,
      reorderLevel: 10,
    });
    const labelProductId = await upsertProduct(pool, {
      sku: 'INV-LABEL-001',
      name: 'Thermal Label Roll',
      description: '4x6 shipping labels',
      categoryId: categoryOfficeId,
      costPrice: 8.0,
      salePrice: 14.0,
      reorderLevel: 30,
    });
    const tapeProductId = await upsertProduct(pool, {
      sku: 'INV-TAPE-001',
      name: 'Packaging Tape',
      description: '48mm packing tape',
      categoryId: categoryOfficeId,
      costPrice: 2.0,
      salePrice: 4.5,
      reorderLevel: 50,
    });

    await upsertStockLevel(pool, {
      productId: scannerProductId,
      warehouseId: warehouseCentralId,
      quantity: 120,
      reserved: 12,
    });
    await upsertStockLevel(pool, {
      productId: labelProductId,
      warehouseId: warehouseCentralId,
      quantity: 260,
      reserved: 35,
    });
    await upsertStockLevel(pool, {
      productId: tapeProductId,
      warehouseId: warehouseEastId,
      quantity: 410,
      reserved: 50,
    });

    const customerNorthwindId = await upsertCustomer(pool, {
      code: 'CUST-001',
      name: 'Northwind Logistics',
      email: 'accounts@northwind.local',
      phone: '+37120010001',
      address: 'Brivibas iela 10, Riga',
    });
    const customerBluepeakId = await upsertCustomer(pool, {
      code: 'CUST-002',
      name: 'BluePeak Retail',
      email: 'finance@bluepeak.local',
      phone: '+37120010002',
      address: 'Valnu iela 22, Riga',
    });

    const saleOneId = await upsertSale(pool, {
      saleNumber: 'SALE-2026-0001',
      customerId: customerNorthwindId,
      createdById: adminOneId,
      approvedById: superAdminId ?? adminTwoId,
      status: 'CONFIRMED',
      subtotal: 2900.0,
      tax: 290.0,
      discount: 90.0,
      total: 3100.0,
      paidAmount: 1200.0,
      dueAmount: 1900.0,
      paymentStatus: 'PARTIAL',
      saleDate: new Date('2026-04-12T10:15:00Z'),
    });

    await upsertSaleItem(pool, {
      saleId: saleOneId,
      productId: scannerProductId,
      quantity: 10,
      unitPrice: 95.0,
      discount: 0.0,
      total: 950.0,
    });
    await upsertSaleItem(pool, {
      saleId: saleOneId,
      productId: labelProductId,
      quantity: 140,
      unitPrice: 14.0,
      discount: 10.0,
      total: 1950.0,
    });

    await upsertPayment(pool, {
      saleId: saleOneId,
      method: 'BANK_TRANSFER',
      amount: 1200.0,
      paidAt: new Date('2026-04-13T09:00:00Z'),
      reference: 'PAY-SALE-2026-0001-1',
      note: 'Initial partial payment',
    });

    const saleTwoId = await upsertSale(pool, {
      saleNumber: 'SALE-2026-0002',
      customerId: customerBluepeakId,
      createdById: adminTwoId,
      approvedById: superAdminId ?? adminOneId,
      status: 'COMPLETED',
      subtotal: 1800.0,
      tax: 180.0,
      discount: 80.0,
      total: 1900.0,
      paidAmount: 1900.0,
      dueAmount: 0.0,
      paymentStatus: 'PAID',
      saleDate: new Date('2026-04-14T11:45:00Z'),
    });

    await upsertSaleItem(pool, {
      saleId: saleTwoId,
      productId: tapeProductId,
      quantity: 300,
      unitPrice: 4.5,
      discount: 20.0,
      total: 1330.0,
    });
    await upsertSaleItem(pool, {
      saleId: saleTwoId,
      productId: scannerProductId,
      quantity: 6,
      unitPrice: 95.0,
      discount: 0.0,
      total: 570.0,
    });

    await upsertPayment(pool, {
      saleId: saleTwoId,
      method: 'CARD',
      amount: 1900.0,
      paidAt: new Date('2026-04-14T12:10:00Z'),
      reference: 'PAY-SALE-2026-0002-1',
      note: 'Full payment captured',
    });

    console.log('SUPER_ADMIN user is ready.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Sample ADMIN/USER, inventory, and sales data are ready.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Failed to seed SUPER_ADMIN:', error);
  process.exit(1);
});
