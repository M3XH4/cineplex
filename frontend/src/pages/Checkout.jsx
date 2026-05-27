import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../store/useAuthStore';
import { useBookingStore } from '../store/useBookingStore';
import { CreditCard, Wallet, Smartphone, ShieldCheck } from 'lucide-react';
import { toast } from '../utils/toast';

const Checkout = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { confirmBooking } = useBookingStore();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  // Card Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Mobile wallet inputs
  const [mobileNumber, setMobileNumber] = useState('');

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const match = res.data.booking;
        if (!match) {
          toast.error('Booking not found.');
          return navigate('/');
        }
        
        if (match.status === 'paid') {
          setBooking(match);
          setIsSuccess(true);
        } else {
          setBooking(match);
          // Calculate remaining seconds till expiresAt
          const diff = Math.max(0, Math.floor((new Date(match.expiresAt) - new Date()) / 1000));
          setTimeLeft(diff);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
        toast.error('Unable to load checkout details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, navigate]);

  useEffect(() => {
    if (isSuccess || !booking || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Checkout time expired. Your reserved seats have been released.');
          navigate(`/movie/${booking.showtimeId?.movieId?._id || ''}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSuccess, booking, navigate]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!booking) return;

    setIsProcessing(true);
    setPaymentError('');

    // Construct mock card details
    const cardDetails = paymentMethod === 'Stripe' ? {
      number: cardNumber,
      cvc: cardCvc,
    } : null;

    const result = await confirmBooking(bookingId, paymentMethod, cardDetails);
    setIsProcessing(false);

    if (result.success) {
      setIsSuccess(true);
      toast.success('Payment confirmed. Your QR ticket is ready.');
      // Fetch latest booking updates to load QR code image
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        if (res.data.booking) setBooking(res.data.booking);
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
      }
    } else {
      const message = result.message || 'Payment processing failed. Try checking card details.';
      setPaymentError(message);
      toast.error(message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading || !booking) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showtime = booking.showtimeId || {};
  const movie = showtime.movieId || {};

  return (
    <div className="bg-brand-black min-h-screen pt-24 pb-20 px-4 md:px-8 select-none text-left">
      <div className="max-w-4xl mx-auto">
        
        {isSuccess ? (
          /* SUCCESS VIEW */
          <div className="glass border border-white/10 rounded-2xl p-8 text-center max-w-xl mx-auto flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 text-green-400 flex items-center justify-center rounded-full mb-4">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <h2 className="text-3xl font-black text-white tracking-wide">Booking Confirmed!</h2>
            <p className="text-sm text-gray-400 mt-2">Your tickets are ready. Show this QR Code at the cinema entrance.</p>

            {/* QR Code */}
            {booking.qrCode && (
              <div className="bg-white p-4 rounded-xl border border-white/20 my-6 shadow-md">
                <img src={booking.qrCode} alt="Ticket QR Code" className="w-48 h-48 object-contain" />
              </div>
            )}

            {/* Ticket details summary */}
            <div className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-left flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-400 font-medium">Movie</span><span className="text-white font-bold">{movie?.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-medium">Cinema</span><span className="text-white font-bold">{showtime?.cinemaId?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-medium">Room & Seats</span><span className="text-white font-bold">{showtime?.roomId?.name} — {booking.seatLabels?.join(', ')}</span></div>
              <div className="flex justify-between"><span className="text-gray-400 font-medium">Screening Time</span><span className="text-white font-bold">{new Date(showtime?.startTime).toLocaleString([], {weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span></div>
              <div className="flex justify-between border-t border-white/5 pt-2.5 text-sm font-semibold"><span className="text-gray-400">Total Paid</span><span className="text-brand-red font-black">₱{booking.totalPrice}</span></div>
            </div>

            <div className="flex gap-4 w-full mt-8">
              <Link to="/profile" className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white font-bold text-sm py-2.5 rounded-lg transition-all text-center glow-on-hover shadow-lg">
                View My Tickets
              </Link>
              <Link to="/" className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold text-sm py-2.5 rounded-lg border border-white/10 transition-all text-center">
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          /* CHECKOUT PAYMENT VIEW */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left: Selected checkout forms */}
            <div className="md:col-span-2 flex flex-col gap-6">
              <div className="glass border border-white/10 rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">Payment Checkout</h2>
                  <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold px-3 py-1 rounded-full">
                    Timer: {formatTime(timeLeft)}
                  </span>
                </div>

                {paymentError && (
                  <p className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-bold mb-4">
                    {paymentError}
                  </p>
                )}

                {/* Gateways Tab Selector */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {['Stripe', 'PayPal', 'GCash', 'Maya'].map((method) => {
                    const isActive = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        onClick={() => { setPaymentMethod(method); setPaymentError(''); }}
                        className={`py-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${isActive ? 'bg-brand-red border-brand-red text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                      >
                        {method === 'Stripe' && <CreditCard className="w-5 h-5" />}
                        {method === 'PayPal' && <Wallet className="w-5 h-5" />}
                        {method === 'GCash' && <Smartphone className="w-5 h-5" />}
                        {method === 'Maya' && <Smartphone className="w-5 h-5" />}
                        <span>{method}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Form fields */}
                <form onSubmit={handlePay} className="flex flex-col gap-4">
                  {paymentMethod === 'Stripe' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4111 2222 3333 4444"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/50"
                          maxLength="19"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Expiry Date</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/50"
                            maxLength="5"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-400 mb-1">CVC</label>
                          <input
                            type="password"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="123"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/50"
                            maxLength="3"
                            required
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Mobile wallet phone number</label>
                      <input
                        type="text"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="0917 123 4567"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/50"
                        required
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-bold text-sm py-2.5 rounded-lg transition-all glow-on-hover shadow-lg mt-4 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      `Pay ₱${booking.totalPrice}`
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Ticket Summary detail panel */}
            <div className="flex flex-col gap-6">
              <div className="glass border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Checkout Summary</h3>
                
                <div className="flex items-center gap-3">
                  <img 
                    src={movie?.posterUrl} 
                    alt={movie?.title} 
                    className="w-14 h-20 object-cover rounded-lg border border-white/10"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm truncate max-w-[160px]">{movie?.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-1">{showtime?.roomId?.name}</p>
                    <p className="text-[10px] text-brand-red font-semibold">{showtime?.cinemaId?.name}</p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between text-gray-400"><span>Date</span><span className="text-white font-medium">{new Date(showtime?.startTime).toLocaleDateString()}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Time</span><span className="text-white font-medium">{new Date(showtime?.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Tickets</span><span className="text-white font-medium">{booking.seatLabels?.join(', ')}</span></div>
                </div>

                <div className="border-t border-white/5 pt-3 flex justify-between items-center text-sm font-semibold">
                  <span className="text-gray-400">Total Price</span>
                  <span className="text-brand-red font-black text-lg">₱{booking.totalPrice}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
