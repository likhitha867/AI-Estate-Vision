import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Hero3D from '../3d/Hero3D';
import Navbar from '../components/Navbar';
import { ArrowRight, Sparkles, Box, BrainCircuit } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden text-white font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purpleGlow/10 blur-[120px] pointer-events-none"></div>

      {/* Floating Header */}
      <Navbar />

      {/* Hero Section */}
      <div className="flex-grow flex items-center justify-center pt-32 pb-16 px-8 z-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LEFT SECTION */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex flex-col gap-6 z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card w-fit border-glow">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium tracking-wide text-gray-300 uppercase">Next-Gen AI Architecture</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Design Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purpleGlow text-glow">Dream Home</span> <br />
              With AI.
            </h1>
            
            <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
              Experience the future of real estate. Generate production-ready blueprints, explore cinematic 3D walkthroughs, and build your vision with intelligence.
            </p>
            
            <div className="flex flex-wrap gap-4 mt-4">
              <Link to="/dashboard">
                <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-accent text-black font-bold text-lg hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] hover:scale-105 transition-all duration-300">
                  Get Started <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link to="/dashboard">
                <button className="px-8 py-4 rounded-full glass border border-white/20 font-bold text-lg hover:bg-white/10 transition-all duration-300">
                  Create Account
                </button>
              </Link>
            </div>
            
            <div className="flex gap-8 mt-8 border-t border-white/10 pt-8">
              <div>
                <h4 className="text-3xl font-bold text-white">99%</h4>
                <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Accuracy</p>
              </div>
              <div>
                <h4 className="text-3xl font-bold text-white">10x</h4>
                <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Faster Design</p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT SECTION (3D) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="relative h-[600px] w-full flex items-center justify-center animate-float"
          >
            {/* Glowing orb behind 3D model */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
            
            <div className="w-full h-full relative z-10 glass-card p-2 border-glow rounded-3xl overflow-hidden">
               <Hero3D />
            </div>
          </motion.div>
          
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto w-full px-8 pb-24 z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Designed to <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purpleGlow text-glow">Revolutionise</span> Architecture
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm lg:text-base">
            Empowering homeowners and designers with next-generation spatial intelligence and AI-driven expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="glass-card p-8 border border-white/10 hover:border-accent/40 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] transition-all flex flex-col gap-4 relative group"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.1)] group-hover:bg-accent/20 transition-all">
              <Box className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Deliver Immersive 3D Experiences</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Enable users to walk inside their future homes before construction begins.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="glass-card p-8 border border-white/10 hover:border-purpleGlow/40 hover:shadow-[0_0_25px_rgba(157,78,221,0.2)] transition-all flex flex-col gap-4 relative group"
          >
            <div className="w-12 h-12 rounded-xl bg-purpleGlow/10 border border-purpleGlow/20 flex items-center justify-center shadow-[0_0_10px_rgba(157,78,221,0.1)] group-hover:bg-purpleGlow/20 transition-all">
              <BrainCircuit className="w-6 h-6 text-purpleGlow group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Intelligent Property Guidance</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Predict prices, suggest localities, and recommend designs using machine learning.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="glass-card p-8 border border-white/10 hover:border-accent/40 hover:shadow-[0_0_25px_rgba(0,240,255,0.2)] transition-all flex flex-col gap-4 relative group"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.1)] group-hover:bg-accent/20 transition-all">
              <Sparkles className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Democratise Design Expertise</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Make professional-grade architectural and Vastu guidance accessible to everyone.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
