import { create } from 'zustand';
import { io } from 'socket.io-client';
import { api } from './useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useBookingStore = create((set, get) => ({
  socket: null,
  activeShowtime: null,
  selectedSeats: [],
  lockedSeats: {}, // format: { 'A-1': { userId, expiresAt } }
  bookedSeats: [], // format: ['A-1', 'A-2']
  loading: false,
  error: null,
  activeBooking: null,

  initSocket: (showtimeId, userId) => {
    // If socket exists, clean it up first
    if (get().socket) {
      get().disconnectSocket(get().activeShowtime?._id);
    }

    const socketInstance = io(SOCKET_URL, { withCredentials: true });
    
    // Join showtime room
    socketInstance.emit('join-showtime', { showtimeId });

    // Sync seats state
    socketInstance.on('seat-sync', ({ bookedSeats }) => {
      const locked = {};
      const booked = [];

      bookedSeats.forEach(s => {
        if (s.status === 'booked') {
          booked.push(s.seatLabel);
        } else if (s.status === 'locked') {
          locked[s.seatLabel] = { userId: s.userId, expiresAt: s.expiresAt };
        }
      });

      set({ bookedSeats: booked, lockedSeats: locked });
    });

    // Handle seat locked by another user
    socketInstance.on('seat-locked', ({ seatLabel, userId: lockingUserId, expiresAt }) => {
      // If locked by someone else, add to lockedSeats
      if (lockingUserId !== userId) {
        set((state) => ({
          lockedSeats: {
            ...state.lockedSeats,
            [seatLabel]: { userId: lockingUserId, expiresAt }
          }
        }));
      }
    });

    // Handle seat unlocked (unselected)
    socketInstance.on('seat-unlocked', ({ seatLabel }) => {
      set((state) => {
        const nextLocked = { ...state.lockedSeats };
        delete nextLocked[seatLabel];
        
        // Also ensure if it was selected by me, it's cleared
        const nextSelected = state.selectedSeats.filter(s => s !== seatLabel);

        return {
          lockedSeats: nextLocked,
          selectedSeats: nextSelected,
        };
      });
    });

    // Handle permanent seat bookings
    socketInstance.on('seats-booked', ({ seats }) => {
      set((state) => {
        const nextLocked = { ...state.lockedSeats };
        seats.forEach(s => delete nextLocked[s]);

        return {
          bookedSeats: [...state.bookedSeats, ...seats],
          lockedSeats: nextLocked,
        };
      });
    });

    set({ socket: socketInstance });
  },

  disconnectSocket: (showtimeId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave-showtime', { showtimeId });
      socket.disconnect();
      set({ socket: null, selectedSeats: [], lockedSeats: {}, bookedSeats: [] });
    }
  },

  selectSeat: (seatLabel, userId) => {
    const { socket, activeShowtime, selectedSeats, lockedSeats, bookedSeats } = get();
    if (!socket || !activeShowtime) return;

    // Check if booked or locked by others
    if (bookedSeats.includes(seatLabel)) return;
    if (lockedSeats[seatLabel] && lockedSeats[seatLabel].userId !== userId) return;

    const isSelected = selectedSeats.includes(seatLabel);

    if (isSelected) {
      // Unlock (unselect)
      socket.emit('unlock-seat', { showtimeId: activeShowtime._id, seatLabel, userId });
      set({ selectedSeats: selectedSeats.filter(s => s !== seatLabel) });
    } else {
      // Lock (select)
      socket.emit('lock-seat', { showtimeId: activeShowtime._id, seatLabel, userId });
      set({ selectedSeats: [...selectedSeats, seatLabel] });
    }
  },

  clearSelection: (userId) => {
    const { socket, activeShowtime, selectedSeats } = get();
    if (socket && activeShowtime) {
      selectedSeats.forEach(seatLabel => {
        socket.emit('unlock-seat', { showtimeId: activeShowtime._id, seatLabel, userId });
      });
    }
    set({ selectedSeats: [] });
  },

  fetchShowtime: async (showtimeId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/showtimes/${showtimeId}`);
      set({ activeShowtime: response.data.showtime, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch showtime', loading: false });
    }
  },

  createPendingBooking: async () => {
    const { activeShowtime, selectedSeats } = get();
    if (!activeShowtime || selectedSeats.length === 0) return null;

    set({ loading: true });
    try {
      const response = await api.post('/bookings', {
        showtimeId: activeShowtime._id,
        seatLabels: selectedSeats,
      });
      set({ activeBooking: response.data.booking, loading: false });
      return response.data.booking;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create booking';
      set({ error: msg, loading: false });
      return null;
    }
  },

  confirmBooking: async (bookingId, paymentMethod, cardDetails) => {
    set({ loading: true });
    try {
      // 1. Process payment via mock endpoint
      const payResponse = await api.post('/payments/checkout', {
        bookingId,
        paymentMethod,
        cardDetails
      });

      if (payResponse.data.success) {
        const { id: paymentId } = payResponse.data.transaction;
        // 2. Confirm booking on backend
        const confirmRes = await api.post(`/bookings/${bookingId}/confirm`, {
          paymentMethod,
          paymentId
        });
        set({ activeBooking: confirmRes.data.booking, selectedSeats: [], loading: false });
        return { success: true };
      }
      return { success: false, message: 'Payment Declined' };
    } catch (err) {
      const msg = err.response?.data?.message || 'Checkout failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  }
}));
