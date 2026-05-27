import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '../utils/toast';

const Footer = () => {
  return (
    <footer className="bg-brand-black border-t border-white/5 pt-12 pb-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wider text-brand-red">CINEPLEX</span>
          </Link>
          <p className="text-xs text-gray-400 leading-relaxed">
            CinePlex is a premium cinema operations and intelligent movie recommendation engine. Bringing the best theatrical experiences directly to your screen.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook"><Facebook className="w-4 h-4" /></a>
            <a href="https://x.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter"><Twitter className="w-4 h-4" /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram"><Instagram className="w-4 h-4" /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Youtube"><Youtube className="w-4 h-4" /></a>
          </div>
        </div>

        {/* Explore */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Explore</h4>
          <ul className="flex flex-col gap-2 text-xs text-gray-400">
            <li><Link to="/" className="hover:text-white transition-colors">Home Listing</Link></li>
            <li><Link to="/search" className="hover:text-white transition-colors">Search Library</Link></li>
            <li><Link to="/profile" className="hover:text-white transition-colors">Bookings & History</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Legal</h4>
          <ul className="flex flex-col gap-2 text-xs text-gray-400">
            <li><button type="button" onClick={() => toast.info('Privacy policy page is coming soon.')} className="hover:text-white transition-colors text-left">Privacy Policy</button></li>
            <li><button type="button" onClick={() => toast.info('Terms page is coming soon.')} className="hover:text-white transition-colors text-left">Terms of Service</button></li>
            <li><button type="button" onClick={() => toast.info('Refund policy page is coming soon.')} className="hover:text-white transition-colors text-left">Refund & Policy</button></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Contact Us</h4>
          <ul className="flex flex-col gap-2 text-xs text-gray-400">
            <li>Email: support@cineplex.com</li>
            <li>Hotline: +63 2 8556 0101</li>
            <li>Address: Pasay City, Metro Manila</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 pt-6 text-center text-[10px] text-gray-500">
        <p>© {new Date().getFullYear()} CinePlex Platform. All rights reserved. Made for cinematic excellence.</p>
      </div>
    </footer>
  );
};

export default Footer;
