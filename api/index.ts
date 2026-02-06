import app from '../backend/src/app';
import dotenv from 'dotenv';
import { initDB } from '../backend/src/config/db';

dotenv.config();

// Initialize DB on cold start
initDB().catch(err => console.error('Init DB Error:', err));

// Vercel handles the request/response, so we need to export the handler
export default async function handler(req: any, res: any) {
  // Ensure we await the app processing
  return app(req, res);
}
