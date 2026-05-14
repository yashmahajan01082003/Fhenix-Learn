import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl, createLessonUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Code2, Zap, ArrowRight, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { loadCurriculum } from '@/lib/curriculum-loader';

const CURRICULUM = loadCurriculum() || [];
import ModuleCard from '@/components/modules/ModuleCard';
import PlaygroundCard from '@/components/learn/PlaygroundCard';
import { useUserProgress } from '@/components/UserProgressContext';

export default function Home() {
  const navigate = useNavigate();
  const { progress } = useUserProgress();

  // Only show first 3 modules as preview
  const previewModules = CURRICULUM.slice(0, 3);

  const handleModuleClick = (module) => {
    const firstLesson = module.lessons?.[0];
    if (firstLesson) {
      navigate(createLessonUrl(module, firstLesson));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#000B11]">

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden py-20">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#0AD9DC]/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

        <div className="container mx-auto px-4 text-center max-w-7xl relative z-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-slate-400 mb-8 tracking-widest uppercase text-sm font-bold"
          >
            Revolutionizing onchain apps privacy with FHE
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-display font-bold text-white leading-none mb-12"
          >
            <span className="block text-4xl md:text-6xl mb-4 text-slate-500 tracking-tight">Master</span>
            <span className="block text-7xl md:text-9xl lg:text-[9rem] xl:text-[11rem] leading-[0.8] tracking-tighter text-white relative select-none">
              <span className="text-white/10 font-light mx-2 hidden md:inline">(</span>
              confid<span className="text-[#0AD9DC]">*</span>ential
              <span className="text-white/10 font-light mx-2 hidden md:inline">)</span>
            </span>
            <span className="block text-4xl md:text-6xl mt-6 text-slate-500 tracking-tight">Computing</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Learn to build privacy-preserving smart contracts using Fully Homomorphic Encryption. Interactive lessons, hands-on code playgrounds, and real-world examples.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to={createPageUrl('Learn')} className="w-full sm:w-auto">
              <Button size="lg" className="bg-white hover:bg-slate-200 text-black font-bold rounded-none px-10 h-14 text-lg w-full font-display tracking-wide flex items-center justify-center gap-2 group">
                Start Learning
                <span className="group-hover:translate-x-1 transition-transform">❖</span>
              </Button>
            </Link>
            <Link to={createPageUrl('Learn')} className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="text-white hover:bg-transparent hover:text-[#0AD9DC] rounded-none px-8 h-14 text-lg w-full font-display tracking-wide group">
                View Curriculum
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="bg-[#011623] py-20 md:py-32 relative z-20 border-b border-white/5">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-fr">

            {/* Main Feature: Privacy First */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-7 bg-gradient-to-br from-[#0AD9DC]/10 to-[#011623] p-8 md:p-12 rounded-3xl border border-[#0AD9DC]/20 relative overflow-hidden group flex flex-col h-full"
            >
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
                <ShieldCheck className="w-32 h-32 text-[#0AD9DC]" />
              </div>
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#0AD9DC]/20 blur-[100px] rounded-full group-hover:bg-[#0AD9DC]/30 transition-all duration-500" />

              <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0AD9DC]/10 border border-[#0AD9DC]/20 text-[#0AD9DC] text-xs font-bold uppercase tracking-wider mb-6">
                    <ShieldCheck className="w-3 h-3" /> Core Philosophy
                  </div>
                  <h3 className="text-3xl md:text-5xl font-bold text-white mb-6 font-display tracking-tight">
                    Privacy-First <br /> Architecture
                  </h3>
                  <p className="text-slate-300 text-lg leading-relaxed max-w-md">
                    Stop treating privacy as an afterthought. Learn to build applications where data is encrypted by default, processing sensitive information on-chain without ever exposing it.
                  </p>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-4 text-sm font-mono text-slate-400">
                  <div className="flex items-center gap-2 bg-[#000B11]/50 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    euint32
                  </div>
                  <div className="flex items-center gap-2 bg-[#000B11]/50 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-75" />
                    FHE.decrypt
                  </div>
                  <div className="flex items-center gap-2 bg-[#000B11]/50 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150" />
                    Confidential
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column Stack */}
            <div className="md:col-span-5 flex flex-col gap-6 h-full">

              {/* Feature 2: Interactive */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex-1 bg-[#000B11] p-8 rounded-3xl border border-white/5 hover:border-[#0AD9DC]/30 transition-all duration-300 group relative overflow-hidden flex flex-col justify-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full group-hover:bg-blue-500/20 transition-all" />
                <Terminal className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-bold text-white mb-2">Browser-Native FHE</h3>
                <p className="text-slate-400 leading-relaxed">
                  Write, compile, and test FHE smart contracts directly in your browser. No complex local environment setup required.
                </p>
              </motion.div>

              {/* Feature 3: Gamified */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex-1 bg-[#000B11] p-8 rounded-3xl border border-white/5 hover:border-[#0AD9DC]/30 transition-all duration-300 group relative overflow-hidden flex flex-col justify-center"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full group-hover:bg-yellow-500/20 transition-all" />
                <Zap className="w-10 h-10 text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-bold text-white mb-2">Gamified Mastery</h3>
                <p className="text-slate-400 leading-relaxed">
                  Earn XP, unlock exclusive badges, and track your progress as you master the art of confidential computing.
                </p>
              </motion.div>

            </div>
          </div>
        </div>
      </section>

      {/* Playgrounds Preview - Featured */}
      <section className="py-20 md:py-32 bg-[#011623] border-b border-white/5 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#0AD9DC]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-16 md:mb-24">
            <span className="inline-block py-1 px-3 rounded-full bg-[#0AD9DC]/10 border border-[#0AD9DC]/20 text-[#0AD9DC] text-xs font-bold tracking-wider uppercase mb-4">
              Interactive Learning
            </span>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 font-display tracking-tight">
              Interactive <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0AD9DC] to-blue-500">Sandboxes</span>
            </h2>
            <p className="text-slate-400 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
              Don't just read about FHE—experience it. Experiment with encryption, visualize oblivious execution, and audit code in our browser-based playgrounds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="group h-full">
              <Link to="/encryption-playground" className="block h-full transform group-hover:-translate-y-2 transition-all duration-300">
                <PlaygroundCard
                  title="Encryption Playground"
                  description="Experiment with client-side encryption using the CoFHE SDK before sending to chain."
                />
              </Link>
            </div>
            <div className="group h-full">
              <Link to="/branching-simulator" className="block h-full transform group-hover:-translate-y-2 transition-all duration-300">
                <PlaygroundCard
                  title="Encrypted Branching"
                  description="Visualize how FHE.select() replaces if/else logic with oblivious execution."
                />
              </Link>
            </div>
            <div className="group h-full">
              <Link to="/leak-detector" className="block h-full transform group-hover:-translate-y-2 transition-all duration-300">
                <PlaygroundCard
                  title="Leak Detector"
                  description="Spot the security flaws in this interactive FHE audit game."
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Preview */}
      <section className="py-20 md:py-32 bg-[#00101a]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Learning Modules</h2>
              <p className="text-slate-400 max-w-2xl text-lg">
                Progress through comprehensive modules covering everything from FHE basics to advanced coFHE patterns.
              </p>
            </div>
            <Link to={createPageUrl('Learn')}>
              <Button variant="ghost" className="text-[#0AD9DC] hover:text-[#0AD9DC]/80 hover:bg-[#0AD9DC]/10 group">
                View All Modules <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {previewModules.map((module, index) => {
              // Logic to determine lock status (same as in Learn.js)
              const prevModule = CURRICULUM[index - 1];
              const isLocked = index > 0 && !progress?.completed_modules?.includes(prevModule?.id);

              return (
                <div key={module.id} className="h-full">
                  <ModuleCard
                    module={module}
                    progress={{ completedLessons: progress?.completed_lessons || [] }}
                    isLocked={isLocked}
                    onClick={() => handleModuleClick(module)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-[#011623] p-8 rounded-2xl border border-white/5 hover:border-[#0AD9DC]/30 transition-colors group">
      <div className="w-12 h-12 bg-[#0AD9DC]/10 rounded-xl flex items-center justify-center mb-6 text-[#0AD9DC] group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}