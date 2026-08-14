// components/landing/Footer.tsx
"use client";

import { Heart, Send } from "lucide-react";

interface FooterProps {
  scrollToSection: (index: number) => void;
}

export const Footer = ({ scrollToSection }: FooterProps) => {
  return (
    <footer className="relative z-10 border-t border-white/10 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600 p-1.5 rounded-lg">
                <Heart className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-lg font-bold text-white">RedPulse</span>
            </div>
            <p className="text-xs text-white/40 max-w-xs">
              Every drop counts. Every life matters. Join us in building a healthier community.
            </p>
            <div className="flex gap-3 mt-4">
              {/* Facebook */}
              <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
                <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              {/* Twitter/X */}
              <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
                <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              {/* Instagram */}
              <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
                <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                </svg>
              </button>
              {/* YouTube */}
              <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
                <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><button onClick={() => scrollToSection(1)} className="hover:text-white transition">About Us</button></li>
              <li><button onClick={() => scrollToSection(2)} className="hover:text-white transition">How It Works</button></li>
              <li><button onClick={() => scrollToSection(3)} className="hover:text-white transition">Features</button></li>
              <li><button onClick={() => scrollToSection(4)} className="hover:text-white transition">Impact</button></li>
              <li><button onClick={() => scrollToSection(5)} className="hover:text-white transition">Contact</button></li>
            </ul>
          </div>

          {/* For Donors */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">For Donors</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><button className="hover:text-white transition">Find Drives</button></li>
              <li><button className="hover:text-white transition">Eligibility</button></li>
              <li><button className="hover:text-white transition">Donation Process</button></li>
              <li><button className="hover:text-white transition">FAQs</button></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Stay Updated</h4>
            <p className="text-xs text-white/40 mb-3">Subscribe to our newsletter</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <p>© 2024 RedPulse · Blood Donor Registry System · Group F4 Matiks · Binalbagan Catholic College Inc.</p>
          <div className="flex gap-6">
            <button className="hover:text-white transition">Privacy Policy</button>
            <button className="hover:text-white transition">Terms of Service</button>
            <button className="hover:text-white transition">Cookie Policy</button>
          </div>
        </div>
      </div>
    </footer>
  );
};