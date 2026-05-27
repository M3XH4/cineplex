import express from 'express';
import { getCinemas, createCinema, getRooms, createRoom } from '../controllers/cinemaController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCreateCinema, validateCreateRoom } from '../middleware/validate.js';

const router = express.Router();

router.route('/')
  .get(getCinemas)
  .post(protect, authorize('admin'), validateCreateCinema, createCinema);

router.route('/:cinemaId/rooms')
  .get(getRooms)
  .post(protect, authorize('admin'), validateCreateRoom, createRoom);

export default router;
