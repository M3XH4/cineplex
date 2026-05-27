import express from 'express';
import { getUserRecommendations, getBecauseYouWatched, getTrendingNearYou, getSimilar } from '../controllers/recommendationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/top-picks', protect, getUserRecommendations);
router.get('/because-you-watched', protect, getBecauseYouWatched);
router.get('/trending-near-you', getTrendingNearYou);
router.get('/similar/:movieId', getSimilar);

export default router;
