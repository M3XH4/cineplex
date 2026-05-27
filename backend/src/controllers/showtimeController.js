import Showtime from '../models/Showtime.js';
import Room from '../models/Room.js';
import Cinema from '../models/Cinema.js';
import Movie from '../models/Movie.js';
import logger from '../utils/logger.js';

// Helper to check for showtime scheduling overlaps in the same room
const checkScheduleOverlap = async (roomId, startTime, endTime, excludeShowtimeId = null) => {
  const query = {
    roomId,
    $or: [
      {
        startTime: { $lt: new Date(endTime) },
        endTime: { $gt: new Date(startTime) },
      },
    ],
  };

  if (excludeShowtimeId) {
    query._id = { $ne: excludeShowtimeId };
  }

  const overlappingShowtime = await Showtime.findOne(query);
  return overlappingShowtime;
};

// @desc    Get all showtimes (filters: movieId, cinemaId, date)
// @route   GET /api/showtimes
// @access  Public
export const getShowtimes = async (req, res, next) => {
  try {
    const { movieId, cinemaId, date } = req.query;
    const query = {};

    if (movieId) {
      query.movieId = movieId;
    }

    if (cinemaId) {
      query.cinemaId = cinemaId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.startTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // By default return showtimes from today onwards
      const today = new Date();
      today.setHours(0,0,0,0);
      query.startTime = { $gte: today };
    }

    const showtimes = await Showtime.find(query)
      .populate('movieId', 'title posterUrl duration genres rating')
      .populate('roomId', 'name seats rowsCount colsCount')
      .populate('cinemaId', 'name location')
      .sort({ startTime: 1 });

    res.status(200).json({ success: true, count: showtimes.length, showtimes });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single showtime detail
// @route   GET /api/showtimes/:id
// @access  Public
export const getShowtimeDetails = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movieId', 'title posterUrl duration genres storyline rating director cast backdropUrl')
      .populate('roomId', 'name seats rowsCount colsCount')
      .populate('cinemaId', 'name location imageUrl');

    if (!showtime) {
      return res.status(404).json({ success: false, message: 'Showtime not found' });
    }

    res.status(200).json({ success: true, showtime });
  } catch (error) {
    next(error);
  }
};

// @desc    Create showtime (Admin/Staff only)
// @route   POST /api/showtimes
// @access  Private/Admin
export const createShowtime = async (req, res, next) => {
  try {
    const { movieId, roomId, startTime, basePrice } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Calculate endTime using movie duration + 30 minutes clean-up break time
    const start = new Date(startTime);
    const durationMs = (movie.duration + 30) * 60 * 1000;
    const end = new Date(start.getTime() + durationMs);

    // Validate no schedule conflict in this room
    const overlap = await checkScheduleOverlap(roomId, start, end);
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: `Scheduling conflict! The room is already occupied from ${new Date(overlap.startTime).toLocaleTimeString()} to ${new Date(overlap.endTime).toLocaleTimeString()} by another showtime.`,
      });
    }

    const showtime = await Showtime.create({
      movieId,
      roomId,
      cinemaId: room.cinemaId,
      startTime: start,
      endTime: end,
      basePrice,
      bookedSeats: [],
    });

    logger.info(`Showtime created: Room ${room.name}, Movie ${movie.title}, Start ${start}`);
    res.status(201).json({ success: true, showtime });
  } catch (error) {
    next(error);
  }
};

// @desc    Update showtime (Admin/Staff only)
// @route   PUT /api/showtimes/:id
// @access  Private/Admin
export const updateShowtime = async (req, res, next) => {
  try {
    const { movieId, roomId, startTime, basePrice } = req.body;
    let showtime = await Showtime.findById(req.params.id);
    if (!showtime) {
      return res.status(404).json({ success: false, message: 'Showtime not found' });
    }

    const mId = movieId || showtime.movieId;
    const rId = roomId || showtime.roomId;
    const sTime = startTime ? new Date(startTime) : showtime.startTime;

    const movie = await Movie.findById(mId);
    const room = await Room.findById(rId);

    if (!movie || !room) {
      return res.status(400).json({ success: false, message: 'Invalid Movie or Room reference' });
    }

    const durationMs = (movie.duration + 30) * 60 * 1000;
    const eTime = new Date(sTime.getTime() + durationMs);

    // Validate no overlap
    const overlap = await checkScheduleOverlap(rId, sTime, eTime, showtime._id);
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: `Scheduling conflict! Overlaps with Showtime ID ${overlap._id} (${new Date(overlap.startTime).toLocaleTimeString()} - ${new Date(overlap.endTime).toLocaleTimeString()})`,
      });
    }

    showtime = await Showtime.findByIdAndUpdate(
      req.params.id,
      {
        movieId: mId,
        roomId: rId,
        cinemaId: room.cinemaId,
        startTime: sTime,
        endTime: eTime,
        basePrice: basePrice || showtime.basePrice,
      },
      { new: true }
    );

    logger.info(`Showtime ID ${showtime._id} updated.`);
    res.status(200).json({ success: true, showtime });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete showtime (Admin only)
// @route   DELETE /api/showtimes/:id
// @access  Private/Admin
export const deleteShowtime = async (req, res, next) => {
  try {
    const showtime = await Showtime.findById(req.params.id);
    if (!showtime) {
      return res.status(404).json({ success: false, message: 'Showtime not found' });
    }

    await Showtime.findByIdAndDelete(req.params.id);
    logger.info(`Showtime ID ${req.params.id} deleted.`);
    res.status(200).json({ success: true, message: 'Showtime removed successfully' });
  } catch (error) {
    next(error);
  }
};
