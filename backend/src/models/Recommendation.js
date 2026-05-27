import mongoose from 'mongoose';

const recommendationItemSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
});

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    recommendations: [recommendationItemSchema],
  },
  {
    timestamps: true,
  }
);

const Recommendation = mongoose.model('Recommendation', recommendationSchema);
export default Recommendation;
