import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Cinema from '../models/Cinema.js';
import Room from '../models/Room.js';
import Showtime from '../models/Showtime.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Recommendation from '../models/Recommendation.js';
import QRCode from 'qrcode';
import logger from './logger.js';


dotenv.config();

const moviesData = [
  {
    title: "Interstellar",
    storyline: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    director: "Christopher Nolan",
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    duration: 169,
    releaseDate: new Date("2014-11-07"),
    posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&h=900&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&h=600&q=80",
    trailerUrl: "https://www.youtube.com/embed/zSWdZVtXT7E",
    genres: ["Sci-Fi", "Drama", "Adventure"],
    rating: 8.7,
    popularity: 145,
    language: "English",
    isShowing: true,
    isUpcoming: false
  },
  {
    title: "Dune: Part Two",
    storyline: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.",
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler"],
    duration: 166,
    releaseDate: new Date("2024-03-01"),
    posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&h=900&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=1200&h=600&q=80",
    trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w",
    genres: ["Sci-Fi", "Adventure", "Action"],
    rating: 8.9,
    popularity: 200,
    language: "English",
    isShowing: true,
    isUpcoming: false
  },
  {
    title: "Spider-Man: Into the Spider-Verse",
    storyline: "Teen Miles Morales becomes the Spider-Man of his universe, and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.",
    director: "Bob Persichetti",
    cast: ["Shameik Moore", "Jake Johnson", "Hailee Steinfeld", "Mahershala Ali"],
    duration: 117,
    releaseDate: new Date("2018-12-14"),
    posterUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=600&h=900&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&w=1200&h=600&q=80",
    trailerUrl: "https://www.youtube.com/embed/g4Hbz2y0530",
    genres: ["Animation", "Action", "Adventure", "Sci-Fi"],
    rating: 8.4,
    popularity: 110,
    language: "English",
    isShowing: true,
    isUpcoming: false
  },
  {
    title: "Everything Everywhere All at Once",
    storyline: "A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.",
    director: "Daniel Kwan",
    cast: ["Michelle Yeoh", "Stephanie Hsu", "Ke Huy Quan", "Jamie Lee Curtis"],
    duration: 139,
    releaseDate: new Date("2022-03-25"),
    posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&h=900&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&h=600&q=80",
    trailerUrl: "https://www.youtube.com/embed/wxN1T1UxQ2A",
    genres: ["Action", "Comedy", "Drama", "Sci-Fi"],
    rating: 8.0,
    popularity: 95,
    language: "English",
    isShowing: true,
    isUpcoming: false
  },
  {
    title: "Inception",
    storyline: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project.",
    director: "Christopher Nolan",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
    duration: 148,
    releaseDate: new Date("2010-07-16"),
    posterUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&h=900&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&h=600&q=80",
    trailerUrl: "https://www.youtube.com/embed/YoHD9XEInc0",
    genres: ["Action", "Sci-Fi", "Adventure", "Thriller"],
    rating: 8.8,
    popularity: 130,
    language: "English",
    isShowing: true,
    isUpcoming: false
  },
  {
    title: "Avengers: Endgame",
    storyline: "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
    director: "Anthony Russo",
    cast: ["Robert Downey Jr.", "Chris Evans", "Mark Ruffalo", "Chris Hemsworth"],
    duration: 181,
    releaseDate: new Date("2019-04-26"),
    posterUrl: "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=600&h=900&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&h=600&q=80",
    trailerUrl: "https://www.youtube.com/embed/TcMBFSGVi1c",
    genres: ["Action", "Sci-Fi", "Adventure"],
    rating: 8.4,
    popularity: 170,
    language: "English",
    isShowing: true,
    isUpcoming: false
  },
  {
    title: "Avatar: Fire and Ash",
    storyline: "The highly anticipated third installment of James Cameron's Avatar series exploring new tribes of Pandora and the growing conflict between Na'vi and sky people.",
    director: "James Cameron",
    cast: ["Sam Worthington", "Zoe Saldana", "Sigourney Weaver", "Kate Winslet"],
    duration: 160,
    releaseDate: new Date("2026-12-18"),
    posterUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&h=900&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&h=600&q=80",
    trailerUrl: "https://www.youtube.com/embed/TcMBFSGVi1c",
    genres: ["Sci-Fi", "Adventure", "Action"],
    rating: 0.0,
    popularity: 180,
    language: "English",
    isShowing: false,
    isUpcoming: true
  },
  {
    title: "Knives Out",
    storyline: "A detective investigates the death of the patriarch of an eccentric, combative family.",
    director: "Rian Johnson",
    cast: ["Daniel Craig", "Chris Evans", "Ana de Armas", "Jamie Lee Curtis"],
    duration: 130,
    releaseDate: new Date("2019-11-27"),
    posterUrl: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?auto=format&fit=crop&w=600&h=900&q=80",
    backdropUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&h=600&q=80",
    trailerUrl: "https://www.youtube.com/embed/qGqiHJTsRkQ",
    genres: ["Comedy", "Mystery", "Drama", "Thriller"],
    rating: 7.9,
    popularity: 88,
    language: "English",
    isShowing: true,
    isUpcoming: false
  }
];

const seed = async () => {
  try {
    const connUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cineplex';
    logger.info(`Seeding database at: ${connUri}`);
    await mongoose.connect(connUri);

    // Delete existing
    await User.deleteMany();
    await Movie.deleteMany();
    await Cinema.deleteMany();
    await Room.deleteMany();
    await Showtime.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await Notification.deleteMany();
    await Recommendation.deleteMany();

    logger.info('Old records deleted.');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'CinePlex Admin',
      email: 'admin@cineplex.com',
      password: 'admin123', // Automatically hashed by User.js save prehook
      role: 'admin',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'
    });

    const staffUser = await User.create({
      name: 'CinePlex Staff',
      email: 'staff@cineplex.com',
      password: 'staff123',
      role: 'staff',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80'
    });

    const customerUser = await User.create({
      name: 'John Doe',
      email: 'user@gmail.com',
      password: 'user123',
      role: 'customer',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
      preferences: {
        favoriteGenres: ['Sci-Fi', 'Adventure'],
      }
    });

    logger.info('Users created.');

    // 2. Create Movies
    const createdMovies = await Movie.create(moviesData);
    logger.info(`${createdMovies.length} movies seeded.`);

    // 3. Create Cinemas
    const cinema1 = await Cinema.create({
      name: "CinePlex Mall of Asia",
      location: "Seaside Blvd, Pasay City, Metro Manila",
      contact: "+63 2 8556 0101",
      imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80"
    });

    const cinema2 = await Cinema.create({
      name: "CinePlex Grand Theater",
      location: "Central Business District, Bonifacio Global City, Taguig",
      contact: "+63 2 7909 2000",
      imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=600&q=80"
    });

    logger.info('Cinemas created.');

    // 4. Create Rooms
    const room1A = await Room.create({
      cinemaId: cinema1._id,
      name: "IMAX Screen 1",
      rowsCount: 8,
      colsCount: 10
    });

    const room1B = await Room.create({
      cinemaId: cinema1._id,
      name: "Cinema Room 2",
      rowsCount: 6,
      colsCount: 8
    });

    const room2A = await Room.create({
      cinemaId: cinema2._id,
      name: "Grand Dolby Theater",
      rowsCount: 8,
      colsCount: 12
    });

    logger.info('Screening rooms created.');

    // 5. Create Showtimes (spanning today, tomorrow, and day after)
    const today = new Date();
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);

    const showtimes = [];

    // Showtime for Interstellar Today at 2:00 PM
    const start1 = new Date(today);
    start1.setHours(14);
    const end1 = new Date(start1.getTime() + (169 + 30) * 60 * 1000);
    showtimes.push({
      movieId: createdMovies.find(m => m.title === "Interstellar")._id,
      roomId: room1A._id,
      cinemaId: cinema1._id,
      startTime: start1,
      endTime: end1,
      basePrice: 350
    });

    // Showtime for Dune: Part Two Today at 6:00 PM
    const start2 = new Date(today);
    start2.setHours(18);
    const end2 = new Date(start2.getTime() + (166 + 30) * 60 * 1000);
    showtimes.push({
      movieId: createdMovies.find(m => m.title === "Dune: Part Two")._id,
      roomId: room1A._id,
      cinemaId: cinema1._id,
      startTime: start2,
      endTime: end2,
      basePrice: 350
    });

    // Showtime for Spider-Man Today at 3:00 PM (Cinema 2)
    const start3 = new Date(today);
    start3.setHours(15);
    const end3 = new Date(start3.getTime() + (117 + 30) * 60 * 1000);
    showtimes.push({
      movieId: createdMovies.find(m => m.title === "Spider-Man: Into the Spider-Verse")._id,
      roomId: room1B._id,
      cinemaId: cinema1._id,
      startTime: start3,
      endTime: end3,
      basePrice: 250
    });

    // Showtime for Everything Everywhere Tomorrow at 1:00 PM
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start4 = new Date(tomorrow);
    start4.setHours(13);
    const end4 = new Date(start4.getTime() + (139 + 30) * 60 * 1000);
    showtimes.push({
      movieId: createdMovies.find(m => m.title === "Everything Everywhere All at Once")._id,
      roomId: room2A._id,
      cinemaId: cinema2._id,
      startTime: start4,
      endTime: end4,
      basePrice: 300
    });

    // Showtime for Inception Tomorrow at 5:00 PM
    const start5 = new Date(tomorrow);
    start5.setHours(17);
    const end5 = new Date(start5.getTime() + (148 + 30) * 60 * 1000);
    showtimes.push({
      movieId: createdMovies.find(m => m.title === "Inception")._id,
      roomId: room2A._id,
      cinemaId: cinema2._id,
      startTime: start5,
      endTime: end5,
      basePrice: 300
    });

    const createdShowtimes = await Showtime.create(showtimes);
    logger.info(`${createdShowtimes.length} showtimes seeded.`);

    // 6. Create some Mock reviews
    const interstellarId = createdMovies.find(m => m.title === "Interstellar")._id;
    await Review.create({
      userId: customerUser._id,
      movieId: interstellarId,
      rating: 10,
      comment: "Absolutely mind-blowing. The soundtrack by Hans Zimmer combined with Christopher Nolan's visual storytelling makes it a masterpiece.",
      likes: [staffUser._id]
    });

    await Review.create({
      userId: staffUser._id,
      movieId: interstellarId,
      rating: 9,
      comment: "A breathtaking space voyage that balances complex physics with rich human emotions. Highly recommended!",
      likes: [customerUser._id]
    });

    logger.info('Reviews seeded.');

    // Recalculate average rating for Interstellar
    const reviews = await Review.find({ movieId: interstellarId });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await Movie.findByIdAndUpdate(interstellarId, {
      rating: Math.round(avg * 10) / 10,
      ratingCount: reviews.length
    });

    // 7. Seed one booked transaction history for customer
    const completedBookingShowtime = createdShowtimes[0]; // Interstellar show
    const seatsToBook = ['D-4', 'D-5'];
    
    // Simulate booking QR payload
    const qrPayload = JSON.stringify({
      bookingId: new mongoose.Types.ObjectId(),
      userId: customerUser._id,
      seats: seatsToBook,
      showtimeId: completedBookingShowtime._id,
    });
    const qrImage = await QRCode.toDataURL(qrPayload);

    const bookingRecord = await Booking.create({
      userId: customerUser._id,
      showtimeId: completedBookingShowtime._id,
      seatLabels: seatsToBook,
      totalPrice: completedBookingShowtime.basePrice * 2,
      status: 'paid',
      paymentMethod: 'Stripe',
      paymentId: 'ch_seed_payment_123',
      qrCode: qrImage,
      expiresAt: new Date(),
    });

    // Mark seats as booked on showtime
    seatsToBook.forEach(label => {
      completedBookingShowtime.bookedSeats.push({
        seatLabel: label,
        status: 'booked',
        userId: customerUser._id,
      });
    });
    await completedBookingShowtime.save();

    logger.info('Sample booking history seeded.');

    logger.info('Database Seeding Successful! 🎉');
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding database:', err);
    process.exit(1);
  }
};

seed();
