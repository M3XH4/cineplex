import express from 'express';
import { processPayment, refundPayment } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/checkout', protect, processPayment);
router.post('/refund/:bookingId', protect, authorize('admin'), refundPayment);

export default router;
