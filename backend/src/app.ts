import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import recipeRoutes from './routes/recipeRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', recipeRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('AI Recipe Generator API is running');
});

export default app;
