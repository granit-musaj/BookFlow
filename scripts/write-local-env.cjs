const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rand = () => crypto.randomBytes(32).toString('base64');

const jwtAccess = rand();
const jwtRefresh = rand();
const ownerPassword = rand();
const staffPassword = rand();
const clientPassword = rand();

const env = [
  'DATABASE_URL=postgresql://bookflow:bookflow@localhost:5432/bookflow',
  'REDIS_URL=redis://localhost:6379',
  `JWT_ACCESS_SECRET=${jwtAccess}`,
  `JWT_REFRESH_SECRET=${jwtRefresh}`,
  'JWT_ACCESS_EXPIRES_IN=15m',
  'JWT_REFRESH_EXPIRES_IN=7d',
  'NODE_ENV=development',
  'PORT=3000',
  'FRONTEND_URL=http://localhost:5173',
  'BACKEND_URL=http://localhost:3000',
  'SEED_OWNER_EMAIL=owner@studio.com',
  'SEED_STAFF_EMAIL=staff@studio.com',
  'SEED_CLIENT_EMAIL=client@email.com',
  'SEED_BUSINESS_NAME=Studio Aureel',
  'SEED_BUSINESS_SLUG=studio-aureel',
  `SEED_OWNER_PASSWORD=${ownerPassword}`,
  `SEED_STAFF_PASSWORD=${staffPassword}`,
  `SEED_CLIENT_PASSWORD=${clientPassword}`,
  '',
].join('\n');

fs.writeFileSync(path.join(root, '.env'), env);
fs.writeFileSync(path.join(root, 'backend', '.env'), env);
fs.writeFileSync(
  path.join(root, 'frontend', '.env'),
  'VITE_SITE_URL=http://localhost:5173\nVITE_API_URL=http://localhost:3000/api\n',
);

console.log('ENV_WRITTEN');
