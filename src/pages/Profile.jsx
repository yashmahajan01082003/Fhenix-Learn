import React from 'react';
import { loadCurriculum } from '@/lib/curriculum-loader';
import { BADGES } from '@/components/learn/badges';
import { motion } from 'framer-motion';
import { Trophy, Terminal, Award, Lock, BookOpen, CheckCircle, Clock, Edit2, X, Play } from 'lucide-react';
import { useUserProgress } from '@/components/UserProgressContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { findBadgeStatus } from '@/lib/utils';

export default function Profile() {
    const CURRICULUM = loadCurriculum();
    const { user, progress, loading, updateProgress } = useUserProgress();
    const [isEditing, setIsEditing] = React.useState(false);
    const [newName, setNewName] = React.useState('');

    const handleSaveName = () => {
        if (newName.trim()) {
            updateProgress({ display_name: newName.trim() });
            setIsEditing(false);
        }
    };

    if (loading) return null; // Layout handles loading
    if (!user) return <div className="min-h-screen bg-[#011623] flex items-center justify-center text-white">Please log in to view your profile.</div>;

    const xp = progress?.xp || 0;
    const level = Math.floor(xp / 1000) + 1;
    const earnedBadgeIds = (progress?.badges || []).map((badge) => (typeof badge === 'string' ? badge : badge?.id)).filter(Boolean);
    const completedLessonIds = progress?.completed_lessons || [];

    // Calculate totals
    const totalLessons = CURRICULUM.reduce((acc, mod) => acc + mod.lessons.length, 0);
    const totalCompletedLessons = completedLessonIds.length;
    const globalProgress = Math.round((totalCompletedLessons / totalLessons) * 100);

    return (
        <div className="min-h-screen bg-[#011623] pb-20">
            {/* Header Profile Card */}
            <div className="bg-[#022031] border-b border-white/5 pt-12 pb-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#0AD9DC] to-blue-600 flex items-center justify-center text-[#011623] font-bold text-4xl shadow-[0_0_40px_-10px_rgba(10,217,220,0.5)]">
                            {(user.email ? user.email[0] : (user.wallet?.address?.[2] || '?')).toUpperCase()}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-white font-bold text-2xl focus:outline-none focus:border-[#0AD9DC]"
                                            autoFocus
                                        />
                                        <button onClick={handleSaveName} className="p-1 hover:text-[#0AD9DC] text-green-400">
                                            <CheckCircle className="w-6 h-6" />
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="p-1 hover:text-red-400 text-slate-500">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-4xl font-bold text-white">
                                            {progress?.display_name || (user.email ? user.email.split('@')[0] : `User ${user.wallet?.address?.slice(0, 6)}`)}
                                        </h1>
                                        <button onClick={() => { setNewName(progress?.display_name || (user.email ? user.email.split('@')[0] : `User ${user.wallet?.address?.slice(0, 6)}`)); setIsEditing(true); }} className="text-slate-500 hover:text-[#0AD9DC] transition-colors">
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400">
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                    <Terminal className="w-4 h-4 text-[#0AD9DC]" /> Level {level}
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                    <Trophy className="w-4 h-4 text-amber-400" /> {xp} XP
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                    <Award className="w-4 h-4 text-purple-400" /> {earnedBadgeIds.length} Badges
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8">
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Stats & Badges */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* XP Progress */}
                        <div className="bg-[#022031] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-white font-bold mb-4">Current Level Progress</h3>
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                                <span>Level {level}</span>
                                <span>Level {level + 1}</span>
                            </div>
                            <div className="h-4 bg-black rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(xp % 1000) / 10}%` }}
                                    className="h-full bg-gradient-to-r from-[#0AD9DC] to-blue-500"
                                />
                            </div>
                            <p className="text-center text-xs text-slate-500 mt-2">{1000 - (xp % 1000)} XP to next level</p>
                        </div>

                        {/* Badges Grid */}
                        <div className="bg-[#022031] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-white font-bold mb-6">Achievements</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {BADGES.map(badge => {
                                    const status = findBadgeStatus(badge.id, progress?.badges || []);
                                    const isUnlocked = status !== 'locked';
                                    const isPending = status === 'pending';
                                    const isMinted = status === 'minted';
                                    return (
                                        <div key={badge.id} className="flex flex-col items-center gap-2 group">
                                            <div className={`
                                        w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all
                                        ${isMinted ? `${badge.bg} ${badge.border} ${badge.color} shadow-[0_0_15px_-5px_currentColor]` : isPending ? 'bg-yellow-500/10 border-yellow-400 text-yellow-300 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/5 text-slate-600 grayscale'}
                                    `}>
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <span className={`text-[10px] text-center font-medium ${isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>
                                                {badge.name}
                                            </span>
                                            {isPending && <span className="text-[10px] text-yellow-300 uppercase">Pending</span>}
                                            {isMinted && <span className="text-[10px] text-green-300 uppercase">Minted</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detailed Progress */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#022031] border border-white/5 rounded-2xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-white">Curriculum Progress</h2>
                                <div className="text-[#0AD9DC] font-bold">{globalProgress}% Complete</div>
                            </div>

                            <div className="space-y-6">
                                {CURRICULUM.map(module => {
                                    const modLessons = module.lessons;
                                    const modCompletedCount = modLessons.filter(l => completedLessonIds.includes(l.id)).length;
                                    const modTotal = modLessons.length;
                                    const modPercent = Math.round((modCompletedCount / modTotal) * 100);
                                    const isDone = modPercent === 100;

                                    return (
                                        <Link
                                            key={module.id}
                                            to={`${createPageUrl('Lesson')}?module=${module.slug}&lesson=${module.lessons[0]?.id}`}
                                            className="block bg-black/20 rounded-xl p-5 border border-white/5 hover:border-[#0AD9DC]/50 transition-colors group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className={`font-bold text-lg group-hover:text-[#0AD9DC] transition-colors ${isDone ? 'text-green-400' : 'text-white'}`}>
                                                        {module.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1">{module.difficulty} • {module.estimatedHours}h</p>
                                                </div>
                                                {isDone ? <CheckCircle className="text-green-500 w-5 h-5" /> : <Play className="text-slate-600 w-5 h-5 group-hover:text-[#0AD9DC]" />}
                                            </div>

                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${isDone ? 'bg-green-500' : 'bg-[#0AD9DC]'}`}
                                                    style={{ width: `${modPercent}%` }}
                                                />
                                            </div>

                                            {/* Detailed lesson list hidden as requested */}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}