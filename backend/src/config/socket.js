import { Server } from 'socket.io';
import Showtime from '../models/Showtime.js';
import logger from '../utils/logger.js';
import { isAllowedOrigin } from '../utils/origin.js';

let ioInstance = null;

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join showtime screening room
    socket.on('join-showtime', async ({ showtimeId }) => {
      socket.join(showtimeId);
      logger.info(`Socket ${socket.id} joined showtime room: ${showtimeId}`);
      
      // Send current seat statuses to the newly joined client
      try {
        const showtime = await Showtime.findById(showtimeId);
        if (showtime) {
          socket.emit('seat-sync', { bookedSeats: showtime.bookedSeats });
        }
      } catch (err) {
        logger.error('Error syncing seats on join:', err);
      }
    });

    // Leave showtime room
    socket.on('leave-showtime', ({ showtimeId }) => {
      socket.leave(showtimeId);
      logger.info(`Socket ${socket.id} left showtime room: ${showtimeId}`);
    });

    // Request lock seat (select seat)
    socket.on('lock-seat', async ({ showtimeId, seatLabel, userId }) => {
      try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) {
          return socket.emit('error-msg', { message: 'Showtime not found' });
        }

        // Check if seat is already booked or locked by someone else
        const existing = showtime.bookedSeats.find(s => s.seatLabel === seatLabel);
        if (existing) {
          if (existing.status === 'booked') {
            return socket.emit('error-msg', { message: 'Seat is already booked' });
          }
          if (existing.status === 'locked' && existing.userId.toString() !== userId) {
            return socket.emit('error-msg', { message: 'Seat is temporarily locked by another user' });
          }
        }

        // Lock the seat in Showtime (5 minutes expiration)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        // Remove prior temporary lock if exists to reset timer
        showtime.bookedSeats = showtime.bookedSeats.filter(
          s => !(s.seatLabel === seatLabel && s.userId.toString() === userId)
        );

        showtime.bookedSeats.push({
          seatLabel,
          status: 'locked',
          userId,
          expiresAt,
        });

        await showtime.save();

        // Broadcast the lock to everyone in the showtime room
        io.to(showtimeId).emit('seat-locked', { seatLabel, userId, expiresAt });
        logger.info(`Seat ${seatLabel} locked for user ${userId} in showtime ${showtimeId}`);
      } catch (err) {
        logger.error('Error locking seat:', err);
        socket.emit('error-msg', { message: 'Failed to lock seat' });
      }
    });

    // Request unlock seat (unselect seat)
    socket.on('unlock-seat', async ({ showtimeId, seatLabel, userId }) => {
      try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) return;

        // Remove only locked seats by this user
        const originalLength = showtime.bookedSeats.length;
        showtime.bookedSeats = showtime.bookedSeats.filter(
          s => !(s.seatLabel === seatLabel && s.status === 'locked' && s.userId.toString() === userId)
        );

        if (showtime.bookedSeats.length !== originalLength) {
          await showtime.save();
          // Broadcast unlock
          io.to(showtimeId).emit('seat-unlocked', { seatLabel });
          logger.info(`Seat ${seatLabel} unlocked by user ${userId} in showtime ${showtimeId}`);
        }
      } catch (err) {
        logger.error('Error unlocking seat:', err);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Start periodic lock cleaner (runs every 15 seconds)
  setInterval(async () => {
    try {
      const now = new Date();
      // Find showtimes that have expired locks
      const showtimes = await Showtime.find({
        'bookedSeats.status': 'locked',
        'bookedSeats.expiresAt': { $lt: now }
      });

      for (const showtime of showtimes) {
        const expiredSeats = showtime.bookedSeats.filter(
          s => s.status === 'locked' && s.expiresAt < now
        );

        if (expiredSeats.length > 0) {
          // Remove expired locks
          showtime.bookedSeats = showtime.bookedSeats.filter(
            s => !(s.status === 'locked' && s.expiresAt < now)
          );
          await showtime.save();

          // Broadcast releases to the specific room
          expiredSeats.forEach(s => {
            io.to(showtime.id).emit('seat-unlocked', { seatLabel: s.seatLabel });
            logger.info(`Expired seat ${s.seatLabel} released in showtime ${showtime.id}`);
          });
        }
      }
    } catch (err) {
      logger.error('Error in seat lock cleaner interval:', err);
    }
  }, 15000);

  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized!');
  }
  return ioInstance;
};
