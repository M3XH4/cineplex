import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';

// @desc    Process Checkout Mock Payment
// @route   POST /api/payments/checkout
// @access  Private
export const processPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod, cardDetails } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking already paid' });
    }

    // Verify booking isn't expired
    if (new Date() > booking.expiresAt) {
      booking.status = 'expired';
      await booking.save();
      return res.status(400).json({ success: false, message: 'Payment failed: Booking reservation has expired' });
    }

    // Payment simulation validation rules
    if (paymentMethod === 'Stripe' && cardDetails) {
      const { number, cvc } = cardDetails;
      if (!number || number.length < 12 || !cvc || cvc.length < 3) {
        return res.status(400).json({ success: false, message: 'Payment declined: Invalid card details' });
      }
    }

    // Simulate success response
    const mockTxId = `${paymentMethod.toUpperCase()}_TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    logger.info(`Simulated checkout via ${paymentMethod} success. TransID: ${mockTxId}`);

    res.status(200).json({
      success: true,
      message: 'Payment authorized and processed successfully',
      transaction: {
        id: mockTxId,
        amount: booking.totalPrice,
        method: paymentMethod,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Refunds
// @route   POST /api/payments/refund/:bookingId
// @access  Private/Admin
export const refundPayment = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Cannot refund unpaid booking' });
    }

    // Refund logic
    booking.status = 'cancelled';
    await booking.save();

    logger.info(`Booking ID ${booking._id} refunded and status marked cancelled.`);

    res.status(200).json({
      success: true,
      message: 'Refund successfully initiated. Funds will return to original payment method.',
    });
  } catch (error) {
    next(error);
  }
};
