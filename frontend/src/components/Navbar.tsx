import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserCircle, Moon } from 'lucide-react';

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center glass rounded-full mx-4 mt-4"
    >
      <div className="flex items-center gap-3">
        <Link to="/">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-purpleGlow flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.5)] group-hover:shadow-[0_0_25px_rgba(157,78,221,0.7)] transition-shadow duration-300">
              <span className="font-bold text-black text-xl leading-none">A</span>
            </div>
            <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Archi<span className="text-accent">AI</span>
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <Moon className="w-5 h-5 text-gray-300" />
        </button>
        <Link to="/dashboard">
          <button className="px-6 py-2.5 rounded-full bg-accent text-black font-extrabold hover:shadow-[0_0_20px_rgba(0,240,255,0.6)] hover:scale-105 active:scale-[0.98] transition-all text-sm">
            Enter Dashboard
          </button>
        </Link>
      </div>
    </motion.nav>
  );
}
