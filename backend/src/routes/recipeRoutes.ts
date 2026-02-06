import { Router } from 'express';
import { generateRecipe, getHistory, getIngredients, searchIngredient, toggleFavorite, generateStory } from '../controllers/recipeController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/ingredients', getIngredients);
router.get('/ingredients/search', searchIngredient);
router.post('/recipe/generate', optionalAuthenticateToken, generateRecipe);
router.post('/recipe/generate-story', optionalAuthenticateToken, generateStory);
router.get('/history', authenticateToken, getHistory);
router.post('/recipe/:id/favorite', authenticateToken, toggleFavorite);

export default router;
