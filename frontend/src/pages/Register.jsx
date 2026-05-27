import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { User, Lock, Mail, AlertCircle } from 'lucide-react';
import { toast } from '../utils/toast';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, error, loading, isAuthenticated } = useAuthStore();
  const intendedPath = location.state?.from || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(intendedPath, { replace: true });
    }
  }, [isAuthenticated, navigate, intendedPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name || !email || !password || !confirmPassword) {
      return setValidationError('Please fill in all fields');
    }

    if (password.length < 6) {
      return setValidationError('Password must be at least 6 characters long');
    }

    if (password !== confirmPassword) {
      return setValidationError('Passwords do not match');
    }

    const res = await register(name, email, password);
    if (res.success) {
      toast.success('Your CinePlex account is ready.');
      navigate(intendedPath, { replace: true });
    } else {
      toast.error(res.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative px-4 py-20 select-none">
      {/* Background blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center brightness-[0.2] opacity-40 blur-md"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80')` }}
      />

      <div className="w-full max-w-md glass rounded-2xl p-8 relative z-10 shadow-2xl border border-white/10 flex flex-col text-left">
        <h2 className="text-3xl font-black tracking-tight text-white mb-2">Create Account</h2>
        <p className="text-xs text-gray-400 mb-6">Create a CinePlex profile to unlock personalized recommendations.</p>

        {(error || validationError) && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center gap-2 mb-4 text-xs font-semibold">
            <AlertCircle className="w-4.5 h-4.5 flex-none" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 transition-colors"
                required
              />
            </div>
          </div>

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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/50 focus:ring-1 focus:ring-brand-red/50 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-bold text-sm py-2.5 rounded-lg transition-all glow-on-hover shadow-lg mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-red font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
