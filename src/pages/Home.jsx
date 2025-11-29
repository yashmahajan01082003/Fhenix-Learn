import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Code2, Zap, ArrowRight, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { CURRICULUM } from '@/components/learn/curriculum';
import ModuleCard from '@/components/modules/ModuleCard';

export default function Home() {
  // Only show first 3 modules as preview
  const previewModules = CURRICULUM.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#0AD9DC]/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#011623] to-transparent z-10" />

        <div className="container mx-auto px-4 text-center max-w-4xl relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0AD9DC]/10 border border-[#0AD9DC]/20 text-[#0AD9DC] text-sm font-bold tracking-wide mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[#0AD9DC] animate-pulse" />
            LEARN FHE ON ETHEREUM
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight mb-6"
          >
            Master <span className="text-[#0AD9DC] font-mono">Confidential Computing</span> <br className="hidden md:block" /> 
            with coFHE
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Learn to build privacy-preserving smart contracts using Fully Homomorphic Encryption. Interactive lessons, hands-on code playgrounds, and real-world examples.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to={createPageUrl('Learn')}>
              <Button size="lg" className="bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold rounded-full px-8 h-14 text-lg w-full sm:w-auto">
                Start Learning
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to={createPageUrl('Learn')}>
              <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5 rounded-full px-8 h-14 text-lg w-full sm:w-auto">
                View Curriculum
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="bg-white py-24 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={ShieldCheck}
              title="Privacy-First Development"
              description="Learn to encrypt data on-chain while still performing computations. Build apps that protect user data by default."
            />
            <FeatureCard 
              icon={Terminal}
              title="Interactive Playgrounds"
              description="Write and test coFHE code directly in your browser with instant feedback. No setup required."
            />
            <FeatureCard 
              icon={Zap}
              title="Self-Paced Learning"
              description="Progress at your own speed with tracked achievements, badges, and milestones as you master FHE."
            />
          </div>
        </div>
      </section>

      {/* Modules Preview */}
      <section className="py-24 bg-[#011623]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Learning Modules</h2>
              <p className="text-slate-400 max-w-xl">
                Progress through comprehensive modules covering everything from FHE basics to advanced coFHE patterns.
              </p>
            </div>
            <Link to={createPageUrl('Learn')}>
              <Button variant="ghost" className="text-[#0AD9DC] hover:text-[#0AD9DC]/80 hover:bg-[#0AD9DC]/10">
                View All Modules <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {previewModules.map((module) => (
               <div key={module.id} className="h-[380px]">
                 <ModuleCard 
                  module={module} 
                  progress={{ completedLessons: [] }} // Empty for landing
                  isLocked={false}
                  onClick={() => {}} // No-op on landing, link wraps it? No, UI spec says buttons.
                 />
               </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
      <div className="w-12 h-12 bg-[#0AD9DC]/10 rounded-xl flex items-center justify-center mb-6 text-[#0AD9DC]">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}