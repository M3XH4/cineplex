import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from '../utils/toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin, error, loading, isAuthenticated, user } = useAuthStore();
  const intendedPath = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate(intendedPath === '/' ? '/admin' : intendedPath, { replace: true });
      } else {
        navigate(intendedPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, intendedPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email || !password) {
      return setValidationError('Please enter all fields');
    }

    const res = await login(email, password);
    if (res.success) {
      toast.success('Welcome back to CinePlex.');
      if (res.role === 'admin') {
        navigate(intendedPath === '/' ? '/admin' : intendedPath, { replace: true });
      } else {
        navigate(intendedPath, { replace: true });
      }
    } else {
      toast.error(res.message || 'Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    // Simulated Google Credential token callback
    const res = await googleLogin({
      email: 'john.google@gmail.com',
      name: 'John Google User',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
      googleId: 'g_1234567890'
    });
    if (res.success) {
      toast.success('Signed in with Google.');
      navigate(intendedPath, { replace: true });
    } else {
      toast.error(res.message || 'Google login failed.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative px-4 py-20 select-none">
      {/* Cinematic Background Poster blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center brightness-[0.2] opacity-40 blur-md"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80')` }}
      />

      <div className="w-full max-w-md glass rounded-2xl p-8 relative z-10 shadow-2xl border border-white/10 flex flex-col text-left">
        <h2 className="text-3xl font-black tracking-tight text-white mb-2">Sign In</h2>
        <p className="text-xs text-gray-400 mb-6">Enjoy live cinema seat locking & movie suggestions.</p>

        {(error || validationError) && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center gap-2 mb-4 text-xs font-semibold">
            <AlertCircle className="w-4.5 h-4.5 flex-none" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-bold text-sm py-2.5 rounded-lg transition-all glow-on-hover shadow-lg mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-white/10 w-full" />
          <span className="absolute bg-brand-gray px-3 text-[10px] text-gray-500 uppercase tracking-widest">Or login with</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {/* Simple google SVG icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.85-.75 1.5l.48.5 2.8 2.1c1.64-1.5 2.58-3.7 2.58-6.1z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.97-1.1 7.96-2.9l-3.8-2.9c-1.1.7-2.4 1.2-4.16 1.2-3.2 0-5.9-2.2-6.87-5.1H1.3l.5 3.8C3.8 22.1 7.6 24 12 24z"/>
            <path fill="#FBBC05" d="M5.13 14.3c-.25-.75-.4-1.55-.4-2.3 0-.75.15-1.55.4-2.3L1.8 5.9C.7 8.1 0 10.5 0 13c0 2.5.7 4.9 1.8 7.1l3.33-5.8z"/>
            <path fill="#EA4335" d="M12 4.8c1.76 0 3.35.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.6 0 3.8 1.9 1.8 4.8l3.83 2.9c.96-2.9 3.66-4.8 6.87-4.8z"/>
          </svg>
          Google One-Tap Sign In
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          New to CinePlex?{' '}
          <Link to="/register" className="text-brand-red font-bold hover:underline">
            Sign up now
          </Link>
        </p>

        <div className="mt-6 border-t border-white/5 pt-4 text-center">
          <p className="text-[10px] text-gray-500">
            Bootstrap: Admin Account: <code className="bg-white/5 text-gray-400 px-1 rounded">admin@cineplex.com</code> / <code className="bg-white/5 text-gray-400 px-1 rounded">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
