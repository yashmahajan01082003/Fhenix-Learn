import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Play } from 'lucide-react';

export default function PlaygroundCard({ title, description }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="group relative bg-[#022031] border border-white/5 rounded-2xl p-6 overflow-hidden hover:border-[#0AD9DC]/30 transition-all"
    >
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Code2 className="w-24 h-24" />
      </div>
      
      <div className="relative z-10">
        <div className="bg-[#0AD9DC]/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-[#0AD9DC]">
          <Code2 className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-4">{description}</p>
        
        <div className="flex items-center text-[#0AD9DC] text-sm font-medium group-hover:underline">
          <Play className="w-3 h-3 mr-2" />
          Open Sandbox
        </div>
      </div>
    </motion.div>
  );
}