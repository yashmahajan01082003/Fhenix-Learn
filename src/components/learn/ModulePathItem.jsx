import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, Play, ChevronRight, Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ModulePathItem({ module, index, progress, isLocked, onClick }) {
  const { title, description, estimatedHours, lessons } = module;
  
  const completedCount = progress?.completedLessons?.filter(lid => 
    lessons.some(l => l.id === lid)
  ).length || 0;
  
  const totalLessons = lessons.length;
  const percent = Math.round((completedCount / totalLessons) * 100);
  
  // Use explicit module completion if available, otherwise fallback to percentage
  const isExplicitlyCompleted = progress?.completedModules?.includes(module.id);
  const isCompleted = isExplicitlyCompleted || percent === 100;
  const isStarted = percent > 0 && percent < 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative pl-24 py-2 transition-all duration-500", 
        isLocked ? "opacity-60" : "opacity-100"
      )}
    >
       {/* Marker & Number */}
       <div className="absolute left-2 top-2 flex flex-col items-center z-10 group">
          <div className={cn(
             "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 relative bg-[#011623]",
             isCompleted ? "border-green-500 text-green-500" : 
             isLocked ? "border-white/10 text-slate-600" :
             "border-[#0AD9DC] text-[#0AD9DC] shadow-[0_0_20px_-5px_rgba(10,217,220,0.5)]"
          )}>
             {isLocked ? (
                <Lock className="w-6 h-6" />
             ) : isCompleted ? (
                <CheckCircle className="w-6 h-6" />
             ) : (
                <span className="text-xl font-bold font-mono">{String(index + 1).padStart(2, '0')}</span>
             )}
          </div>
       </div>

       {/* Main Card */}
       <div 
         onClick={!isLocked ? onClick : undefined}
         className={cn(
            "bg-[#022031] border border-white/5 rounded-2xl p-6 md:p-8 transition-all group relative overflow-hidden",
            !isLocked && "hover:border-[#0AD9DC]/30 hover:bg-[#022538] cursor-pointer hover:shadow-lg hover:shadow-[#0AD9DC]/5"
         )}
       >
         {/* Progress Background for Active Module */}
         {!isLocked && !isCompleted && isStarted && (
            <div 
                className="absolute bottom-0 left-0 h-1 bg-[#0AD9DC]/20 w-full"
            >
                <div className="h-full bg-[#0AD9DC]" style={{ width: `${percent}%` }} />
            </div>
         )}

         <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
             <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                    <h3 className={cn("text-xl font-bold transition-colors", isLocked ? "text-slate-500" : "text-white group-hover:text-[#0AD9DC]")}>
                        {title}
                    </h3>
                    {isCompleted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-wider">
                            Completed
                        </span>
                    )}
                </div>
                
                <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                    {description}
                </p>
                
                <div className="flex items-center gap-6 text-xs font-medium text-slate-500 pt-2">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{estimatedHours}h</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{completedCount}/{totalLessons} Lessons</span>
                    </div>

                </div>
             </div>

             {!isLocked && (
                 <div className="shrink-0">
                     <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-[#0AD9DC] group-hover:text-[#011623] transition-all">
                         <ChevronRight className="w-5 h-5" />
                     </div>
                 </div>
             )}
         </div>
       </div>
    </motion.div>
  );
}