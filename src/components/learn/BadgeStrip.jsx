import React from 'react';
import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const BADGES = [
  { id: 'module-1', name: 'Privacy Pioneer', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20' },
  { id: 'module-2', name: 'Type Master', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { id: 'module-3', name: 'Architect', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  { id: 'module-4', name: 'Oblivious Coder', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
  { id: 'module-5', name: 'Gatekeeper', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  { id: 'module-6', name: 'Async Wizard', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
];

export default function BadgeStrip({ earnedBadges = [] }) {
  return (
    <div className="flex flex-wrap gap-4">
      <TooltipProvider>
        {BADGES.map((badge) => {
          const isUnlocked = earnedBadges.includes(badge.id);
          
          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger>
                <motion.div
                  initial={false}
                  animate={{ scale: isUnlocked ? 1 : 0.95, opacity: isUnlocked ? 1 : 0.5 }}
                  className={`
                    relative flex items-center justify-center w-12 h-12 rounded-full border-2
                    ${isUnlocked ? `${badge.bg} ${badge.border} ${badge.color}` : 'bg-slate-800 border-slate-700 text-slate-600'}
                    transition-all duration-300
                  `}
                >
                  {isUnlocked ? (
                    <Award className="w-6 h-6" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-bold">{badge.name}</p>
                <p className="text-xs text-slate-400">{isUnlocked ? 'Unlocked' : 'Locked'}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}