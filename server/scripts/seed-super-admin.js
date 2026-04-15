require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

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

    console.log('SUPER_ADMIN user is ready.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Failed to seed SUPER_ADMIN:', error);
  process.exit(1);
});
