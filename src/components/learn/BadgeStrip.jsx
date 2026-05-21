import React from 'react';
import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BADGES } from './badges';
import { findBadgeStatus } from '@/lib/utils';

export default function BadgeStrip({ earnedBadges = [] }) {
  return (
    <div className="flex flex-wrap gap-4">
      <TooltipProvider>
        {BADGES.map((badge) => {
          const status = findBadgeStatus(badge.id, earnedBadges);
          const isUnlocked = status !== 'locked';
          const isPending = status === 'pending';
          const isMinted = status === 'minted';

          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger>
                <motion.div
                  initial={false}
                  animate={{ scale: isUnlocked ? 1 : 0.95, opacity: isUnlocked ? 1 : 0.5 }}
                  className={`
                    relative flex items-center justify-center w-12 h-12 rounded-full border-2
                    ${isMinted ? `${badge.bg} ${badge.border} ${badge.color}` : isPending ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300' : 'bg-slate-800 border-slate-700 text-slate-600'}
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
                <p className="text-xs text-slate-400">{isMinted ? 'Minted' : isPending ? 'Completed • Mint Pending' : 'Locked'}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}