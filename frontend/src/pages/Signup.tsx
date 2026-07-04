import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      return toast.error('Please fill in all fields');
    }
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters long');
    }
    
    setLoading(true);
    const toastId = toast.loading('Creating your account...');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      toast.success('Account created successfully!', { id: toastId });
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
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[150px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purpleGlow/10 blur-[150px] animate-pulse-slow"></div>

      {/* Main Card Container */}
      <div className="w-full max-w-md p-8 glass-card border-glow relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-extrabold text-white tracking-wider flex items-center justify-center gap-2">
            <span className="text-accent text-glow">AI</span>EstateVision
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Design the future of living space instantly</p>
        </div>

        <h2 className="text-2xl font-bold text-center text-white mb-6">Create Account</h2>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1">
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
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-300 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-accent/50 focus:outline-none text-white placeholder-gray-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Confirm Password input */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-300 block">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-accent/50 focus:outline-none text-white placeholder-gray-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-gradient-to-r from-accent to-purpleGlow hover:brightness-110 active:scale-[0.98] text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Launching Ship...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
