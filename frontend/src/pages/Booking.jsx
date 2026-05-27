import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { ShieldAlert, Armchair, ChevronRight, Check } from 'lucide-react';
import { toast } from '../utils/toast';

const Booking = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { 
    activeShowtime, 
    selectedSeats, 
    lockedSeats, 
    bookedSeats, 
    initSocket, 
    disconnectSocket, 
    selectSeat, 
    clearSelection,
    fetchShowtime,
    createPendingBooking,
    loading 
  } = useBookingStore();

  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    fetchShowtime(showtimeId);
    if (user) {
      initSocket(showtimeId, user.id);
    }

    return () => {
      if (user) {
        // Unlock seats on page leave to keep DB clean
        clearSelection(user.id);
        disconnectSocket(showtimeId);
      }
    };
  }, [showtimeId, user, fetchShowtime, initSocket, clearSelection, disconnectSocket]);

  // Countdown timer logic
  useEffect(() => {
    if (selectedSeats.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(300);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Expired
          if (user) {
            clearSelection(user.id);
          }
          toast.error('Seat reservation expired. Please select your seats again.');
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats, user, clearSelection]);

  const handleSeatClick = (seatLabel) => {
    if (!user) return navigate('/login', { state: { from: `/booking/${showtimeId}` } });
    selectSeat(seatLabel, user.id);
  };

  const handleCheckoutRedirect = async () => {
    if (selectedSeats.length === 0) {
      toast.info('Select at least one seat to continue.');
      return;
    }
    const booking = await createPendingBooking();
    if (booking) {
      toast.success('Seats reserved. Complete checkout before the timer expires.');
      navigate(`/checkout/${booking._id}`);
    } else {
      toast.error('Failed to reserve seats. Some seats may have been booked or locked.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  if (loading || !activeShowtime) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate pricing lists
  const room = activeShowtime.roomId;
  const basePrice = activeShowtime.basePrice;
  
  const selectedSeatDetails = selectedSeats.map(label => {
    const [row, col] = label.split('-');
    const seatConfig = room.seats.find(s => s.row === row && parseInt(s.col) === parseInt(col));
    const modifier = seatConfig ? seatConfig.priceModifier : 1.0;
    const category = seatConfig ? seatConfig.category : 'Standard';
    const cost = basePrice * modifier;
    return { label, category, cost };
  });
  const currentTotal = selectedSeatDetails.reduce((total, seat) => total + seat.cost, 0);

  // Organize seat map by row
  const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const seatGrid = {};
  for (let r = 0; r < room.rowsCount; r++) {
    const letter = rows[r];
    seatGrid[letter] = room.seats.filter(s => s.row === letter).sort((a,b) => a.col - b.col);
  }

  return (
    <div className="bg-brand-black min-h-screen pt-24 pb-20 px-4 md:px-8 select-none text-left">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Center: Seat Selection Area */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">{activeShowtime.movieId?.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{room.name} — {activeShowtime.cinemaId?.name}</p>
            </div>
            {selectedSeats.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <ShieldAlert className="w-4 h-4" />
                <span>Timer: {formatTime(timeLeft)}</span>
              </div>
            )}
          </div>

          {/* Screen Indicator */}
          <div className="w-[80%] h-2 bg-gradient-to-r from-brand-red/10 via-brand-red to-brand-red/10 rounded-full shadow-[0_0_12px_rgba(229,9,20,0.4)] mb-2" />
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center mb-10">Screen This Way</p>

          {/* Seat Grid Layout */}
          <div className="flex flex-col gap-3 w-full max-w-lg overflow-x-auto pb-4 items-center">
            {Object.keys(seatGrid).map((rowLetter) => (
              <div key={rowLetter} className="flex gap-2 items-center">
                {/* Row Label Left */}
                <span className="w-4 text-xs font-bold text-gray-600 text-right">{rowLetter}</span>
                
                {/* Seats list */}
                {seatGrid[rowLetter].map((seat) => {
                  const label = `${seat.row}-${seat.col}`;
                  const isBooked = bookedSeats.includes(label);
                  const isSelected = selectedSeats.includes(label);
                  const isLockedByOthers = lockedSeats[label] && lockedSeats[label].userId !== user?.id;

                  let seatColor = 'bg-white/5 border-white/20 hover:border-white/50 text-gray-400'; // Standard Default
                  if (seat.category === 'VIP') seatColor = 'bg-purple-900/10 border-purple-500/40 hover:bg-purple-500/10';
                  if (seat.category === 'Couple') seatColor = 'bg-pink-900/10 border-pink-500/40 hover:bg-pink-500/10 w-16'; // wider seat
                  
                  if (isBooked) {
                    seatColor = 'bg-white/5 border-white/5 text-gray-700 cursor-not-allowed opacity-30';
                  } else if (isLockedByOthers) {
                    seatColor = 'bg-orange-500/30 border-orange-500/60 text-orange-400 cursor-not-allowed';
                  } else if (isSelected) {
                    seatColor = 'bg-brand-red border-brand-red text-white glow-on-hover';
                  }

                  return (
                    <button
                      key={label}
                      disabled={isBooked || isLockedByOthers}
                      onClick={() => handleSeatClick(label)}
                      className={`h-8 w-8 rounded flex items-center justify-center border text-[9px] font-bold transition-all cursor-pointer ${seatColor}`}
                      title={`${label} (${seat.category})`}
                    >
                      {isBooked ? (
                        <Check className="w-3.5 h-3.5 text-gray-600" />
                      ) : isLockedByOthers ? (
                        <Armchair className="w-3.5 h-3.5" />
                      ) : (
                        seat.col
                      )}
                    </button>
                  );
                })}

                {/* Row Label Right */}
                <span className="w-4 text-xs font-bold text-gray-600 text-left">{rowLetter}</span>
              </div>
            ))}
          </div>

          {/* Legend Details */}
          <div className="flex flex-wrap gap-4 mt-8 justify-center text-xs text-gray-400">
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-white/5 border border-white/20 rounded" /> <span>Standard</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-purple-900/10 border border-purple-500/40 rounded" /> <span>VIP</span></div>
            <div className="flex items-center gap-1.5"><div className="w-6 h-4 bg-pink-900/10 border border-pink-500/40 rounded" /> <span>Couple</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-brand-red border-brand-red rounded" /> <span>Selected</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-orange-500/30 border border-orange-500/60 rounded" /> <span>Locked</span></div>
            <div className="flex items-center gap-1.5 border border-white/5 px-2 py-0.5 rounded"><Check className="w-3.5 h-3.5 text-gray-600" /> <span>Booked</span></div>
          </div>
        </div>

        {/* Right: Showtime Info & Ticket Checkout summary */}
        <div className="flex flex-col gap-6">
          {/* Movie Panel */}
          <div className="glass rounded-xl p-5 border border-white/10 flex gap-4">
            <img 
              src={activeShowtime.movieId?.posterUrl} 
              alt={activeShowtime.movieId?.title} 
              className="w-20 h-28 object-cover rounded-lg border border-white/10"
            />
            <div>
              <p className="text-xs text-brand-red font-bold uppercase tracking-wider">Showtime Details</p>
              <h3 className="font-black text-white text-base mt-1 line-clamp-1">{activeShowtime.movieId?.title}</h3>
              <p className="text-xs text-gray-400 mt-1.5 font-light">{new Date(activeShowtime.startTime).toLocaleDateString([], {weekday: 'long', month: 'short', day: 'numeric'})}</p>
              <p className="text-xs text-gray-400 mt-1 font-light">Time: <span className="text-white font-semibold">{new Date(activeShowtime.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></p>
              <p className="text-xs text-gray-400 mt-0.5 font-light">Screen: <span className="text-white font-semibold">{room.name}</span></p>
            </div>
          </div>

          {/* Pricing Panel */}
          <div className="glass rounded-xl p-5 border border-white/10 flex flex-col gap-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Ticket Summary</h3>
            
            {selectedSeatDetails.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">No seats selected. Choose seats on the seating map to proceed.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="max-h-40 overflow-y-auto pr-1 flex flex-col gap-1.5 border-b border-white/5 pb-3">
                  {selectedSeatDetails.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-white font-semibold">Seat {s.label} <span className="text-[10px] text-gray-400 font-normal">({s.category})</span></span>
                      <span className="text-gray-300">₱{s.cost}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-gray-400 font-bold">Total Price</span>
                  <span className="text-brand-red font-black text-lg">₱{currentTotal}</span>
                </div>

                <button
                  onClick={handleCheckoutRedirect}
                  className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-bold text-sm py-2.5 rounded-lg transition-all glow-on-hover shadow-lg mt-3 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Confirm Reservation
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
