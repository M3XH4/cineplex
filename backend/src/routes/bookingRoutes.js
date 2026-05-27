import express from 'express';
import { createBooking, confirmBookingPayment, getMyBookings, getAllBookings, verifyTicket, getBooking } from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateBookingSeats, validateConfirmBooking, validateCreateBooking } from '../middleware/validate.js';

const router = express.Router();

router.route('/')
  .post(protect, validateCreateBooking, validateBookingSeats, createBooking)
  .get(protect, authorize('admin', 'staff'), getAllBookings);

router.get('/my-bookings', protect, getMyBookings);
router.post('/verify', protect, authorize('admin', 'staff'), verifyTicket);
router.get('/:id', protect, getBooking);
router.post('/:id/confirm', protect, validateConfirmBooking, confirmBookingPayment);

export default router;
