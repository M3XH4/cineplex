import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIAssistant from './components/AIAssistant';
import ToastProvider from './components/ToastProvider';

// Pages
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import Search from './pages/Search';
import Booking from './pages/Booking';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

// Route guards
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuthStore();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
};

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuthStore();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

function App() {
  const { getMe } = useAuthStore();

  useEffect(() => {
    // Load current user profile on app startup if access token exists
    getMe();
  }, [getMe]);

  return (
    <Router>
      <ToastProvider>
        <div className="flex flex-col min-h-screen bg-brand-black text-white relative">
          <Navbar />
          
          {/* Main Content Workspace */}
          <div className="flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/search" element={<Search />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

            {/* Customer Protected routes */}
            <Route 
              path="/booking/:showtimeId" 
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout/:bookingId" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Admin/Staff Protected routes */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />

            {/* Fallback route */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </div>

          {/* Floating Chatbot Assistant */}
          <AIAssistant />
          
          <Footer />
        </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
