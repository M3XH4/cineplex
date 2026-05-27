import mongoose from 'mongoose';

const seatConfigSchema = new mongoose.Schema({
  row: { type: String, required: true }, // e.g. "A"
  col: { type: Number, required: true }, // e.g. 1
  category: {
    type: String,
    enum: ['Standard', 'VIP', 'Couple'],
    default: 'Standard',
  },
  priceModifier: {
    type: Number,
    default: 1.0, // Standard = 1.0, VIP = 1.5, Couple = 2.0 (relative to showtime price)
  },
});

const roomSchema = new mongoose.Schema(
  {
    cinemaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cinema',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a room name'],
      trim: true,
    },
    rowsCount: {
      type: Number,
      required: true,
      default: 8, // A to H
    },
    colsCount: {
      type: Number,
      required: true,
      default: 10, // 1 to 10
    },
    seats: [seatConfigSchema], // Static list of seats with their category
  },
  {
    timestamps: true,
  }
);

// Auto generate seat config list before saving if not provided
roomSchema.pre('save', function (next) {
  if (this.seats && this.seats.length > 0) {
    return next();
  }

  const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const generatedSeats = [];

  for (let r = 0; r < this.rowsCount; r++) {
    const rowLetter = rows[r];
    for (let c = 1; c <= this.colsCount; c++) {
      let category = 'Standard';
      let priceModifier = 1.0;

      // Make back rows VIP/Couple
      if (r >= this.rowsCount - 3 && r < this.rowsCount - 1) {
        category = 'VIP';
        priceModifier = 1.4;
      } else if (r === this.rowsCount - 1) {
        category = 'Couple';
        priceModifier = 1.8;
      }

      generatedSeats.push({
        row: rowLetter,
        col: c,
        category,
        priceModifier,
      });
    }
  }

  this.seats = generatedSeats;
  next();
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
