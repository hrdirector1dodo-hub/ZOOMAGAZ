import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to find .env file in project root or bot folder
const possiblePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'bot', '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
];

let loaded = false;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loaded = true;
    break;
  }
}

export const config = {
  token: process.env.TELEGRAM_BOT_TOKEN || '',
  adminId: process.env.ADMIN_ID || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  siteUrl: process.env.SITE_URL ? process.env.SITE_URL.replace(/\/$/, '') : 'http://localhost:5173',
};
