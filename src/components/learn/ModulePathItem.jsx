import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, Play, ChevronRight, Clock, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ModulePathItem({ module, index, progress, isLocked, onClick, isLast }) {
  const { title, description, estimatedHours, lessons } = module;
  
  const completedCount = progress?.completedLessons?.filter(lid => 
    lessons.some(l => l.id === lid)
  ).length || 0;
  
  const totalLessons = lessons.length;
  const percent = Math.round((completedCount / totalLessons) * 100);
  
  const isExplicitlyCompleted = progress?.completedModules?.includes(module.id);
  const isCompleted = isExplicitlyCompleted || percent === 100;
  const isStarted = percent > 0 && percent < 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "flex gap-6 md:gap-10 group", 
        isLocked ? "opacity-50 grayscale" : "opacity-100"
      )}
    >
       {/* Timeline Column */}
       <div className="flex flex-col items-center shrink-0 relative">
          {/* Connector Line */}
          {!isLast && (
            <div className="absolute top-14 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent md:to-white/5 -z-10 left-1/2 -translate-x-1/2 h-[calc(100%+2rem)]" />
          )}
          
          {/* Marker */}
          <div className={cn(
             "w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 relative z-10",
             "backdrop-blur-xl bg-[#011623]/80",
             isCompleted ? "border-green-500 text-green-500 shadow-[0_0_20px_-5px_rgba(34,197,94,0.5)]" : 
             isLocked ? "border-white/5 text-slate-700 bg-white/5" :
             "border-[#0AD9DC] text-[#0AD9DC] shadow-[0_0_30px_-10px_rgba(10,217,220,0.6)] scale-110"
          )}>
             {isLocked ? (
                <Lock className="w-5 h-5 md:w-6 md:h-6" />
             ) : isCompleted ? (
                <CheckCircle className="w-6 h-6 md:w-7 md:h-7" />
             ) : (
                <span className="text-lg md:text-2xl font-bold font-mono">{String(index + 1).padStart(2, '0')}</span>
             )}
          </div>
       </div>

       {/* Main Card */}
       <div className="flex-1 pb-12 min-w-0">
         <div 
           onClick={!isLocked ? onClick : undefined}
           className={cn(
              "relative overflow-hidden rounded-2xl border transition-all duration-300 group-hover:scale-[1.01]",
              isLocked 
                ? "bg-white/5 border-white/5" 
                : "bg-[#022031] border-white/10 hover:border-[#0AD9DC]/50 hover:shadow-[0_0_30px_-10px_rgba(10,217,220,0.15)] cursor-pointer"
           )}
         >
            {/* Active State Glow */}
            {!isLocked && !isCompleted && (
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0AD9DC]/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-[#0AD9DC]/20 transition-colors" />
            )}

            <div className="p-6 md:p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className={cn("text-xl md:text-2xl font-bold text-white", !isLocked && "group-hover:text-[#0AD9DC] transition-colors")}>
                                {title}
                            </h3>
                            {isStarted && !isCompleted && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0AD9DC]/10 text-[#0AD9DC] border border-[#0AD9DC]/20 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> In Progress
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-3xl">
                            {description}
                        </p>
                    </div>

                    {!isLocked && (
                        <div className="hidden md:flex w-12 h-12 rounded-full bg-white/5 items-center justify-center text-slate-400 group-hover:bg-[#0AD9DC] group-hover:text-[#011623] transition-all shrink-0">
                            <ChevronRight className="w-6 h-6" />
                        </div>
                    )}
                </div>

                {/* Footer Stats & Progress */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                    <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{estimatedHours}h est.</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            <span>{completedCount}/{totalLessons} Lessons</span>
                        </div>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500">{percent}%</span>
                        <div className="w-20 md:w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                                className={cn("h-full rounded-full transition-all duration-1000", isCompleted ? "bg-green-500" : "bg-[#0AD9DC]")}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
         </div>
       </div>
    </motion.div>
  );
}