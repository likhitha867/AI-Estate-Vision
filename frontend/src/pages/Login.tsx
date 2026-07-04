import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter email and password');
    }
    
    setLoading(true);
    const toastId = toast.loading('Logging you in...');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      toast.success('Logged in successfully!', { id: toastId });
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Server error, please check connection', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden px-4">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[150px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purpleGlow/10 blur-[150px] animate-pulse-slow"></div>

      {/* Main Card Container */}
      <div className="w-full max-w-md p-8 glass-card border-glow relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold text-white tracking-wider flex items-center justify-center gap-2">
            <span className="text-accent text-glow">AI</span>EstateVision
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Design the future of living space instantly</p>
        </div>

        <h2 className="text-2xl font-bold text-center text-white mb-6">Welcome Back</h2>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-accent/50 focus:outline-none text-white placeholder-gray-500 transition-colors"
              placeholder="name@domain.com"
              required
            />
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-300 block">Password</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-accent/50 focus:outline-none text-white placeholder-gray-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-accent to-purpleGlow hover:brightness-110 active:scale-[0.98] text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entering Spaceship...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          New to AIEstateVision?{' '}
          <Link to="/signup" className="text-accent hover:underline font-semibold">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
