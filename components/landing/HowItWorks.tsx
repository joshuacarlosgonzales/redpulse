"use client";

import { motion } from "framer-motion";
import { UserPlus, Heart, Award, ArrowRight } from "lucide-react";

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

interface StepProps {
  step: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  index: number;
}

const Step = ({ step, title, description, icon: Icon, color, index }: StepProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    className="text-center relative"
  >
    <div className={`text-5xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-4`}>
      {step}
    </div>
    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
      <Icon className="w-10 h-10 text-white" />
    </div>
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-white/50 max-w-xs mx-auto">{description}</p>
  </motion.div>
);

export const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      title: "Register",
      description: "Create your account as a donor or hospital in just a few clicks.",
      icon: UserPlus,
      color: "from-red-500 to-red-700"
    },
    {
      step: "02",
      title: "Donate/Request",
      description: "Donate blood or request it when needed. We'll connect you.",
      icon: Heart,
      color: "from-blue-500 to-blue-700"
    },
    {
      step: "03",
      title: "Save Lives",
      description: "Your action can bring hope and save precious lives.",
      icon: Award,
      color: "from-green-500 to-green-700"
    },
  ];

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 border-t border-white/10">
      <div className="text-center mb-16">
        <SectionEyebrow label="How It Works" tag="Three Simple Steps" />
        <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02]">
          Three Simple Steps <br /> to Save a Life
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative">
        {steps.map((step, index) => (
          <Step key={index} {...step} index={index} />
        ))}
        {/* Arrow connectors */}
        {steps.map((_, index) => (
          index < 2 && (
            <div key={index} className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-white/10">
              <ArrowRight className="w-8 h-8" />
            </div>
          )
        ))}
      </div>
    </section>
  );
};