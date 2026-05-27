import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, useAuthStore } from '../store/useAuthStore';
import { Star, Clock, ThumbsUp, Send } from 'lucide-react';
import MovieCarousel from '../components/MovieCarousel';
import { toast } from '../utils/toast';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [movie, setMovie] = useState(null);
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinema, setSelectedCinema] = useState('');
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsDistribution, setReviewsDistribution] = useState({});
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const [showtimesError, setShowtimesError] = useState('');

  // Review form states
  const [rating, setRating] = useState(10);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Fetch movie data
  useEffect(() => {
    const fetchMovieData = async () => {
      setLoading(true);
      setPageError('');
      try {
        const [movieRes, cinemaRes, reviewRes, similarRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get('/cinemas'),
          api.get(`/reviews/movie/${id}`),
          api.get(`/recommendations/similar/${id}`)
        ]);

        setMovie(movieRes.data.movie);
        setCinemas(cinemaRes.data.cinemas || []);
        setReviews(reviewRes.data.reviews || []);
        setReviewsDistribution(reviewRes.data.distribution || {});
        setSimilarMovies(similarRes.data.movies || []);

        if (cinemaRes.data.cinemas?.length > 0) {
          setSelectedCinema(cinemaRes.data.cinemas[0]._id);
        }

        // Set default date to today
        setSelectedDate(new Date().toISOString().split('T')[0]);

      } catch (err) {
        if (import.meta.env.DEV) console.error('Error fetching movie details:', err);
        setPageError('Movie details could not be loaded. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  // Fetch showtimes when cinema or date changes
  useEffect(() => {
    if (selectedCinema && selectedDate) {
      const fetchShowtimes = async () => {
        setShowtimesLoading(true);
        setShowtimesError('');
        try {
          const res = await api.get(`/showtimes?movieId=${id}&cinemaId=${selectedCinema}&date=${selectedDate}`);
          setShowtimes(res.data.showtimes || []);
        } catch (err) {
          if (import.meta.env.DEV) console.error('Error fetching showtimes:', err);
          setShowtimesError('Unable to load showtimes for this selection.');
        } finally {
          setShowtimesLoading(false);
        }
      };
      fetchShowtimes();
    }
  }, [id, selectedCinema, selectedDate]);

  // Review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');

    if (!comment.trim()) {
      return setReviewError('Please enter a review comment.');
    }

    try {
      const res = await api.post('/reviews', {
        movieId: id,
        rating,
        comment,
      });

      if (res.data.success) {
        // Refresh reviews list
        const reviewRes = await api.get(`/reviews/movie/${id}`);
        setReviews(reviewRes.data.reviews || []);
        setComment('');
        setRating(10);
        toast.success('Review posted successfully.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit review';
      setReviewError(message);
      toast.error(message);
    }
  };

  const handleLikeReview = async (reviewId) => {
    if (!isAuthenticated) return navigate('/login', { state: { from: `/movie/${id}` } });
    try {
      const res = await api.put(`/reviews/${reviewId}/like`);
      if (res.data.success) {
        setReviews(reviews.map(r => {
          if (r._id === reviewId) {
            const hasLiked = r.likes.includes(user.id);
            return {
              ...r,
              likes: hasLiked 
                ? r.likes.filter(uid => uid !== user.id) 
                : [...r.likes, user.id]
            };
          }
          return r;
        }));
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      toast.error('Could not update review like.');
    }
  };

  const handleBookTicket = (showtimeId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/booking/${showtimeId}` } });
    } else {
      navigate(`/booking/${showtimeId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center text-white">
        <p>{pageError || 'Movie details could not be loaded.'}</p>
      </div>
    );
  }

  const dateOptions = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const displayStr = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    dateOptions.push({ value: dateStr, label: displayStr });
  }

  return (
    <div className="bg-brand-black min-h-screen pb-20 select-none text-left">
      {/* Backdrop Header */}
      <div className="relative h-[40vh] md:h-[60vh] w-full">
        <img 
          src={movie.backdropUrl || "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&h=600&q=80"} 
          alt={movie.title}
          className="w-full h-full object-cover brightness-[0.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-32 md:-mt-48 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Poster */}
        <div className="flex flex-col items-center lg:items-start gap-4">
          <img 
            src={movie.posterUrl || "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=400&q=80"} 
            alt={movie.title}
            className="w-64 md:w-80 rounded-xl shadow-2xl border border-white/10"
          />
          
          <div className="w-full flex items-center justify-center lg:justify-start gap-4 mt-2">
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span>{movie.rating > 0 ? `${movie.rating}/10` : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Clock className="w-4 h-4 text-brand-red" />
              <span>{movie.duration} mins</span>
            </div>
          </div>
        </div>

        {/* Right: Info + Showtime Booking */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">{movie.title}</h1>
            <p className="text-sm text-gray-400 mt-2">Directed by <span className="text-white font-semibold">{movie.director}</span></p>
            
            {/* Genre Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {movie.genres?.map((g, i) => (
                <span key={i} className="text-xs bg-brand-red/10 border border-brand-red/30 px-3 py-1 rounded-full text-brand-red font-semibold">{g}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-white/15 pt-4">
            <h3 className="text-lg font-bold text-white mb-2">Storyline</h3>
            <p className="text-sm text-gray-300 leading-relaxed font-light">{movie.storyline}</p>
          </div>

          <div className="border-t border-white/15 pt-4">
            <h3 className="text-lg font-bold text-white mb-2">Cast</h3>
            <p className="text-sm text-gray-400 font-light">{movie.cast?.join(', ')}</p>
          </div>

          {movie.trailerUrl && (
            <div className="border-t border-white/15 pt-4">
              <h3 className="text-lg font-bold text-white mb-3">Trailer</h3>
              <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
                <iframe
                  src={`${movie.trailerUrl}?rel=0&modestbranding=1`}
                  title={`${movie.title} trailer`}
                  className="h-full w-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Booking Showtime Slots Section */}
          {movie.isShowing ? (
            <div className="glass rounded-xl p-6 border border-white/10 mt-4">
              <h3 className="text-xl font-black text-white tracking-wide mb-4">Book Showtimes</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Cinema Select */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Select Cinema</label>
                  <div className="relative">
                    <select 
                      value={selectedCinema}
                      onChange={(e) => setSelectedCinema(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      {cinemas.map(c => (
                        <option key={c._id} value={c._id} className="bg-brand-black">{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date Select */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Select Date</label>
                  <div className="flex gap-2">
                    {dateOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedDate(opt.value)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${selectedDate === opt.value ? 'bg-brand-red border-brand-red text-white' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Showtimes Grid */}
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-3">Available Screenings</h4>
                {showtimesLoading ? (
                  <div className="py-8 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : showtimesError ? (
                  <p className="text-sm text-red-400 py-4 text-center">{showtimesError}</p>
                ) : showtimes.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">No showtimes found for the selected cinema and date.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {showtimes.map((st) => (
                      <button
                        key={st._id}
                        onClick={() => handleBookTicket(st._id)}
                        className="bg-white/5 hover:bg-brand-red hover:scale-105 border border-white/10 hover:border-brand-red rounded-lg p-3 text-center transition-all cursor-pointer"
                      >
                        <p className="text-sm font-bold text-white">
                          {new Date(st.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-gray-400 group-hover:text-white mt-1">{st.roomId?.name}</p>
                        <p className="text-xs font-semibold text-brand-red hover:text-white mt-1.5">₱{st.basePrice}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl p-6 border border-white/10 text-center">
              <p className="text-brand-red font-bold text-sm">UPCOMING BLOCKBUSTER</p>
              <p className="text-xs text-gray-400 mt-1">This movie is coming soon and bookings are not yet open.</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Ratings distribution chart */}
        <div className="glass rounded-xl p-6 border border-white/10 h-fit">
          <h3 className="text-lg font-bold text-white mb-4">Rating Summary</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-center">
              <p className="text-5xl font-black text-white">{movie.rating > 0 ? movie.rating : 'N/A'}</p>
              <div className="flex justify-center gap-0.5 mt-1.5">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{reviews.length} reviews</p>
            </div>
            
            {/* Distribution bars */}
            <div className="flex-1 flex flex-col gap-1 text-[10px] text-gray-400">
              {[10, 8, 6, 4, 2].map((stars) => {
                const count = reviewsDistribution[stars] || 0;
                const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="w-3">{stars}★</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-red" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-4 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form */}
          {isAuthenticated ? (
            <form onSubmit={handleReviewSubmit} className="border-t border-white/5 pt-4 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white">Write a Review</h4>
              
              {reviewError && <p className="text-xs text-red-400">{reviewError}</p>}
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Your Rating: {rating}/10</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={rating} 
                  onChange={(e) => setRating(parseInt(e.target.value))}
                  className="w-full accent-brand-red"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Comment</label>
                <textarea
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you think of the movie?"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs md:text-sm text-white focus:outline-none focus:border-brand-red/50"
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-brand-red hover:bg-brand-red/90 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Review
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4 border-t border-white/5">
              Please{' '}
              <Link to="/login" className="text-brand-red font-bold hover:underline">Sign In</Link>
              {' '}to write a review.
            </p>
          )}
        </div>

        {/* Right: Reviews List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-xl font-black text-white tracking-wide">Reviews & Discussion</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500 py-6">No reviews have been written yet. Be the first!</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id} className="glass border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={rev.userId?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40&q=80"} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{rev.userId?.name || 'Anonymous'}</p>
                      <p className="text-[9px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/15">
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    <span className="text-xs font-bold text-white">{rev.rating}/10</span>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-gray-300 font-light mt-1 pl-1 leading-relaxed">{rev.comment}</p>

                <div className="flex items-center gap-4 mt-2 border-t border-white/5 pt-2 text-[10px]">
                  <button 
                    onClick={() => handleLikeReview(rev._id)}
                    className={`flex items-center gap-1 hover:text-white transition-colors cursor-pointer ${rev.likes?.includes(user?.id) ? 'text-brand-red font-bold' : 'text-gray-400'}`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{rev.likes?.length || 0} Likes</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Similar Movies Carousel */}
      {similarMovies.length > 0 && (
        <div className="mt-12">
          <MovieCarousel title="Similar Movies You Might Like" movies={similarMovies} />
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
