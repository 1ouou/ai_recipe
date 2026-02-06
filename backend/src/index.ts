import dotenv from 'dotenv';
import { initDB } from './config/db';
import { seedIngredients } from './controllers/recipeController';
import app from './app';

dotenv.config();

const port = process.env.PORT || 3000;

// Start Server
const startServer = async () => {
  await initDB();
  // Only seed ingredients in development or if explicitly requested
  if (process.env.NODE_ENV !== 'production') {
      await seedIngredients();
  }
  
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer();
