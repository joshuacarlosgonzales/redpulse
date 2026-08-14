"use client";

import { useState } from "react";
import { Menu, X, Heart, LogIn, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  activeSection: number;
  scrollToSection: (index: number) => void;
  setShowLoginModal: (show: boolean) => void;
  setShowRegisterModal: (show: boolean) => void;
}

export const Navbar = ({ 
  activeSection, 
  scrollToSection, 
  setShowLoginModal, 
  setShowRegisterModal 
}: NavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = ['Home', 'About', 'How It Works', 'Features', 'Impact', 'Contact'];

  return (
    <>
      <motion.nav 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 max-w-6xl mx-auto px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/30">
            <Heart className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="text-xl font-bold text-white">RedPulse</span>
        </div>

        <div className="hidden lg:flex gap-8 text-white/70 text-sm font-medium">
          {navItems.map((item, i) => (
            <motion.button 
              key={item} 
              onClick={() => scrollToSection(i)}
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 + i * 0.05 }} 
              className={`hover:text-white transition ${activeSection === i ? 'text-white' : ''}`}
            >
              {item}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLoginModal(true)}
            className="hidden md:flex bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-full transition border border-white/10 items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Log In
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-full transition shadow-lg shadow-red-900/30 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Sign Up
          </button>
          <button 
            className="lg:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center" 
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 100 }} 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center gap-6"
          >
            <button className="absolute top-6 right-6 text-white/70" onClick={() => setMenuOpen(false)}>
              <X className="w-6 h-6" />
            </button>
            {navItems.map((item, i) => (
              <button 
                key={item} 
                onClick={() => {
                  scrollToSection(i);
                  setMenuOpen(false);
                }}
                className="text-white text-xl font-medium hover:text-red-400 transition"
              >
                {item}
              </button>
            ))}
            <div className="flex flex-col gap-3 mt-4 w-full max-w-xs">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowLoginModal(true);
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3 rounded-full border border-white/10 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Log In
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowRegisterModal(true);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-full shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};