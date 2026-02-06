import app from '../backend/src/app';
import dotenv from 'dotenv';

dotenv.config();

// Vercel handles the request/response, so we need to export the handler
export default async function handler(req: any, res: any) {
  // Ensure we await the app processing
  return app(req, res);
}
