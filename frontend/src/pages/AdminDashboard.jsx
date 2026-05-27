import { useCallback, useEffect, useState } from 'react';
import { api } from '../store/useAuthStore';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid
} from 'recharts';
import { 
  BarChart3, Film, Calendar, Users, DollarSign, Percent, 
  Trash2, Edit, Plus, AlertCircle, RefreshCw, Layers 
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  // Stats States
  const [stats, setStats] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Movie CRUD States
  const [moviesList, setMoviesList] = useState([]);
  const [movieFormOpen, setMovieFormOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  
  // Movie Form Fields
  const [title, setTitle] = useState('');
  const [director, setDirector] = useState('');
  const [genres, setGenres] = useState('');
  const [storyline, setStoryline] = useState('');
  const [duration, setDuration] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [isShowing, setIsShowing] = useState(true);
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [movieError, setMovieError] = useState('');

  // Showtime States
  const [showtimesList, setShowtimesList] = useState([]);
  const [cinemasList, setCinemasList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);
  const [showtimeFormOpen, setShowtimeFormOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedCinema, setSelectedCinema] = useState('');
  const [startTime, setStartTime] = useState('');
  const [basePrice, setBasePrice] = useState(250);
  const [showtimeError, setShowtimeError] = useState('');

  // Fetch Analytics
  const fetchAnalytics = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [statsRes, salesRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get('/analytics/sales')
      ]);
      setStats(statsRes.data.stats);
      setSalesChart(salesRes.data.chartData || []);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching analytics:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Movies
  const fetchMoviesData = useCallback(async () => {
    try {
      const res = await api.get('/movies');
      setMoviesList(res.data.movies || []);
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
    }
  }, []);

  // Fetch Showtimes & Cinema Room details
  const fetchRooms = useCallback(async (cinemaId) => {
    try {
      const res = await api.get(`/cinemas/${cinemaId}/rooms`);
      setRoomsList(res.data.rooms || []);
      if (res.data.rooms?.length > 0) {
        setSelectedRoom(res.data.rooms[0]._id);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
    }
  }, []);

  const fetchShowtimesData = useCallback(async () => {
    try {
      const [showRes, cinRes] = await Promise.all([
        api.get('/showtimes'),
        api.get('/cinemas')
      ]);
      setShowtimesList(showRes.data.showtimes || []);
      setCinemasList(cinRes.data.cinemas || []);
      
      if (cinRes.data.cinemas?.length > 0) {
        setSelectedCinema(cinRes.data.cinemas[0]._id);
        fetchRooms(cinRes.data.cinemas[0]._id);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
    }
  }, [fetchRooms]);

  // Initial Load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics();
    fetchMoviesData();
    fetchShowtimesData();
  }, [fetchAnalytics, fetchMoviesData, fetchShowtimesData]);

  // MOVIE CRUD ROUTINES
  const handleOpenMovieForm = (movie = null) => {
    setEditingMovie(movie);
    setMovieError('');
    if (movie) {
      setTitle(movie.title);
      setDirector(movie.director);
      setGenres(movie.genres.join(', '));
      setStoryline(movie.storyline);
      setDuration(movie.duration);
      setReleaseDate(movie.releaseDate.split('T')[0]);
      setPosterUrl(movie.posterUrl);
      setBackdropUrl(movie.backdropUrl);
      setTrailerUrl(movie.trailerUrl);
      setIsShowing(movie.isShowing);
      setIsUpcoming(movie.isUpcoming);
    } else {
      setTitle('');
      setDirector('');
      setGenres('');
      setStoryline('');
      setDuration('');
      setReleaseDate('');
      setPosterUrl('');
      setBackdropUrl('');
      setTrailerUrl('');
      setIsShowing(true);
      setIsUpcoming(false);
    }
    setMovieFormOpen(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setMovieError('');

    const genresArray = genres.split(',').map(g => g.trim()).filter(Boolean);
    const movieData = {
      title,
      director,
      genres: genresArray,
      storyline,
      duration: parseInt(duration),
      releaseDate: new Date(releaseDate),
      posterUrl,
      backdropUrl,
      trailerUrl,
      isShowing,
      isUpcoming,
      popularity: editingMovie ? editingMovie.popularity : 100 // default mock weight
    };

    try {
      if (editingMovie) {
        await api.put(`/movies/${editingMovie._id}`, movieData);
      } else {
        await api.post('/movies', movieData);
      }
      setMovieFormOpen(false);
      fetchMoviesData();
    } catch (err) {
      setMovieError(err.response?.data?.message || 'Error saving movie');
    }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm('Are you sure you want to delete this movie? This will clear all schedules associated with it.')) return;
    try {
      await api.delete(`/movies/${id}`);
      fetchMoviesData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete movie');
    }
  };

  // SHOWTIME SCHEDULER ROUTINES
  const handleCreateShowtime = async (e) => {
    e.preventDefault();
    setShowtimeError('');

    if (!selectedMovie || !selectedRoom || !startTime) {
      return setShowtimeError('Please enter all scheduling inputs.');
    }

    try {
      const res = await api.post('/showtimes', {
        movieId: selectedMovie,
        roomId: selectedRoom,
        startTime: new Date(startTime),
        basePrice: parseFloat(basePrice)
      });
      
      if (res.data.success) {
        setShowtimeFormOpen(false);
        fetchShowtimesData();
        setSelectedMovie('');
        setStartTime('');
      }
    } catch (err) {
      setShowtimeError(err.response?.data?.message || 'Conflict: overlaps with existing scheduling slot in room.');
    }
  };

  const handleDeleteShowtime = async (id) => {
    if (!window.confirm('Remove showtime? This will clear dynamic seat selections.')) return;
    try {
      await api.delete(`/showtimes/${id}`);
      fetchShowtimesData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove showtime');
    }
  };

  return (
    <div className="bg-brand-black min-h-screen pt-20 flex text-left select-none">
      {/* Sidebar Panel */}
      <aside className="w-64 bg-brand-gray border-r border-white/5 flex flex-col p-4 shrink-0">
        <div className="px-2 py-4 mb-6">
          <p className="text-[10px] text-brand-red font-black tracking-widest uppercase">Operations</p>
          <h2 className="text-lg font-black text-white uppercase mt-0.5">Admin Central</h2>
        </div>

        <nav className="flex flex-col gap-1.5">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'analytics' ? 'bg-brand-red text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            Dashboard Analytics
          </button>
          
          <button
            onClick={() => setActiveTab('movies')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'movies' ? 'bg-brand-red text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Film className="w-4.5 h-4.5" />
            Manage Movies
          </button>

          <button
            onClick={() => setActiveTab('showtimes')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'showtimes' ? 'bg-brand-red text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
          >
            <Calendar className="w-4.5 h-4.5" />
            Show Schedules
          </button>
        </nav>
      </aside>

      {/* Main Workspace content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
        {/* TAB 1: ANALYTICS OVERVIEW */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-wider">Dashboard Analytics</h1>
                <p className="text-xs text-gray-400 mt-1">Real-time stats tracking bookings, seat utilization, and income streams.</p>
              </div>
              <button 
                onClick={fetchAnalytics}
                className="bg-white/5 hover:bg-white/10 p-2.5 rounded-lg border border-white/10 text-white cursor-pointer"
                title="Refresh stats"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingStats || !stats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : (
              <>
                {/* Stats row cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Revenue Card */}
                  <div className="glass border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Gross Income</p>
                      <h3 className="text-2xl font-black text-white mt-1">₱{stats.totalRevenue}</h3>
                    </div>
                    <div className="w-10 h-10 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center border border-green-500/30">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Booking count */}
                  <div className="glass border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tickets Booked</p>
                      <h3 className="text-2xl font-black text-white mt-1">{stats.totalBookings}</h3>
                    </div>
                    <div className="w-10 h-10 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center border border-brand-red/30">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Customer count */}
                  <div className="glass border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Customers</p>
                      <h3 className="text-2xl font-black text-white mt-1">{stats.totalCustomers}</h3>
                    </div>
                    <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center border border-blue-500/30">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Seat occupancy */}
                  <div className="glass border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Occupancy Rate</p>
                      <h3 className="text-2xl font-black text-white mt-1">{stats.averageOccupancy}%</h3>
                    </div>
                    <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center border border-purple-500/30">
                      <Percent className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Recharts Charts block */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Line Chart */}
                  <div className="glass border border-white/10 rounded-2xl p-5 lg:col-span-2 flex flex-col">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">7-Day Sales Trend</h3>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesChart}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#E50914" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#E50914" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" />
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                          <YAxis stroke="#9ca3af" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.08)' }} />
                          <Area type="monotone" dataKey="revenue" stroke="#E50914" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Popular movies bar stats */}
                  <div className="glass border border-white/10 rounded-2xl p-5 flex flex-col">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Popular Movies</h3>
                    <div className="flex flex-col gap-4 overflow-y-auto">
                      {stats.popularMovies?.length === 0 ? (
                        <p className="text-xs text-gray-500 py-10 text-center">No booking sales recorded yet.</p>
                      ) : (
                        stats.popularMovies?.map((m) => (
                          <div key={m._id} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-none last:pb-0">
                            <img src={m.posterUrl} alt={m.title} className="w-10 h-14 object-cover rounded border border-white/10" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{m.title}</h4>
                              <p className="text-[10px] text-gray-400 mt-1">Bookings Count: {m.bookingsCount}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black text-brand-red">{m.ticketsSold}</span>
                              <p className="text-[8px] text-gray-500">sold</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: MANAGE MOVIES */}
        {activeTab === 'movies' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-wider">Manage Movies</h1>
                <p className="text-xs text-gray-400 mt-1">Configure listings, add new releases, or edit descriptions.</p>
              </div>
              <button
                onClick={() => handleOpenMovieForm()}
                className="bg-brand-red hover:bg-brand-red/90 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer glow-on-hover shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Movie
              </button>
            </div>

            {/* Movies Table Grid */}
            <div className="glass border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-white/5 border-b border-white/10 text-gray-400 font-bold">
                  <tr>
                    <th className="px-6 py-4">Poster / Title</th>
                    <th className="px-6 py-4">Director</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Genres</th>
                    <th className="px-6 py-4">Listing Flags</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {moviesList.map((m) => (
                    <tr key={m._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold flex items-center gap-3">
                        <img src={m.posterUrl} alt={m.title} className="w-10 h-14 object-cover rounded border border-white/5" />
                        <span className="text-white truncate max-w-[150px]">{m.title}</span>
                      </td>
                      <td className="px-6 py-4 font-light">{m.director}</td>
                      <td className="px-6 py-4 font-light">{m.duration} mins</td>
                      <td className="px-6 py-4 font-light max-w-[150px] truncate">{m.genres?.join(', ')}</td>
                      <td className="px-6 py-4 flex flex-col gap-1 text-[10px]">
                        {m.isShowing && <span className="text-green-400 font-bold">Now Showing</span>}
                        {m.isUpcoming && <span className="text-purple-400 font-bold">Upcoming</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenMovieForm(m)}
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-lg border border-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMovie(m._id)}
                            className="bg-brand-red/10 hover:bg-brand-red p-2 rounded-lg border border-brand-red/25 hover:border-brand-red text-brand-red hover:text-white transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SHOWTIME SCHEDULER */}
        {activeTab === 'showtimes' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-wider">Show Schedules</h1>
                <p className="text-xs text-gray-400 mt-1">Coordinate movie halls, times, prices, and prevent scheduling overlaps.</p>
              </div>
              <button
                onClick={() => { setShowtimeFormOpen(true); setShowtimeError(''); }}
                className="bg-brand-red hover:bg-brand-red/90 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer glow-on-hover shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Schedule Screening
              </button>
            </div>

            {/* List of showtimes */}
            <div className="glass border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-white/5 border-b border-white/10 text-gray-400 font-bold">
                  <tr>
                    <th className="px-6 py-4">Movie</th>
                    <th className="px-6 py-4">Cinema Branch / Screen</th>
                    <th className="px-6 py-4">Date / Time Slot</th>
                    <th className="px-6 py-4">Base Price</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {showtimesList.map((st) => (
                    <tr key={st._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{st.movieId?.title}</td>
                      <td className="px-6 py-4 font-light">
                        <p>{st.cinemaId?.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{st.roomId?.name}</p>
                      </td>
                      <td className="px-6 py-4 font-light">
                        <p>{new Date(st.startTime).toLocaleDateString()}</p>
                        <p className="text-xs font-semibold text-brand-red mt-0.5">
                          {new Date(st.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(st.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-300">₱{st.basePrice}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteShowtime(st._id)}
                          className="bg-brand-red/10 hover:bg-brand-red p-2 rounded-lg border border-brand-red/25 hover:border-brand-red text-brand-red hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* POPUP 1: MOVIE FORM MODAL */}
      {movieFormOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass border border-white/15 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setMovieFormOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-4">
              {editingMovie ? 'Edit Movie Details' : 'Add New Movie Release'}
            </h3>

            {movieError && (
              <p className="bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-lg text-xs font-bold mb-4">
                {movieError}
              </p>
            )}

            <form onSubmit={handleSaveMovie} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm font-medium">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Movie Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Inception"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-red/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Director Name</label>
                <input
                  type="text"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  placeholder="e.g. Christopher Nolan"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-red/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Genres (comma separated)</label>
                <input
                  type="text"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  placeholder="e.g. Sci-Fi, Action, Thriller"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-red/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="148"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-red/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Release Date</label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-red/50"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Synopsis Storyline</label>
                <textarea
                  rows="3"
                  value={storyline}
                  onChange={(e) => setStoryline(e.target.value)}
                  placeholder="Summarize the movie plot details..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-red/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Poster URL</label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-red/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Backdrop URL</label>
                <input
                  type="url"
                  value={backdropUrl}
                  onChange={(e) => setBackdropUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-red/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Trailer Embed URL</label>
                <input
                  type="url"
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-red/50"
                />
              </div>

              {/* Toggles */}
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-white cursor-pointer mt-5">
                  <input
                    type="checkbox"
                    checked={isShowing}
                    onChange={(e) => { setIsShowing(e.target.checked); if (e.target.checked) setIsUpcoming(false); }}
                    className="accent-brand-red h-4 w-4"
                  />
                  <span>Now Showing</span>
                </label>
                
                <label className="flex items-center gap-2 text-white cursor-pointer mt-5">
                  <input
                    type="checkbox"
                    checked={isUpcoming}
                    onChange={(e) => { setIsUpcoming(e.target.checked); if (e.target.checked) setIsShowing(false); }}
                    className="accent-brand-red h-4 w-4"
                  />
                  <span>Upcoming</span>
                </label>
              </div>

              <div className="md:col-span-2 mt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
                >
                  Save Movie
                </button>
                <button
                  type="button"
                  onClick={() => setMovieFormOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP 2: SHOWTIME SCHEDULER MODAL */}
      {showtimeFormOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowtimeFormOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-sm"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-red" />
              Schedule Screening
            </h3>

            {showtimeError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-lg text-xs font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 flex-none" />
                <span>{showtimeError}</span>
              </div>
            )}

            <form onSubmit={handleCreateShowtime} className="flex flex-col gap-4 text-xs md:text-sm font-medium">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Movie</label>
                <select
                  value={selectedMovie}
                  onChange={(e) => setSelectedMovie(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                  required
                >
                  <option value="" className="bg-brand-black">Choose a movie...</option>
                  {moviesList.filter(m => m.isShowing).map(m => (
                    <option key={m._id} value={m._id} className="bg-brand-black">{m.title} ({m.duration} mins)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Cinema Branch</label>
                  <select
                    value={selectedCinema}
                    onChange={(e) => {
                      const cinemaId = e.target.value;
                      setSelectedCinema(cinemaId);
                      fetchRooms(cinemaId);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                    required
                  >
                    {cinemasList.map(c => (
                      <option key={c._id} value={c._id} className="bg-brand-black">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Screen Room</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none"
                    required
                  >
                    {roomsList.map(r => (
                      <option key={r._id} value={r._id} className="bg-brand-black">{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Time Slot</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-red/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Base Ticket Price (₱)</label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-red/50"
                  required
                />
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
                >
                  Create Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setShowtimeFormOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
