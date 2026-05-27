import express from 'express';
import { getShowtimes, getShowtimeDetails, createShowtime, updateShowtime, deleteShowtime } from '../controllers/showtimeController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCreateShowtime } from '../middleware/validate.js';

const router = express.Router();

router.route('/')
  .get(getShowtimes)
  .post(protect, authorize('admin', 'staff'), validateCreateShowtime, createShowtime);

router.route('/:id')
  .get(getShowtimeDetails)
  .put(protect, authorize('admin', 'staff'), updateShowtime)
  .delete(protect, authorize('admin'), deleteShowtime);

export default router;
