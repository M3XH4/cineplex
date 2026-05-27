import express from 'express';
import { createReview, getMovieReviews, likeReview, reportReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/movie/:movieId', getMovieReviews);
router.put('/:id/like', protect, likeReview);
router.put('/:id/report', protect, reportReview);

export default router;
