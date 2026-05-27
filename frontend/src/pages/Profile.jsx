import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, api } from '../store/useAuthStore';
import { User, Mail, Heart, Ticket, Layers, Award } from 'lucide-react';
import { toast } from '../utils/toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, getMe, isAuthenticated } = useAuthStore();
  
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Preference States
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState(false);

  const genresList = ['Sci-Fi', 'Action', 'Adventure', 'Drama', 'Animation', 'Comedy', 'Mystery', 'Thriller'];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      setLoadingBookings(true);
      try {
        // Fetch bookings
        const res = await api.get('/bookings/my-bookings');
        setBookings(res.data.bookings || []);

        // Load user genres preferences
        setSelectedGenres(user?.preferences?.favoriteGenres || []);
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated, user, navigate]);

  const handleGenreToggle = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setPrefSuccess(false);
    try {
      // Send PUT request to update profile preferences
      await api.put('/auth/me', {
        preferences: { favoriteGenres: selectedGenres }
      });
      
      await getMe();
      setPrefSuccess(true);
      toast.success('Recommendation preferences updated.');
      setTimeout(() => setPrefSuccess(false), 3000);
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      toast.error('Could not update preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-brand-black min-h-screen pt-24 pb-20 px-4 md:px-8 select-none text-left">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: User Account & Recommendation preferences */}
        <div className="flex flex-col gap-6">
          {/* Card User Account */}
          <div className="glass border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center">
            <img 
              src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80"} 
              alt="Avatar" 
              className="w-24 h-24 rounded-full object-cover border border-white/10 shadow-lg mb-4"
            />
            <h2 className="text-xl font-black text-white">{user.name}</h2>
            <div className="flex items-center gap-1.5 bg-brand-red/10 border border-brand-red/30 px-3 py-1 rounded-full text-xs font-semibold text-brand-red uppercase mt-2">
              <Award className="w-3.5 h-3.5" />
              <span>{user.role} Member</span>
            </div>

            <div className="w-full border-t border-white/5 mt-6 pt-4 flex flex-col gap-3 text-xs text-left">
              <div className="flex items-center gap-2 text-gray-400">
                <User className="w-4 h-4 text-brand-red flex-none" />
                <span className="text-white truncate">{user.name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4 text-brand-red flex-none" />
                <span className="text-white truncate">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Card Preferences */}
          <div className="glass border border-white/10 rounded-2xl p-6 flex flex-col">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-brand-red" />
              Recommendation Preferences
            </h3>
            <p className="text-[10px] text-gray-400 mb-4 font-light">Select genres to feed the recommendation engine algorithm.</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {genresList.map(g => {
                const isSelected = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() => handleGenreToggle(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${isSelected ? 'bg-brand-red border-brand-red text-white' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>

            {prefSuccess && (
              <p className="text-xs text-green-400 font-bold mb-3">Preferences updated successfully! Recalculating picks...</p>
            )}

            <button
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              {savingPrefs ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Save Preferences'}
            </button>
          </div>
        </div>

        {/* Right: Booking History and Ticket List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">My Bookings History</h2>

          {loadingBookings ? (
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/5 animate-pulse-slow" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 bg-white/5 border border-white/5 rounded-2xl">
              <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-bold">No bookings found</p>
              <p className="text-xs text-gray-500 mt-1">Book your tickets from the home listings screen to see them here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((b) => {
                const show = b.showtimeId || {};
                const m = show.movieId || {};
                const c = show.cinemaId || {};
                
                return (
                  <div 
                    key={b._id} 
                    className="glass border border-white/10 hover:border-white/20 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-all"
                  >
                    <div className="flex gap-4 items-center">
                      <img 
                        src={m.posterUrl} 
                        alt={m.title} 
                        className="w-16 h-22 object-cover rounded-lg border border-white/10"
                      />
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${b.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                          {b.status}
                        </span>
                        <h3 className="font-black text-white text-base mt-2 line-clamp-1">{m.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{c.name} — {show.roomId?.name}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><Ticket className="w-3.5 h-3.5 text-brand-red" /> Seats: {b.seatLabels?.join(', ')}</span>
                          <span>•</span>
                          <span>{new Date(show.startTime).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'})}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0 gap-2">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Total Price</p>
                        <p className="text-sm font-bold text-brand-red">₱{b.totalPrice}</p>
                      </div>
                      
                      {b.status === 'paid' && b.qrCode && (
                        <button
                          onClick={() => setSelectedTicket(b)}
                          className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-4 py-2 rounded-lg border border-white/15 cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Layers className="w-3.5 h-3.5 text-brand-red" />
                          View Ticket QR
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal popup */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass border border-white/15 rounded-2xl p-6 text-center max-w-sm w-full flex flex-col items-center shadow-2xl relative">
            <button 
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-sm"
            >
              ✕
            </button>

            <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/30 text-brand-red flex items-center justify-center rounded-full mb-3">
              <Ticket className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-wider">{selectedTicket.showtimeId?.movieId?.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{selectedTicket.showtimeId?.cinemaId?.name}</p>

            <img src={selectedTicket.qrCode} alt="Ticket QR" className="w-48 h-48 object-contain my-4 bg-white p-3 rounded-lg border" />

            <div className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-left flex flex-col gap-2 text-[10px] text-gray-300">
              <div className="flex justify-between"><span className="text-gray-400">Screen Room</span><span className="text-white font-semibold">{selectedTicket.showtimeId?.roomId?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Seats List</span><span className="text-white font-bold">{selectedTicket.seatLabels?.join(', ')}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Show Time</span><span className="text-white font-semibold">{new Date(selectedTicket.showtimeId?.startTime).toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-2 text-xs font-semibold"><span className="text-gray-400">Paid Amount</span><span className="text-brand-red">₱{selectedTicket.totalPrice}</span></div>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full bg-brand-red text-white font-bold text-xs py-2.5 rounded-lg mt-6 hover:bg-brand-red/90 transition-all cursor-pointer"
            >
              Close Ticket
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
