"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StatCounterProps {
  target: number;
  label: string;
  suffix?: string;
  prefix?: string;
  duration?: number;
  description?: string;
}

const StatCounter = ({ 
  target, 
  label, 
  suffix = "", 
  prefix = "", 
  duration = 2000,
  description 
}: StatCounterProps) => {
  const [count, setCount] = useState(0);
  const [statsAnimated, setStatsAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !statsAnimated) {
          setStatsAnimated(true);
          let start = 0;
          const increment = target / (duration / 16);
          
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById(`stat-${label}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [target, label, statsAnimated, duration]);

  return (
    <div id={`stat-${label}`} className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs md:text-sm text-white/50 mt-1">{label}</div>
      {description && (
        <p className="text-[10px] text-white/30 mt-1">{description}</p>
      )}
    </div>
  );
};

export const Stats = () => {
  const stats = [
    { target: 15892, label: "Registered Donors", suffix: "+", description: "Heroes in our community" },
    { target: 28450, label: "Blood Donations", suffix: "+", description: "Units donated so far" },
    { target: 320, label: "Partner Hospitals", suffix: "+", description: "Across the country" },
    { target: 50000, label: "Lives Impacted", suffix: "+", description: "And counting everyday" },
  ];

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm"
      >
        {stats.map((stat, index) => (
          <StatCounter key={index} {...stat} />
        ))}
      </motion.div>
    </section>
  );
};