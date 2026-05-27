import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4 py-24 text-center">
      <div className="max-w-lg glass border border-white/10 rounded-3xl p-8 md:p-10">
        <p className="text-brand-red text-xs font-black uppercase tracking-[0.35em]">404</p>
        <h1 className="text-3xl md:text-4xl font-black text-white mt-4">This screen does not exist</h1>
        <p className="text-sm text-gray-400 mt-3 leading-6">
          The link may be broken, expired, or pointing to a page that was removed during deployment.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="bg-brand-red hover:bg-brand-red/90 text-white font-bold px-5 py-3 rounded-lg transition-colors">
            Go Home
          </Link>
          <Link to="/search" className="bg-white/5 hover:bg-white/10 text-white font-bold px-5 py-3 rounded-lg border border-white/10 transition-colors">
            Browse Movies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;