import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, useAuthStore } from '../store/useAuthStore';
import { toast } from '../utils/toast';

const Hero = ({ movie }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [playTrailer, setPlayTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [firstShowtime, setFirstShowtime] = useState(null);
  const [loadingShowtime, setLoadingShowtime] = useState(false);

  useEffect(() => {
    let timer;
    if (movie && movie.trailerUrl) {
      // Auto trigger background trailer after 2.5 seconds
      timer = setTimeout(() => {
        setPlayTrailer(true);
      }, 2500);
    }
    return () => {
      clearTimeout(timer);
      setPlayTrailer(false);
    };
  }, [movie]);

  useEffect(() => {
    const fetchFirstShowtime = async () => {
      if (!movie?._id || !movie.isShowing) {
        setFirstShowtime(null);
        return;
      }

      setLoadingShowtime(true);
      try {
        const response = await api.get(`/showtimes?movieId=${movie._id}`);
        setFirstShowtime(response.data.showtimes?.[0] || null);
      } catch {
        setFirstShowtime(null);
      } finally {
        setLoadingShowtime(false);
      }
    };

    fetchFirstShowtime();
  }, [movie?._id, movie?.isShowing]);

  const handleBookTickets = () => {
    const intendedPath = firstShowtime ? `/booking/${firstShowtime._id}` : `/movie/${movie._id}`;

    if (!firstShowtime) {
      toast.info('Choose an available showtime before booking.');
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: intendedPath } });
      return;
    }

    navigate(intendedPath);
  };

  if (!movie) {
    return (
      <div className="h-[60vh] md:h-[85vh] w-full bg-brand-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative h-[65vh] md:h-[85vh] w-full overflow-hidden bg-black select-none">
      {/* Background Video or Image */}
      <AnimatePresence mode="wait">
        {playTrailer && movie.trailerUrl ? (
          <motion.div 
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 w-full h-full"
          >
            <iframe 
              src={`${movie.trailerUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${movie.trailerUrl.split('/').pop()}&modestbranding=1&rel=0`}
              title={movie.title}
              className="w-full h-full scale-[1.35] origin-center border-none pointer-events-none"
              allow="autoplay; encrypted-media"
            />
          </motion.div>
        ) : (
          <motion.div 
            key="image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full"
          >
            <img 
              src={movie.backdropUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&h=600&q=80"} 
              alt={movie.title} 
              className="w-full h-full object-cover brightness-[0.4]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Vignette Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/35 to-black/10 z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-transparent to-transparent z-10" />

      {/* Hero Content Details */}
      <div className="absolute bottom-[10%] left-4 md:left-12 max-w-xl md:max-w-2xl text-left z-20">
        <motion.h1 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-6xl font-black tracking-tight text-white uppercase text-shadow-hero"
        >
          {movie.title}
        </motion.h1>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex items-center gap-3 mt-3 text-xs md:text-sm font-semibold text-gray-300"
        >
          <span className="text-green-500 font-bold">{movie.rating > 0 ? `${movie.rating} Rating` : 'New Release'}</span>
          <span>•</span>
          <span>{movie.genres?.join(', ')}</span>
          <span>•</span>
          <span>{movie.duration} mins</span>
        </motion.div>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-4 text-sm md:text-base text-gray-300 leading-relaxed drop-shadow-md line-clamp-3 text-shadow-hero"
        >
          {movie.storyline}
        </motion.p>

        {/* Buttons */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex items-center gap-4 mt-6"
        >
          <button 
            onClick={handleBookTickets}
            disabled={loadingShowtime || !movie.isShowing}
            className="bg-brand-red hover:bg-brand-red/90 text-white font-bold text-sm md:text-base px-6 py-2.5 rounded-md flex items-center gap-2 transition-all glow-on-hover shadow-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Play className="w-5 h-5 fill-white" />
            {loadingShowtime ? 'Loading...' : 'Book Tickets'}
          </button>
          
          <button 
            onClick={() => navigate(`/movie/${movie._id}`)}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm md:text-base px-6 py-2.5 rounded-md flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
          >
            <Info className="w-5 h-5" />
            More Info
          </button>

          {playTrailer && movie.trailerUrl && (
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="bg-white/5 hover:bg-white/15 text-white p-2.5 rounded-full border border-white/10 transition-all hidden md:block focus:outline-none"
              aria-label={isMuted ? "Unmute Trailer" : "Mute Trailer"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
