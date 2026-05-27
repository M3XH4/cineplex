import Booking from '../models/Booking.js';
import Showtime from '../models/Showtime.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import QRCode from 'qrcode';
import logger from '../utils/logger.js';
import { getIO } from '../config/socket.js';

// @desc    Create a pending booking (seat check-out phase)
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res, next) => {
  try {
    const { showtimeId, seatLabels } = req.body;
    const userId = req.user.id;

    if (!showtimeId || !seatLabels || !Array.isArray(seatLabels) || seatLabels.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide showtimeId and seatLabels' });
    }

    const showtime = await Showtime.findById(showtimeId).populate('roomId');
    if (!showtime) {
      return res.status(404).json({ success: false, message: 'Showtime not found' });
    }

    // Verify seats exist and calculate dynamic price
    const room = showtime.roomId;
    let totalPrice = 0;
    
    for (const label of seatLabels) {
      // label format e.g. "C-4" -> row "C", col 4
      const [rowStr, colStr] = label.split('-');
      const colNum = parseInt(colStr);
      
      const seatLayout = room.seats.find(s => s.row === rowStr && s.col === colNum);
      if (!seatLayout) {
        return res.status(400).json({ success: false, message: `Seat ${label} does not exist in this room` });
      }

      // Check if seat is already booked or locked by another user
      const bookedState = showtime.bookedSeats.find(s => s.seatLabel === label);
      if (bookedState) {
        if (bookedState.status === 'booked') {
          return res.status(400).json({ success: false, message: `Seat ${label} is already booked` });
        }
        if (bookedState.status === 'locked' && bookedState.userId.toString() !== userId) {
          return res.status(400).json({ success: false, message: `Seat ${label} is temporarily locked by another customer` });
        }
      }

      // Base price * modifier
      totalPrice += showtime.basePrice * seatLayout.priceModifier;
    }

    // Create a 5-minute checkout countdown
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save pending booking
    const booking = await Booking.create({
      userId,
      showtimeId,
      seatLabels,
      totalPrice,
      status: 'pending',
      expiresAt,
    });

    // Update Showtime locked seats list
    seatLabels.forEach(label => {
      // Remove any prior dynamic locks for this seat-user pair
      showtime.bookedSeats = showtime.bookedSeats.filter(
        s => !(s.seatLabel === label && s.userId.toString() === userId)
      );

      showtime.bookedSeats.push({
        seatLabel: label,
        status: 'locked',
        userId,
        expiresAt,
      });
    });

    await showtime.save();

    // Broadcast seat status update to Socket.IO room
    const io = getIO();
    io.to(showtimeId.toString()).emit('seats-locked', {
      seats: seatLabels,
      userId,
      expiresAt
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm booking payment and generate QR code
// @route   POST /api/bookings/:id/confirm
// @access  Private
export const confirmBookingPayment = async (req, res, next) => {
  try {
    const { paymentMethod, paymentId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    if (booking.status === 'expired') {
      return res.status(400).json({ success: false, message: 'Booking checkout timer has expired' });
    }

    const showtime = await Showtime.findById(booking.showtimeId);
    if (!showtime) {
      return res.status(404).json({ success: false, message: 'Showtime not found' });
    }

    // Generate unique QR verification payload (Base64 QR representation)
    const qrPayload = JSON.stringify({
      bookingId: booking._id,
      userId: booking.userId,
      seats: booking.seatLabels,
      showtimeId: booking.showtimeId,
    });
    const qrCodeImage = await QRCode.toDataURL(qrPayload);

    // Confirm booking
    booking.status = 'paid';
    booking.paymentMethod = paymentMethod || 'Mock';
    booking.paymentId = paymentId || `pay_${Math.random().toString(36).substring(2, 10)}`;
    booking.qrCode = qrCodeImage;
    await booking.save();

    // Update Showtime seat states from 'locked' to 'booked' (and clear expiration)
    booking.seatLabels.forEach(label => {
      const seat = showtime.bookedSeats.find(s => s.seatLabel === label && s.userId.toString() === booking.userId.toString());
      if (seat) {
        seat.status = 'booked';
        seat.expiresAt = undefined;
      } else {
        // Fallback if lock expired but user still managed to complete checkout within grace interval
        showtime.bookedSeats.push({
          seatLabel: label,
          status: 'booked',
          userId: booking.userId,
        });
      }
    });

    await showtime.save();

    // Broadcast permanent bookings to socket room
    const io = getIO();
    io.to(showtime._id.toString()).emit('seats-booked', {
      seats: booking.seatLabels,
      userId: booking.userId,
    });

    // Save in-app notification
    await Notification.create({
      userId: booking.userId,
      title: 'Booking Confirmed! 🍿',
      message: `Your booking for ${booking.seatLabels.join(', ')} is confirmed. Show your QR code at the entrance.`,
      category: 'booking',
    });

    // Update user preferences with genres of this movie (for future recommendations!)
    try {
      const populatedShowtime = await showtime.populate('movieId');
      const movie = populatedShowtime.movieId;
      if (movie && movie.genres) {
        const user = await User.findById(booking.userId);
        if (user) {
          // Push new genres, filtering duplicates
          const currentGenres = user.preferences.favoriteGenres || [];
          const updatedGenres = Array.from(new Set([...currentGenres, ...movie.genres]));
          user.preferences.favoriteGenres = updatedGenres;
          
          // Push to watch history
          user.watchHistory.push({ movie: movie._id });
          await user.save();
        }
      }
    } catch (prefErr) {
      logger.error('Failed to update user preferences after booking:', prefErr);
    }

    logger.info(`Booking ID ${booking._id} confirmed and paid.`);
    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's booking history
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration backdropUrl' },
          { path: 'roomId', select: 'name' },
          { path: 'cinemaId', select: 'name location' },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single current-user booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration backdropUrl' },
          { path: 'roomId', select: 'name' },
          { path: 'cinemaId', select: 'name location' },
        ],
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isOwner = booking.userId.toString() === req.user.id;
    const canManage = ['admin', 'staff'].includes(req.user.role);
    if (!isOwner && !canManage) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings (Admin/Staff only)
// @route   GET /api/bookings
// @access  Private/Staff
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title' },
          { path: 'roomId', select: 'name' },
          { path: 'cinemaId', select: 'name location' },
        ],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify QR Code Ticket (Staff only)
// @route   POST /api/bookings/verify
// @access  Private/Staff
export const verifyTicket = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email')
      .populate({
        path: 'showtimeId',
        populate: [
          { path: 'movieId', select: 'title duration' },
          { path: 'roomId', select: 'name' },
          { path: 'cinemaId', select: 'name' },
        ],
      });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Ticket invalid: Booking not found' });
    }

    if (booking.status !== 'paid') {
      return res.status(400).json({ success: false, message: `Ticket invalid: Booking status is '${booking.status}'` });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket successfully verified! Enjoy your movie! 🎫',
      ticketDetails: {
        bookingId: booking._id,
        customerName: booking.userId.name,
        movieTitle: booking.showtimeId.movieId.title,
        cinema: booking.showtimeId.cinemaId.name,
        room: booking.showtimeId.roomId.name,
        seats: booking.seatLabels,
        startTime: booking.showtimeId.startTime,
      },
    });
  } catch (error) {
    next(error);
  }
};
