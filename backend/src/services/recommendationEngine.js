import Movie from '../models/Movie.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import axios from 'axios';
import logger from '../utils/logger.js';

// Get similar movies using TMDB API or fallback to content similarity (genre overlap)
export const getSimilarMovies = async (movie, limit = 10) => {
  const tmdbKey = process.env.TMDB_API_KEY;
  
  if (tmdbKey && movie.tmdbId) {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${movie.tmdbId}/recommendations?api_key=${tmdbKey}&language=en-US&page=1`
      );
      
      const tmdbIds = response.data.results.map(m => m.id);
      if (tmdbIds.length > 0) {
        // Find matching movies in our local database
        const localMovies = await Movie.find({ tmdbId: { $in: tmdbIds } }).limit(limit);
        if (localMovies.length > 0) {
          return localMovies;
        }
      }
    } catch (err) {
      logger.warn(`TMDB recommendations request failed: ${err.message}. Falling back to content-based local similarity.`);
    }
  }

  // Local fallback: Content-Based Similarity (genre overlap)
  try {
    const similar = await Movie.find({
      _id: { $ne: movie._id },
      genres: { $in: movie.genres },
      isShowing: true,
    })
      .sort({ rating: -1, popularity: -1 })
      .limit(limit);
    return similar;
  } catch (err) {
    logger.error('Error fetching similar movies locally:', err);
    return [];
  }
};

// Generates custom user recommendation scores
export const generateRecommendationsForUser = async (userId) => {
  try {
    const user = await User.findById(userId).populate('watchHistory.movie');
    if (!user) return [];

    const allMovies = await Movie.find({ isShowing: true });
    
    // 1. Extract user preferences
    const favoriteGenres = user.preferences?.favoriteGenres || [];
    const watchedMovieIds = user.watchHistory.map(h => h.movie?._id?.toString()).filter(Boolean);

    // Get list of movies booked by user
    const bookings = await Booking.find({ userId, status: 'paid' }).populate({
      path: 'showtimeId',
      populate: { path: 'movieId' }
    });
    const bookedMovieIds = bookings.map(b => b.showtimeId?.movieId?._id?.toString()).filter(Boolean);

    const excludedIds = new Set([...watchedMovieIds, ...bookedMovieIds]);

    const scoredMovies = [];

    for (const movie of allMovies) {
      // Don't recommend what they have already watched or booked
      if (excludedIds.has(movie._id.toString())) {
        continue;
      }

      let score = 0;

      // Rule A: Genre Match (Up to 50 points)
      if (favoriteGenres.length > 0) {
        const matchingGenres = movie.genres.filter(g => favoriteGenres.includes(g));
        const genreMatchRatio = matchingGenres.length / Math.max(favoriteGenres.length, 1);
        score += genreMatchRatio * 50;
      } else {
        // Boost showing if user has no favorite genres
        score += 15;
      }

      // Rule B: Average Rating (Up to 25 points)
      // rating is 0 to 10 -> map to 25 max
      score += (movie.rating / 10) * 25;

      // Rule C: Popularity Score (Up to 15 points)
      // Cap popularity scoring at 150 points for comparison
      const normalizedPop = Math.min(movie.popularity, 150) / 150;
      score += normalizedPop * 15;

      // Rule D: Recency Boost (Up to 10 points)
      const monthsSinceRelease = (new Date() - new Date(movie.releaseDate)) / (1000 * 60 * 60 * 24 * 30);
      if (monthsSinceRelease < 3) {
        score += 10; // Boost new releases
      } else if (monthsSinceRelease < 12) {
        score += 5;
      }

      scoredMovies.push({
        movieId: movie._id,
        score: Math.round(score),
      });
    }

    // Sort by recommendation score descending
    scoredMovies.sort((a, b) => b.score - a.score);

    return scoredMovies.slice(0, 15); // Return top 15 recommendations
  } catch (err) {
    logger.error('Error generating user recommendations:', err);
    return [];
  }
};
