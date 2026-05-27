import Review from '../models/Review.js';
import Movie from '../models/Movie.js';
import logger from '../utils/logger.js';

// Helper to recalculate average rating for a movie
const updateMovieAverageRating = async (movieId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { movieId } },
      {
        $group: {
          _id: '$movieId',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Movie.findByIdAndUpdate(movieId, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        ratingCount: stats[0].totalRatings,
      });
    } else {
      await Movie.findByIdAndUpdate(movieId, {
        rating: 0,
        ratingCount: 0,
      });
    }
  } catch (err) {
    logger.error(`Error updating movie rating stats for ${movieId}:`, err);
  }
};

// @desc    Add a review for a movie
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const { movieId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!movieId || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide movieId, rating, and comment' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    // Check if user already reviewed this movie
    const existingReview = await Review.findOne({ userId, movieId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this movie' });
    }

    const review = await Review.create({
      userId,
      movieId,
      rating: parseInt(rating),
      comment,
    });

    await updateMovieAverageRating(movieId);

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a movie
// @route   GET /api/reviews/movie/:movieId
// @access  Public
export const getMovieReviews = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    
    const reviews = await Review.find({ movieId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });

    // Calculate rating distribution for UI chart
    const distribution = { 10:0, 9:0, 8:0, 7:0, 6:0, 5:0, 4:0, 3:0, 2:0, 1:0 };
    reviews.forEach(r => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      distribution,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a review
// @route   PUT /api/reviews/:id/like
// @access  Private
export const likeReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const userId = req.user.id;
    const isLiked = review.likes.includes(userId);

    if (isLiked) {
      // Unlike
      review.likes = review.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      review.likes.push(userId);
    }

    await review.save();
    res.status(200).json({ success: true, likesCount: review.likes.length, isLiked: !isLiked });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a review
// @route   PUT /api/reviews/:id/report
// @access  Private
export const reportReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const userId = req.user.id;
    if (!review.reports.includes(userId)) {
      review.reports.push(userId);
      await review.save();
    }

    res.status(200).json({ success: true, message: 'Review reported successfully' });
  } catch (error) {
    next(error);
  }
};
