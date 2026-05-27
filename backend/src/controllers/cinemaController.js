import Cinema from '../models/Cinema.js';
import Room from '../models/Room.js';
import logger from '../utils/logger.js';

// @desc    Get all cinema locations
// @route   GET /api/cinemas
// @access  Public
export const getCinemas = async (req, res, next) => {
  try {
    const cinemas = await Cinema.find();
    res.status(200).json({ success: true, count: cinemas.length, cinemas });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a cinema branch (Admin only)
// @route   POST /api/cinemas
// @access  Private/Admin
export const createCinema = async (req, res, next) => {
  try {
    const cinema = await Cinema.create(req.body);
    logger.info(`Cinema branch created: ${cinema.name}`);
    res.status(201).json({ success: true, cinema });
  } catch (error) {
    next(error);
  }
};

// @desc    Get rooms inside a cinema branch
// @route   GET /api/cinemas/:cinemaId/rooms
// @access  Public
export const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find({ cinemaId: req.params.cinemaId });
    res.status(200).json({ success: true, count: rooms.length, rooms });
  } catch (error) {
    next(error);
  }
};

// @desc    Create screening room in cinema branch (Admin only)
// @route   POST /api/cinemas/:cinemaId/rooms
// @access  Private/Admin
export const createRoom = async (req, res, next) => {
  try {
    const { name, rowsCount, colsCount } = req.body;
    const cinemaId = req.params.cinemaId;

    const cinema = await Cinema.findById(cinemaId);
    if (!cinema) {
      return res.status(404).json({ success: false, message: 'Cinema not found' });
    }

    const room = await Room.create({
      cinemaId,
      name,
      rowsCount,
      colsCount,
      seats: [], // Pre-save hook builds these automatically
    });

    logger.info(`Screening Room ${room.name} created under cinema ${cinema.name}`);
    res.status(201).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};
