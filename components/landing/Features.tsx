"use client";

import { motion } from "framer-motion";
import { 
  Shield, Bell, Target, Heart, BarChart3, Ambulance,
  Users, Droplet, Database, Calendar, Activity, Award
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  index: number;
}

const FeatureCard = ({ icon: Icon, title, description, color, index }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -5 }}
    className="liquid-glass rounded-2xl p-6 text-center"
  >
    <div className={`w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 ${color}`}>
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-white/50 leading-[1.5]">{description}</p>
  </motion.div>
);

const SectionEyebrow = ({ label, tag }: { label: string; tag?: string }) => (
  <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
    {label}
    {tag && (
      <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-xs">
        {tag}
      </span>
    )}
  </div>
);

export const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your data is protected with enterprise-level security.",
      color: "text-blue-400"
    },
    {
      icon: Bell,
      title: "Real-time Updates",
      description: "Get instant alerts and real-time blood availability.",
      color: "text-yellow-400"
    },
    {
      icon: Target,
      title: "Easy Matching",
      description: "We connect donors with recipients efficiently.",
      color: "text-green-400"
    },
    {
      icon: Heart,
      title: "Save More Lives",
      description: "Every donation has the power to create a miracle.",
      color: "text-red-400"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Hospitals get insights to manage inventory better.",
      color: "text-purple-400"
    },
    {
      icon: Ambulance,
      title: "Emergency Ready",
      description: "Quick response for urgent blood requests.",
      color: "text-orange-400"
    },
  ];

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="text-center mb-16">
        <SectionEyebrow label="Why RedPulse?" tag="More Than Just a Platform" />
        <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
          More Than <br /> Just a Platform
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} index={index} />
        ))}
      </div>
    </section>
  );
};