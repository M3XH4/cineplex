import { useEffect, useState } from 'react';
import { api, useAuthStore } from '../store/useAuthStore';
import Hero from '../components/Hero';
import MovieCarousel from '../components/MovieCarousel';

const Home = () => {
  const { isAuthenticated } = useAuthStore();
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [showingMovies, setShowingMovies] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  
  // Recommendations
  const [topPicks, setTopPicks] = useState([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState([]);
  const [bywSource, setBywSource] = useState(null);
  const [trending, setTrending] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch Showing and Upcoming
        const [showingRes, upcomingRes, trendingRes] = await Promise.all([
          api.get('/movies?type=showing'),
          api.get('/movies?type=upcoming'),
          api.get('/recommendations/trending-near-you')
        ]);

        setShowingMovies(showingRes.data.movies || []);
        setUpcomingMovies(upcomingRes.data.movies || []);
        setTrending(trendingRes.data.movies || []);

        // Pick Interstellar or first showing movie as featured banner
        const list = showingRes.data.movies || [];
        const interstellar = list.find(m => m.title === 'Interstellar');
        setFeaturedMovie(interstellar || list[0] || null);

        // 2. Fetch authenticated recommendations
        if (isAuthenticated) {
          try {
            const [topRes, bywRes] = await Promise.all([
              api.get('/recommendations/top-picks'),
              api.get('/recommendations/because-you-watched')
            ]);
            setTopPicks(topRes.data.movies || []);
            setBecauseYouWatched(bywRes.data.movies || []);
            setBywSource(bywRes.data.sourceMovie || null);
          } catch (recErr) {
            if (import.meta.env.DEV) console.error('Failed to load user recommendations:', recErr);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Failed to load homepage data:', err);
        setError('We could not load the movie lineup. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [isAuthenticated]);

  return (
    <div className="bg-brand-black min-h-screen pb-16">
      {/* Top Banner Hero */}
      {loading ? (
        <div className="h-[65vh] md:h-[85vh] w-full bg-brand-black flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
        </div>
      ) : featuredMovie ? (
        <Hero movie={featuredMovie} />
      ) : (
        <div className="h-[52vh] md:h-[65vh] w-full bg-gradient-to-b from-black to-brand-black flex items-center justify-center px-4 text-center">
          <div>
            <p className="text-brand-red text-xs font-black uppercase tracking-widest">CinePlex</p>
            <h1 className="text-3xl md:text-5xl font-black text-white mt-3">No movies are showing yet</h1>
            <p className="text-sm text-gray-400 mt-3">{error || 'Run the backend seed command to load demo movies and showtimes.'}</p>
          </div>
        </div>
      )}

      {/* Main Carousels */}
      <div className="relative z-20 mt-8 sm:mt-10 md:mt-14 lg:mt-16 flex flex-col gap-2">
        {/* Now Showing */}
        <MovieCarousel 
          title="Now Showing Theater" 
          movies={showingMovies} 
          loading={loading} 
        />

        {/* Personalized: Top Picks (Auth) */}
        {isAuthenticated && topPicks.length > 0 && (
          <MovieCarousel 
            title="Top Picks For You" 
            movies={topPicks} 
            loading={loading} 
          />
        )}

        {/* Trending near user */}
        <MovieCarousel 
          title="Trending Near You" 
          movies={trending} 
          loading={loading} 
        />

        {/* Personalized: Because you watched (Auth) */}
        {isAuthenticated && becauseYouWatched.length > 0 && bywSource && (
          <MovieCarousel 
            title={`Because You Watched ${bywSource.title}`} 
            movies={becauseYouWatched} 
            loading={loading} 
          />
        )}

        {/* Upcoming */}
        <MovieCarousel 
          title="Upcoming Blockbusters" 
          movies={upcomingMovies} 
          loading={loading} 
        />
      </div>
    </div>
  );
};

export default Home;
