"use client";

import {
  Heart,
  ArrowUp,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="border-t border-zinc-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-black/80">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">

          {/* =================================================
              BRAND
          ================================================= */}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600">
                <Activity
                  className="h-3.5 w-3.5 text-white"
                  strokeWidth={2.5}
                />
              </div>

              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                RedPulse
              </span>
            </div>

            <span className="hidden h-4 w-px bg-zinc-300 dark:bg-zinc-700 sm:block" />

            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              © {new Date().getFullYear()} RedPulse
            </span>
          </div>

          {/* =================================================
              RIGHT
          ================================================= */}

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Blood. Community. Life.
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={scrollToTop}
              className="h-8 w-8 rounded-lg"
              aria-label="Back to top"
              title="Back to top"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}