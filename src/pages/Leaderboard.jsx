import React, { useState, useEffect } from 'react';
import { Trophy, Medal, User, Crown, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/leaderboard?limit=50');
        if (res.ok) {
          const data = await res.json();
          // Map the data to the format the Leaderboard expects
          const formattedLeaders = data.map(leader => ({
            user_id: leader.user_id,
            display_name: leader.display_name || `User ${leader.user_id.slice(0, 6)}...`,
            xp: leader.xp,
            badges: leader.badges ? JSON.parse(leader.badges) : []
          }));
          setLeaders(formattedLeaders);
        } else {
          console.error("Failed to fetch leaderboard from API");
        }
      } catch (e) {
        console.error("Failed to fetch leaderboard", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 1: return <Medal className="w-6 h-6 text-slate-300" />;
      case 2: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="text-slate-500 font-bold w-6 text-center">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#011623] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0AD9DC]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#011623] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#0AD9DC]/10 text-[#0AD9DC] mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">CoFHE Leaderboard</h1>
          <p className="text-slate-400">Top pioneers mastering Encrypted Computation</p>
        </div>

        <div className="bg-[#022031] rounded-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-2 md:col-span-1 text-center">Rank</div>
            <div className="col-span-6 md:col-span-7">User</div>
            <div className="col-span-2 text-right">Badges</div>
            <div className="col-span-2 text-right">XP</div>
          </div>

          {/* List */}
          <div className="divide-y divide-white/5">
            {leaders.map((leader, index) => {
              const isMe = currentUser && leader.user_id === currentUser.id;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={leader.user_id}
                  className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors ${isMe ? 'bg-[#0AD9DC]/5' : ''}`}
                >
                  <div className="col-span-2 md:col-span-1 flex justify-center">
                    {getRankIcon(index)}
                  </div>
                  <div className="col-span-6 md:col-span-7 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                                    ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black' :
                        isMe ? 'bg-[#0AD9DC] text-[#011623]' : 'bg-white/10 text-slate-300'}
                                `}>
                      {leader.display_name ? leader.display_name[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <div className={`font-medium ${isMe ? 'text-[#0AD9DC]' : 'text-white'}`}>
                        {leader.display_name || 'Anonymous User'} {isMe && '(You)'}
                      </div>
                      <div className="text-xs text-slate-500">Level {Math.floor((leader.xp || 0) / 1000) + 1}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-right flex justify-end items-center gap-1 text-slate-400">
                    <Medal className="w-4 h-4" />
                    {leader.badges?.length || 0}
                  </div>
                  <div className="col-span-2 text-right font-mono font-bold text-[#0AD9DC]">
                    {(leader.xp || 0).toLocaleString()}
                  </div>
                </motion.div>
              );
            })}

            {leaders.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No pioneers yet. Be the first!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}