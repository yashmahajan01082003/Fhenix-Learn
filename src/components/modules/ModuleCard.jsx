import { motion } from 'framer-motion';
import { Clock, CheckCircle, Lock, PlayCircle } from 'lucide-react';

export default function ModuleCard({ module, progress, isLocked, onClick }) {
  const { title, description, estimatedHours, lessons } = module;
  
  const completedCount = progress?.completedLessons?.filter(lid => 
    lessons.some(l => l.id === lid)
  ).length || 0;
  
  const totalLessons = lessons.length;
  const percent = Math.round((completedCount / totalLessons) * 100);
  const isCompleted = percent === 100;

  // Difficulty removed

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`
        relative flex flex-col p-6 rounded-2xl border transition-all duration-300 h-full
        ${isLocked 
          ? 'bg-[#011623] border-white/5 opacity-60 cursor-not-allowed' 
          : 'bg-[#022031] border-white/10 hover:border-[#0AD9DC]/50 hover:shadow-[0_0_30px_-10px_rgba(10,217,220,0.3)] cursor-pointer'
        }
      `}
      onClick={!isLocked ? onClick : undefined}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${isLocked ? 'bg-white/5' : 'bg-[#0AD9DC]/10'}`}>
          {isLocked ? (
            <Lock className="w-6 h-6 text-slate-500" />
          ) : isCompleted ? (
            <CheckCircle className="w-6 h-6 text-[#0AD9DC]" />
          ) : (
            <PlayCircle className="w-6 h-6 text-[#0AD9DC]" />
          )}
        </div>

      </div>

      {/* Content */}
      <div className="flex-1 mb-6">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{description}</p>
      </div>

      {/* Footer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{estimatedHours}h estimated</span>
          </div>
          <div>
            {completedCount}/{totalLessons} lessons
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            className={`h-full rounded-full ${isCompleted ? 'bg-green-400' : 'bg-[#0AD9DC]'}`}
          />
        </div>
      </div>
    </motion.div>
  );
}