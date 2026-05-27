import express from 'express';
import { getDashboardStats, getSalesChart, getUserGrowthChart } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // Restrict entire analytics router to admin role

router.get('/stats', getDashboardStats);
router.get('/sales', getSalesChart);
router.get('/users', getUserGrowthChart);

export default router;
