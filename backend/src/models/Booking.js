import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    showtimeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true,
      index: true,
    },
    seatLabels: {
      type: [String],
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Stripe', 'PayPal', 'GCash', 'Maya', 'Mock'],
      default: 'Mock',
    },
    paymentId: {
      type: String,
    },
    qrCode: {
      type: String, // String representation of the booking validation code
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
