import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    let timer;
    if (hovered && movie.trailerUrl) {
      // Wait 700ms of active hover before starting the trailer preview
      timer = setTimeout(() => {
        setShowVideo(true);
      }, 700);
    }
    return () => clearTimeout(timer);
  }, [hovered, movie.trailerUrl]);

  const handleCardClick = () => {
    navigate(`/movie/${movie._id}`);
  };

  return (
    <div 
      className="relative flex-none w-44 md:w-56 aspect-[2/3] rounded-lg overflow-hidden bg-brand-gray border border-white/5 cursor-pointer shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowVideo(false);
      }}
      onClick={handleCardClick}
    >
      <AnimatePresence mode="wait">
        {showVideo && movie.trailerUrl ? (
          <motion.div 
            key="trailer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full z-10"
          >
            <iframe 
              src={`${movie.trailerUrl}?autoplay=1&mute=1&controls=0&loop=1&playlist=${movie.trailerUrl.split('/').pop()}&modestbranding=1&rel=0`}
              title={movie.title}
              className="w-full h-full pointer-events-none scale-125 origin-center"
              allow="autoplay; encrypted-media"
            />
            {/* Dark overlay at bottom for details */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-black/20" />
          </motion.div>
        ) : (
          <motion.img 
            key="poster"
            src={movie.posterUrl || "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=400&q=80"} 
            alt={movie.title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        )}
      </AnimatePresence>

      {/* Hover Info Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent flex flex-col justify-end p-3 transition-opacity duration-300 z-20 ${hovered ? 'opacity-100' : 'opacity-0 md:hover:opacity-100 md:opacity-0'}`}>
        <h3 className="font-bold text-sm md:text-base text-white line-clamp-1">{movie.title}</h3>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{movie.genres?.join(' • ')}</p>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-xs font-semibold text-white">{movie.rating > 0 ? movie.rating : 'N/A'}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{new Date(movie.releaseDate).getFullYear()}</span>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/movie/${movie._id}`); }}
          className="mt-3 bg-brand-red hover:bg-brand-red/90 text-white font-bold text-xs py-1.5 rounded-md flex items-center justify-center gap-1 transition-all"
        >
          <Play className="w-3 h-3 fill-white" />
          Get Tickets
        </button>
      </div>

      {/* Basic Label when not hovered */}
      <div className={`absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-brand-black/90 to-transparent z-10 transition-opacity duration-300 ${hovered ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-xs font-bold text-white truncate">{movie.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
          <span className="text-[10px] font-semibold text-gray-300">{movie.rating > 0 ? movie.rating : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
