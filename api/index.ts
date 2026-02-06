import app from '../backend/src/app';
import dotenv from 'dotenv';
import { initDB } from '../backend/src/config/db';

dotenv.config();

// Vercel handles the request/response, so we need to export the handler
export default async function handler(req: any, res: any) {
  // Ensure DB is initialized before handling request
  await initDB().catch(err => console.error('Init DB Error:', err));
  
  // Ensure we await the app processing
  return app(req, res);
}
