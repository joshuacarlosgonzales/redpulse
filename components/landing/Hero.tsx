"use client";

import { motion } from "framer-motion";
import { Heart, ArrowRight, LayoutDashboard } from "lucide-react";

interface HeroProps {
  setShowRegisterModal: (show: boolean) => void;
  scrollToSection: (index: number) => void;
}

export const Hero = ({ setShowRegisterModal, scrollToSection }: HeroProps) => {
  return (
    <section className="relative z-10 pt-16 md:pt-28 pb-12 text-center flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs mb-6"
      >
        <Heart className="w-3 h-3 text-red-400" fill="currentColor" />
        <span>SAVE LIVES. DONATE BLOOD.</span>
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-5xl md:text-8xl font-bold tracking-tight leading-[0.9]"
      >
        <span className="block text-white">Every Drop</span>
        <span className="block animate-shiny" style={{
          backgroundImage: 'linear-gradient(to right, #091020 0%, #8B0000 12.5%, #ff4444 32.5%, #ff6b6b 50%, #8B0000 67.5%, #091020 87.5%, #091020 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
          filter: 'url(#c3-noise)'
        }}>Creates Hope</span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.5 }} 
        className="mt-6 text-white/60 max-w-md text-base leading-[1.6]"
      >
        RedPulse connects generous donors with those in need. Together, we can build a stronger, healthier community — one donation at a time.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.7 }} 
        className="mt-8 flex flex-col sm:flex-row gap-4"
      >
        <button
          onClick={() => setShowRegisterModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-full transition shadow-lg shadow-red-900/30 inline-flex items-center gap-2"
        >
          <Heart className="w-5 h-5" />
          Become a Donor
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => scrollToSection(3)}
          className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-full transition border border-white/10 inline-flex items-center gap-2"
        >
          <LayoutDashboard className="w-5 h-5" />
          Explore RedPulse
        </button>
      </motion.div>
    </section>
  );
};