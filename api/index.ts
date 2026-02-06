import app from '../backend/src/app';
import dotenv from 'dotenv';

dotenv.config();

// Export the app for Vercel Serverless Function
export default app;
