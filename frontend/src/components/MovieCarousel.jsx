import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

const MovieCarousel = ({ title, movies = [], loading = false }) => {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading) {
    return (
      <div className="my-8 px-4 md:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 capitalize">{title}</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="flex-none w-44 md:w-56 aspect-[2/3] rounded-lg bg-white/5 animate-pulse-slow border border-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative group my-8 px-4 md:px-8">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 capitalize tracking-wide">{title}</h2>
      
      {/* Scroll Area Wrapper */}
      <div className="relative">
        {/* Left Arrow */}
        <button 
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hidden md:block"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-none"
        >
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>

        {/* Right Arrow */}
        <button 
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hidden md:block"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default MovieCarousel;
