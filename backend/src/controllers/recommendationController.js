import Movie from '../models/Movie.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Showtime from '../models/Showtime.js';
import { generateRecommendationsForUser, getSimilarMovies } from '../services/recommendationEngine.js';

// @desc    Get personalized top picks for user
// @route   GET /api/recommendations/top-picks
// @access  Private
export const getUserRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recommendations = await generateRecommendationsForUser(userId);

    if (recommendations.length === 0) {
      // Fallback: return popular movies
      const popular = await Movie.find({ isShowing: true })
        .sort({ popularity: -1, rating: -1 })
        .limit(10);
      return res.status(200).json({ success: true, isFallback: true, movies: popular });
    }

    // Populate recommendation details
    const movieIds = recommendations.map(r => r.movieId);
    const movies = await Movie.find({ _id: { $in: movieIds } });
    
    // Sort movies according to recommendation score rank
    const sortedMovies = movieIds.map(id => movies.find(m => m._id.toString() === id.toString())).filter(Boolean);

    res.status(200).json({ success: true, isFallback: false, movies: sortedMovies });
  } catch (error) {
    next(error);
  }
};

// @desc    Get "Because You Watched" row
// @route   GET /api/recommendations/because-you-watched
// @access  Private
export const getBecauseYouWatched = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find user's latest paid booking
    const latestBooking = await Booking.findOne({ userId, status: 'paid' })
      .populate({
        path: 'showtimeId',
        populate: { path: 'movieId' }
      })
      .sort({ createdAt: -1 });

    let sourceMovie = null;

    if (latestBooking && latestBooking.showtimeId && latestBooking.showtimeId.movieId) {
      sourceMovie = latestBooking.showtimeId.movieId;
    } else {
      // If no bookings, check latest movie in watch history
      const user = await User.findById(userId).populate('watchHistory.movie');
      if (user && user.watchHistory.length > 0) {
        // Get last item
        const historyItem = user.watchHistory[user.watchHistory.length - 1];
        if (historyItem && historyItem.movie) {
          sourceMovie = historyItem.movie;
        }
      }
    }

    if (!sourceMovie) {
      // Default: no history, return empty or top rated movie recommendations
      const topMovie = await Movie.findOne({ isShowing: true }).sort({ rating: -1, popularity: -1 });
      if (topMovie) {
        const similar = await getSimilarMovies(topMovie, 10);
        return res.status(200).json({
          success: true,
          sourceMovie: topMovie,
          movies: similar,
        });
      }
      return res.status(200).json({ success: true, sourceMovie: null, movies: [] });
    }

    const similar = await getSimilarMovies(sourceMovie, 10);

    res.status(200).json({
      success: true,
      sourceMovie: {
        id: sourceMovie._id,
        title: sourceMovie.title,
      },
      movies: similar,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending movies near you (popular bookings)
// @route   GET /api/recommendations/trending-near-you
// @access  Public
export const getTrendingNearYou = async (req, res, next) => {
  try {
    // Aggregate bookings by showtime->movie to find top booked movies
    const bookings = await Booking.aggregate([
      { $match: { status: 'paid' } },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtimeId',
          foreignField: '_id',
          as: 'showtime',
        },
      },
      { $unwind: '$showtime' },
      {
        $group: {
          _id: '$showtime.movieId',
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
    ]);

    let trendingMovies = [];

    if (bookings.length > 0) {
      const movieIds = bookings.map(b => b._id);
      const movies = await Movie.find({ _id: { $in: movieIds } });
      // Map according to booking count sort order
      trendingMovies = movieIds.map(id => movies.find(m => m._id.toString() === id.toString())).filter(Boolean);
    }

    // If no bookings yet, return highest popularity movies
    if (trendingMovies.length === 0) {
      trendingMovies = await Movie.find({ isShowing: true })
        .sort({ popularity: -1 })
        .limit(10);
    }

    res.status(200).json({ success: true, movies: trendingMovies });
  } catch (error) {
    next(error);
  }
};

// @desc    Get similar movies for detail page
// @route   GET /api/recommendations/similar/:movieId
// @access  Public
export const getSimilar = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const similar = await getSimilarMovies(movie, 10);
    res.status(200).json({ success: true, movies: similar });
  } catch (error) {
    next(error);
  }
};
