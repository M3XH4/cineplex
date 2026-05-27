import { useEffect, useState } from 'react';
import { api } from '../store/useAuthStore';
import MovieCard from '../components/MovieCard';
import { Search as SearchIcon, Mic, MicOff, SlidersHorizontal, RotateCcw } from 'lucide-react';

const Search = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [minRating, setMinRating] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  // Dropdown list arrays
  const genres = ['Sci-Fi', 'Action', 'Adventure', 'Drama', 'Animation', 'Comedy', 'Mystery', 'Thriller'];
  const languages = ['English', 'Spanish', 'Japanese', 'Korean', 'French'];
  const years = ['2026', '2025', '2024', '2022', '2019', '2018', '2014', '2010'];

  useEffect(() => {
    // Delay search fetch to debounce inputs slightly
    const delayDebounceFn = setTimeout(() => {
      const runSearch = async () => {
        setLoading(true);
        try {
          let url = `/movies?search=${searchQuery}`;
          if (selectedGenre) url += `&genre=${selectedGenre}`;
          if (selectedLanguage) url += `&language=${selectedLanguage}`;
          if (minRating) url += `&rating=${minRating}`;
          if (selectedYear) url += `&year=${selectedYear}`;

          const res = await api.get(url);
          setMovies(res.data.movies || []);
        } catch (err) {
          if (import.meta.env.DEV) console.error('Error searching movies:', err);
        } finally {
          setLoading(false);
        }
      };

      runSearch();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedGenre, selectedLanguage, minRating, selectedYear]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedLanguage('');
    setMinRating('');
    setSelectedYear('');
  };

  // Mock Voice Search Routine
  const handleVoiceSearch = () => {
    setIsListening(true);
    setVoiceText('Listening for command...');
    
    // Simulate hearing command
    setTimeout(() => {
      setVoiceText('Transcribing: "Recommend Sci-Fi movies"...');
      setTimeout(() => {
        setIsListening(false);
        setSearchQuery('');
        setSelectedGenre('Sci-Fi'); // Set genre filter directly
        setVoiceText('');
      }, 1500);
    }, 1500);
  };

  return (
    <div className="bg-brand-black min-h-screen pt-24 pb-16 px-4 md:px-8 select-none text-left">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider">Search & Discover</h1>
          <p className="text-xs text-gray-400 mt-1">Explore our cinematic library by genre, release dates, or rating scores.</p>
        </div>

        {/* Search Bars */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movie title, director, cast..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red/50"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleVoiceSearch}
              disabled={isListening}
              className={`px-4 py-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${isListening ? 'bg-brand-red/25 border-brand-red text-brand-red animate-pulse' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
              title="Voice Search"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span>Voice Assist</span>
            </button>

            <button
              onClick={handleResetFilters}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Voice Search Overlay Banner */}
        {isListening && (
          <div className="w-full bg-brand-red/10 border border-brand-red/25 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <div className="w-3 h-3 bg-brand-red rounded-full" />
            <p className="text-xs md:text-sm font-semibold text-brand-red">{voiceText}</p>
          </div>
        )}

        {/* Advanced Filters */}
        <div className="glass rounded-xl p-4 border border-white/5 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold uppercase">
            <SlidersHorizontal className="w-4 h-4 text-brand-red" />
            <span>Filters</span>
          </div>

          {/* Genre */}
          <div className="flex-1 min-w-[120px]">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
            >
              <option value="" className="bg-brand-black">All Genres</option>
              {genres.map(g => (
                <option key={g} value={g} className="bg-brand-black">{g}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className="flex-1 min-w-[120px]">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
            >
              <option value="" className="bg-brand-black">All Languages</option>
              {languages.map(l => (
                <option key={l} value={l} className="bg-brand-black">{l}</option>
              ))}
            </select>
          </div>

          {/* Ratings */}
          <div className="flex-1 min-w-[120px]">
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
            >
              <option value="" className="bg-brand-black">Minimum Rating</option>
              <option value="9" className="bg-brand-black">9.0+ ★</option>
              <option value="8" className="bg-brand-black">8.0+ ★</option>
              <option value="7" className="bg-brand-black">7.0+ ★</option>
              <option value="5" className="bg-brand-black">5.0+ ★</option>
            </select>
          </div>

          {/* Year */}
          <div className="flex-1 min-w-[120px]">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none"
            >
              <option value="" className="bg-brand-black">Release Year</option>
              {years.map(y => (
                <option key={y} value={y} className="bg-brand-black">{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Movies Grid results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-4">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className="w-full aspect-[2/3] rounded-lg bg-white/5 animate-pulse-slow border border-white/5"
              />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/5 rounded-2xl mt-4">
            <p className="text-lg text-gray-400 font-bold">No movies found</p>
            <p className="text-xs text-gray-500 mt-1">Try resetting filters or adjusting search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-4">
            {movies.map(movie => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
