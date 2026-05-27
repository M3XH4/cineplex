import mongoose from 'mongoose';

const bookedSeatSchema = new mongoose.Schema({
  seatLabel: {
    type: String, // e.g. "A-1"
    required: true,
  },
  status: {
    type: String,
    enum: ['locked', 'booked'],
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date, // For locked seats, expires after 5 mins
  },
});

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    cinemaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cinema',
      required: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Please provide start time'],
    },
    endTime: {
      type: Date,
      required: [true, 'Please provide end time'],
    },
    basePrice: {
      type: Number,
      required: [true, 'Please provide base ticket price'],
      default: 250, // Default in PHP/Credits/Currency e.g. 250 PHP / $10
    },
    bookedSeats: [bookedSeatSchema],
  },
  {
    timestamps: true,
  }
);

// Index to quickly search schedules and prevent overlaps
showtimeSchema.index({ roomId: 1, startTime: 1, endTime: 1 });

const Showtime = mongoose.model('Showtime', showtimeSchema);
export default Showtime;
