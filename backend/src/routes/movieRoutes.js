import express from 'express';
import { getMovies, getMovie, createMovie, updateMovie, deleteMovie, getTrendingSearches } from '../controllers/movieController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCreateMovie } from '../middleware/validate.js';

const router = express.Router();

router.route('/')
  .get(getMovies)
  .post(protect, authorize('admin', 'staff'), validateCreateMovie, createMovie);

router.get('/suggestions/trending', getTrendingSearches);

router.route('/:id')
  .get(getMovie)
  .put(protect, authorize('admin', 'staff'), updateMovie)
  .delete(protect, authorize('admin'), deleteMovie);

export default router;
