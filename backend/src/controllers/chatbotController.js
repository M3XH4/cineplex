import Movie from '../models/Movie.js';
import Showtime from '../models/Showtime.js';

// @desc    Process assistant messages and respond with live recommendations/showtimes
// @route   POST /api/chatbot/message
// @access  Public
export const processChatMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const lowerMsg = message.toLowerCase();
    let reply = "";
    let dataContext = null;

    if (lowerMsg.includes('showtime') || lowerMsg.includes('schedule') || lowerMsg.includes('time') || lowerMsg.includes('showing')) {
      // Fetch some upcoming/current showtimes
      const showtimes = await Showtime.find()
        .populate('movieId', 'title')
        .populate('cinemaId', 'name')
        .limit(4);

      if (showtimes.length > 0) {
        reply = "Here are some of the current and upcoming showtimes at CinePlex:\n\n" + 
          showtimes.map(s => `🎬 **${s.movieId?.title}** at *${s.cinemaId?.name}* — ${new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${new Date(s.startTime).toLocaleDateString()})`).join('\n') +
          "\n\nWhich showtime would you like to book?";
        dataContext = { type: 'showtimes', items: showtimes };
      } else {
        reply = "We don't have any showtimes scheduled for today. Check back soon or browse our movies!";
      }
    } 
    else if (lowerMsg.includes('recommend') || lowerMsg.includes('suggest') || lowerMsg.includes('popular') || lowerMsg.includes('genre')) {
      // Find top rated showing movies
      const movies = await Movie.find({ isShowing: true })
        .sort({ rating: -1, popularity: -1 })
        .limit(3);

      if (movies.length > 0) {
        reply = "I highly recommend checking out these top-rated films currently showing at CinePlex:\n\n" +
          movies.map(m => `🌟 **${m.title}** (${m.genres.join(', ')}) — Rating: ${m.rating}/10\n*"${m.storyline.slice(0, 80)}..."*`).join('\n\n') +
          "\n\nWould you like to view showtimes for any of these?";
        dataContext = { type: 'movies', items: movies };
      } else {
        reply = "I'd recommend looking at our movie directory page for the latest updates!";
      }
    }
    else if (lowerMsg.includes('book') || lowerMsg.includes('ticket') || lowerMsg.includes('reserve')) {
      reply = "Booking tickets on CinePlex is extremely easy! Here is how:\n\n" +
        "1. Browse our home page and select a movie you'd like to watch.\n" +
        "2. Click the **'Book Tickets'** button on the details page.\n" +
        "3. Select your preferred screening date, cinema location, and showtime.\n" +
        "4. Choose your seats on our interactive seating layout map (locked for 5 mins).\n" +
        "5. Proceed to pay via Stripe, PayPal, GCash, or Maya.\n" +
        "6. Once payment completes, scan your QR Code ticket at the theater! 🍿";
    }
    else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      reply = "Hello! I am your CinePlex AI Assistant. 🍿 How can I help you today? You can ask me about showtimes, request movie recommendations, or ask for help with booking tickets!";
    }
    else {
      // General fall-back matching genres
      const genres = ['sci-fi', 'action', 'adventure', 'drama', 'thriller', 'animation', 'comedy'];
      let matchedGenre = null;
      for (const g of genres) {
        if (lowerMsg.includes(g)) {
          matchedGenre = g;
          break;
        }
      }

      if (matchedGenre) {
        const movies = await Movie.find({ genres: { $in: [new RegExp(`^${matchedGenre}$`, 'i')] } }).limit(3);
        if (movies.length > 0) {
          reply = `Here are some awesome **${matchedGenre.toUpperCase()}** movies currently listing:\n\n` +
            movies.map(m => `🎥 **${m.title}** — Rating: ${m.rating}/10`).join('\n') +
            "\n\nWould you like me to find showtimes for these?";
          dataContext = { type: 'movies', items: movies };
        } else {
          reply = `I couldn't find any active ${matchedGenre} movies in our database, but we are updating our collection daily!`;
        }
      } else {
        reply = "I'm not sure I fully understood. You can ask me things like 'What showtimes do you have?', 'Recommend me an Action movie', or 'How do I book a seat?'.";
      }
    }

    res.status(200).json({ success: true, reply, dataContext });
  } catch (error) {
    next(error);
  }
};
