import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Showtime from '../models/Showtime.js';
import Room from '../models/Room.js';
import Movie from '../models/Movie.js';

// @desc    Get Admin dashboard overview statistics
// @route   GET /api/analytics/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total revenue
    const revenueData = await Booking.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // 2. Active bookings count
    const totalBookings = await Booking.countDocuments({ status: 'paid' });

    // 3. User customer base count
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // 4. Calculate average seat occupancy rate
    // Occupancy = total booked seats / total capacity of showtimes
    const showtimes = await Showtime.find().populate('roomId');
    
    let totalCapacity = 0;
    let totalBookedSeats = 0;

    showtimes.forEach(s => {
      if (s.roomId) {
        totalCapacity += s.roomId.seats.length;
        const booked = s.bookedSeats.filter(seat => seat.status === 'booked').length;
        totalBookedSeats += booked;
      }
    });

    const averageOccupancy = totalCapacity > 0 ? Math.round((totalBookedSeats / totalCapacity) * 100) : 0;

    // 5. Popular movies (top bookings count)
    const popularMoviesData = await Booking.aggregate([
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
          ticketsSold: { $sum: { $size: '$seatLabels' } },
          bookingsCount: { $sum: 1 },
        },
      },
      { $sort: { ticketsSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'movies',
          localField: '_id',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
      {
        $project: {
          _id: 1,
          title: '$movie.title',
          posterUrl: '$movie.posterUrl',
          ticketsSold: 1,
          bookingsCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalBookings,
        totalCustomers,
        averageOccupancy,
        popularMovies: popularMoviesData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales distribution chart data (last 7 days)
// @route   GET /api/analytics/sales-chart
// @access  Private/Admin
export const getSalesChart = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sales = await Booking.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          bookingsCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with zero values to keep chart smooth
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayRecord = sales.find(s => s._id === dateStr);
      chartData.push({
        date: dateStr,
        revenue: dayRecord ? dayRecord.revenue : 0,
        bookings: dayRecord ? dayRecord.bookingsCount : 0,
      });
    }

    res.status(200).json({ success: true, chartData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user growth chart details
// @route   GET /api/analytics/users-chart
// @access  Private/Admin
export const getUserGrowthChart = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const users = await User.aggregate([
      {
        $match: {
          role: 'customer',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ success: true, growth: users });
  } catch (error) {
    next(error);
  }
};
