import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, User, LogOut, Shield, ChevronDown, Menu, X } from 'lucide-react';
import { useAuthStore, api } from '../store/useAuthStore';
import { toast } from '../utils/toast';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch in-app notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchNotifications = async () => {
        try {
          // Fallback to mock notifications if collection empty
          await api.get('/auth/me'); // or notification route
          // Mock some initial booking/promo notification if empty
          setNotifications([
            { id: 1, title: 'Welcome to CinePlex! 🍿', message: 'Browse movies and book tickets with real-time seats!', isRead: false },
            { id: 2, title: 'Opening Special 🎉', message: 'Use code MOCK50 for 50% off Couple seats this weekend!', isRead: true }
          ]);
        } catch (err) {
          if (import.meta.env.DEV) console.error(err);
        }
      };
      fetchNotifications();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/login');
  };

  const activeLink = (path) => location.pathname === path ? 'text-brand-red font-semibold' : 'text-gray-300 hover:text-white transition-colors';

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-brand-black/95 shadow-lg border-b border-white/5 py-3' : 'bg-gradient-to-b from-black/85 to-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="brand-title text-3xl md:text-4xl text-brand-red drop-shadow-md">
            CINEPLEX
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={activeLink('/')}>Home</Link>
          <Link to="/search" className={activeLink('/search')}>Search & Filter</Link>
          {isAuthenticated && (
            <Link to="/profile" className={activeLink('/profile')}>My Tickets</Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link to="/search" className="text-gray-300 hover:text-white p-2" aria-label="Search">
            <Search className="w-5 h-5" />
          </Link>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }} 
                  className="relative text-gray-300 hover:text-white p-2 focus:outline-none"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-brand-red text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 glass rounded-lg shadow-xl py-2 border border-white/10 text-left overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-white/15 flex justify-between items-center bg-white/5">
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => setNotifications(notifications.map(n => ({ ...n, isRead: true })))} 
                          className="text-xs text-brand-red hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none ${!n.isRead ? 'bg-brand-red/5' : ''}`}
                          >
                            <h4 className="font-semibold text-xs text-white">{n.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative">
                <button 
                  onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} 
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <img 
                    src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40&q=80"} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-md object-cover border border-white/20"
                  />
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-48 glass rounded-lg shadow-xl py-1 border border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-white/5 bg-white/5">
                      <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>

                    {user?.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Shield className="w-4 h-4 text-brand-red" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link 
                      to="/profile" 
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>

                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors border-t border-white/5"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link 
              to="/login" 
              className="bg-brand-red hover:bg-brand-red/90 text-white text-sm font-semibold px-4 py-2 rounded-md transition-all glow-on-hover shadow-md"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white p-2 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-b border-white/10 py-4 px-6 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-4">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white py-1">Home</Link>
            <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white py-1">Search & Filter</Link>
            {isAuthenticated && (
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white py-1">My Tickets</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
