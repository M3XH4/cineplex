import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 10'],
      min: 1,
      max: 10,
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index so a user can review a movie only once
reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
