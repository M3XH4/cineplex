import Movie from '../models/Movie.js';
import logger from '../utils/logger.js';

// @desc    Get all movies (with search, pagination, and filter queries)
// @route   GET /api/movies
// @access  Public
export const getMovies = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      genre, 
      language, 
      rating, 
      year, 
      type // 'showing' or 'upcoming'
    } = req.query;

    const query = {};

    // Filters
    if (type === 'showing') {
      query.isShowing = true;
    } else if (type === 'upcoming') {
      query.isUpcoming = true;
    }

    if (genre) {
      query.genres = { $in: [new RegExp(`^${genre}$`, 'i')] };
    }

    if (language) {
      query.language = new RegExp(`^${language}$`, 'i');
    }

    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31`);
      query.releaseDate = { $gte: start, $lte: end };
    }

    // Search query using text index or regex
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } },
        { cast: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const skipIndex = (options.page - 1) * options.limit;

    const movies = await Movie.find(query)
      .sort({ popularity: -1, releaseDate: -1 })
      .skip(skipIndex)
      .limit(options.limit);

    const total = await Movie.countDocuments(query);

    res.status(200).json({
      success: true,
      count: movies.length,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total,
      movies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single movie details
// @route   GET /api/movies/:id
// @access  Public
export const getMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.status(200).json({ success: true, movie });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a movie (Admin/Staff only)
// @route   POST /api/movies
// @access  Private/Admin
export const createMovie = async (req, res, next) => {
  try {
    const movieData = req.body;
    
    // Check if tmdbId already exists
    if (movieData.tmdbId) {
      const existing = await Movie.findOne({ tmdbId: movieData.tmdbId });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Movie with this TMDB ID already exists', movie: existing });
      }
    }

    const movie = await Movie.create(movieData);
    logger.info(`Movie created by admin: ${movie.title}`);
    res.status(201).json({ success: true, movie });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a movie (Admin/Staff only)
// @route   PUT /api/movies/:id
// @access  Private/Admin
export const updateMovie = async (req, res, next) => {
  try {
    let movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    logger.info(`Movie updated by admin: ${movie.title}`);
    res.status(200).json({ success: true, movie });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a movie (Admin only)
// @route   DELETE /api/movies/:id
// @access  Private/Admin
export const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    await Movie.findByIdAndDelete(req.params.id);
    logger.info(`Movie deleted: ${movie.title}`);
    res.status(200).json({ success: true, message: 'Movie removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending searches / search suggestions
// @route   GET /api/movies/suggestions/trending
// @access  Public
export const getTrendingSearches = async (req, res, next) => {
  try {
    // Return standard top searched terms/movies as mock trending list
    const trending = await Movie.find()
      .sort({ popularity: -1 })
      .limit(6)
      .select('title posterUrl rating');
      
    const searchTerms = [
      'Interstellar', 'Sci-Fi', 'Christopher Nolan', 'Action 2026', 'Avengers', 'IMAX Experience'
    ];

    res.status(200).json({ success: true, searchTerms, popularMovies: trending });
  } catch (error) {
    next(error);
  }
};
