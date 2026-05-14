import { motion } from 'framer-motion';
import { ArrowUpRight, Terminal } from 'lucide-react';

export default function PlaygroundCard({ title, description }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group relative bg-[#022031] border border-white/5 rounded-2xl p-1 overflow-hidden hover:border-[#0AD9DC]/50 transition-all duration-300 cursor-pointer"
    >
      {/* Inner Card */}
      <div className="bg-[#011623] rounded-xl p-6 h-full relative z-10 overflow-hidden flex flex-col">
          {/* Hover Gradient BG */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0AD9DC]/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Header */}
          <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="bg-gradient-to-br from-[#022031] to-[#011623] w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-[#0AD9DC]/30 transition-colors shadow-inner">
                <Terminal className="w-6 h-6 text-[#0AD9DC]" />
              </div>
              
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-[#0AD9DC] group-hover:text-[#011623] transition-all">
                  <ArrowUpRight className="w-4 h-4" />
              </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#0AD9DC] transition-colors relative z-10">{title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1 relative z-10">{description}</p>
          
          <div className="flex items-center text-xs font-bold tracking-wider text-slate-500 uppercase relative z-10">
            <span className="group-hover:text-[#0AD9DC] transition-colors">Launch Environment</span>
          </div>
      </div>
      
      {/* Border Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0AD9DC] to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl -z-10" />
    </motion.div>
  );
}