"use client";

import Link from "next/link";
import {
  Heart,
  ArrowUp,
} from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-black/80 backdrop-blur-lg">
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left Section - Brand & Copyright */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-600" fill="currentColor" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                RedPulse
              </span>
            </div>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              © {new Date().getFullYear()} All rights reserved
            </span>
          </div>

          {/* Center Section - Info */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span>v1.0.0</span>
            <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></span>
            <span>Blood Donor Registry System</span>
            <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-700"></span>
            <span>Group F4 Matiks</span>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            {/* Social Links */}
            <div className="flex items-center gap-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="GitHub"
              >
               
              </a>
            </div>

            <span className="w-px h-6 bg-zinc-300 dark:bg-zinc-700"></span>

            {/* Back to Top Button */}
            <button
              onClick={scrollToTop}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}