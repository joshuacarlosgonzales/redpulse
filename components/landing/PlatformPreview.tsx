"use client";

import { motion } from "framer-motion";
import { 
  Heart, LayoutDashboard, Users, Droplet, Bell, 
  BarChart3, ArrowRight, Sparkles 
} from "lucide-react";

const SectionEyebrow = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
    {label}
  </div>
);

export const PlatformPreview = () => {
  const metrics = [
    { label: 'Donor Management', icon: Users, value: '15,892' },
    { label: 'Blood Donors', icon: Droplet, value: '2,450' },
    { label: 'Request Blood', icon: Bell, value: '320' },
    { label: 'Reports & Analytics', icon: BarChart3, value: '24' },
  ];

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <SectionEyebrow label="All-in-One Platform" />
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
            Everything You Need, <br /> All in One Place
          </h2>
          <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
            RedPulse makes blood donation and management simple, efficient, and impactful for everyone.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {metrics.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="liquid-glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-white/50">{item.label}</span>
                  </div>
                  <div className="text-lg font-semibold text-white">{item.value}</div>
                </div>
              );
            })}
          </div>
          <button className="mt-8 bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-2.5 rounded-full border border-white/10 inline-flex items-center gap-2 transition">
            <LayoutDashboard className="w-4 h-4" />
            Explore Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="liquid-glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-6 h-6 text-red-400" fill="currentColor" />
            <span className="text-sm font-semibold">Be the reason someone smiles today</span>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Active Donors', value: '15,892', color: 'bg-red-500', width: '85%' },
              { label: 'Blood Units Available', value: '2,450', color: 'bg-blue-500', width: '65%' },
              { label: 'Partner Hospitals', value: '320', color: 'bg-green-500', width: '75%' },
              { label: 'Emergency Response Rate', value: '94%', color: 'bg-yellow-500', width: '94%' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                    style={{ width: item.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};