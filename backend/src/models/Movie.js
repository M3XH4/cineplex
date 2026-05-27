import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a movie title'],
      trim: true,
      index: true,
    },
    tmdbId: {
      type: Number,
      unique: true,
      sparse: true, // Allows null/missing tmdbId for custom admin added movies
    },
    storyline: {
      type: String,
      required: [true, 'Please provide a storyline'],
    },
    cast: [{ type: String }],
    director: {
      type: String,
      required: [true, 'Please provide a director'],
    },
    duration: {
      type: Number, // In minutes
      required: [true, 'Please provide a movie duration in minutes'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Please provide the release date'],
    },
    posterUrl: {
      type: String,
      default: '',
    },
    backdropUrl: {
      type: String,
      default: '',
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    genres: [{ type: String, index: true }],
    rating: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 10,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      default: 'en',
    },
    isShowing: {
      type: Boolean,
      default: true,
      index: true,
    },
    isUpcoming: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes
movieSchema.index({ title: 'text', storyline: 'text', director: 'text' });

const Movie = mongoose.model('Movie', movieSchema);
export default Movie;
