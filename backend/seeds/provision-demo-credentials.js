'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function main() {
  const email = String(process.env.DEMO_EMAIL || process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.DEMO_PASSWORD || process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '');
  if (!email || password.length < 12) throw new Error('Local demo credentials are incomplete');
  const hash = await bcrypt.hash(password, 10);
  const user = await pool.query(
    `INSERT INTO proof_users(email,password_hash,name) VALUES($1,$2,$3)
     ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,name=EXCLUDED.name RETURNING id`,
    [email, hash, 'Runtime Administrator'],
  );
  const tenantName = process.env.BOOTSTRAP_TENANT_NAME || 'Development Tenant';
  let tenant = await pool.query('SELECT id FROM proof_tenants WHERE name=$1 ORDER BY id LIMIT 1', [tenantName]);
  if (!tenant.rows[0]) tenant = await pool.query('INSERT INTO proof_tenants(name) VALUES($1) RETURNING id', [tenantName]);
  await pool.query(
    `INSERT INTO proof_memberships(tenant_id,user_id,role,active) VALUES($1,$2,'admin',TRUE)
     ON CONFLICT(tenant_id,user_id) DO UPDATE SET role='admin',active=TRUE`,
    [tenant.rows[0].id, user.rows[0].id],
  );
  await pool.end();
  console.log('Provisioned local demo administrator.');
}
main().catch((error) => { console.error(error.message); process.exit(1); });
