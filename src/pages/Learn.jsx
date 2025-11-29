import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CURRICULUM } from '@/components/learn/curriculum';
import ModuleCard from '@/components/modules/ModuleCard';
import ModulePathItem from '@/components/learn/ModulePathItem';
import BadgeStrip from '@/components/learn/BadgeStrip';
import PlaygroundCard from '@/components/learn/PlaygroundCard';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, Terminal, PlayCircle } from 'lucide-react';
import { useUserProgress } from '@/components/UserProgressContext';

export default function Learn() {
  const navigate = useNavigate();
  const { user, progress, loading } = useUserProgress();

  const handleModuleClick = (module) => {
    const firstLesson = module.lessons[0];
    navigate(`${createPageUrl('Lesson')}?module=${module.slug}&lesson=${firstLesson.id}`);
  };

  if (loading) return null;

  const xp = progress?.xp || 0;
  const completedModulesCount = progress?.completed_modules?.length || 0;
  const totalModules = CURRICULUM.length;
  const progressPercent = Math.round((completedModulesCount / totalModules) * 100);

  let nextLessonUrl = null;
  let nextLessonTitle = "Start Learning";
  
  for (const module of CURRICULUM) {
    const completedLessons = progress?.completed_lessons || [];
    const incompleteLesson = module.lessons.find(l => !completedLessons.includes(l.id));
    
    const moduleIndex = CURRICULUM.findIndex(m => m.id === module.id);
    const prevModule = CURRICULUM[moduleIndex - 1];
    const isLocked = moduleIndex > 0 && !progress?.completed_modules?.includes(prevModule.id);
    
    if (incompleteLesson && !isLocked) {
      nextLessonUrl = `${createPageUrl('Lesson')}?module=${module.slug}&lesson=${incompleteLesson.id}`;
      nextLessonTitle = `Continue: ${incompleteLesson.title}`;
      break;
    }
  }
  
  if (!nextLessonUrl && CURRICULUM.length > 0) {
      if (!progress || progress.completed_lessons.length === 0) {
          const firstMod = CURRICULUM[0];
          nextLessonUrl = `${createPageUrl('Lesson')}?module=${firstMod.slug}&lesson=${firstMod.lessons[0].id}`;
          nextLessonTitle = "Start: " + firstMod.lessons[0].title;
      } else {
           const lastMod = CURRICULUM[CURRICULUM.length - 1];
           const lastLesson = lastMod.lessons[lastMod.lessons.length - 1];
           nextLessonUrl = `${createPageUrl('Lesson')}?module=${lastMod.slug}&lesson=${lastLesson.id}`;
           nextLessonTitle = "Review: " + lastLesson.title;
      }
  }

  return (
    <div className="min-h-screen bg-[#011623] pb-20">
      
      {/* Modern Dashboard Header */}
      <div className="relative bg-[#011623] pt-8 pb-16 overflow-hidden border-b border-white/5">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-[#0AD9DC]/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
              <div className="grid lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Left: User Welcome & Main Action */}
                  <div className="lg:col-span-2 space-y-6">
                      {/* Welcome Text */}
                      <div>
                          <h1 className="text-3xl font-bold text-white mb-2">
                              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0AD9DC] to-blue-500">{user?.email?.split('@')[0] || 'Explorer'}</span>
                          </h1>
                          <p className="text-slate-400">Ready to continue your encrypted journey?</p>
                      </div>

                      {/* Continue Card */}
                      <div className="bg-gradient-to-br from-[#022031] to-[#011623] border border-white/10 rounded-2xl p-6 md:p-8 relative group overflow-hidden">
                           <div className="absolute inset-0 bg-[#0AD9DC]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                           
                           <div className="relative flex flex-col md:flex-row gap-6 items-center justify-between">
                              <div className="flex-1 space-y-3">
                                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0AD9DC]/10 text-[#0AD9DC] text-xs font-bold uppercase tracking-wider">
                                      <Zap className="w-3.5 h-3.5" />
                                      Current Mission
                                  </div>
                                  <h2 className="text-2xl font-bold text-white">
                                      {nextLessonTitle.replace(/^(Start: |Continue: |Review: )/, '')}
                                  </h2>
                                  <p className="text-slate-400 text-sm">
                                      {nextLessonTitle.startsWith('Start') ? 'Begin this new lesson' : 'Continue where you left off'}
                                  </p>
                              </div>

                              <Link to={nextLessonUrl}>
                                  <Button className="h-14 px-8 bg-white text-[#011623] hover:bg-[#0AD9DC] font-bold rounded-xl text-lg transition-all shadow-lg hover:shadow-[#0AD9DC]/20 group-hover:scale-105">
                                      <PlayCircle className="w-5 h-5 mr-2" />
                                      {nextLessonTitle.split(':')[0]}
                                  </Button>
                              </Link>
                           </div>
                      </div>
                  </div>

                  {/* Right: Stats & Progress */}
                  <div className="space-y-6">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#022031] p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                              <span className="text-slate-500 text-xs uppercase font-bold">Current Level</span>
                              <div className="flex items-center gap-2 text-white font-bold text-xl">
                                   <Terminal className="w-5 h-5 text-purple-400" />
                                   {Math.floor(xp / 1000) + 1}
                              </div>
                          </div>
                          <div className="bg-[#022031] p-4 rounded-xl border border-white/5 flex flex-col gap-2">
                              <span className="text-slate-500 text-xs uppercase font-bold">Total XP</span>
                               <div className="flex items-center gap-2 text-white font-bold text-xl">
                                   <Trophy className="w-5 h-5 text-amber-400" />
                                   {xp}
                              </div>
                          </div>
                      </div>

                      {/* Global Progress */}
                      <div className="bg-[#022031] p-5 rounded-xl border border-white/5">
                           <div className="flex justify-between items-end mb-3">
                              <span className="text-slate-400 text-sm font-medium">Curriculum Progress</span>
                              <span className="text-[#0AD9DC] font-bold text-lg">{progressPercent}%</span>
                           </div>
                           <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                  className="h-full bg-gradient-to-r from-[#0AD9DC] to-blue-500 transition-all duration-1000" 
                                  style={{ width: `${progressPercent}%` }}
                              />
                           </div>
                      </div>

                       {/* Badges Mini Widget */}
                      <div className="bg-[#022031]/50 p-4 rounded-xl border border-white/5">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Achievements</p>
                          <BadgeStrip earnedBadges={progress?.badges || []} />
                      </div>
                  </div>

              </div>
          </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        
        {/* Modules Path */}
        <div className="mb-20 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
             <h2 className="text-2xl font-bold text-white">Learning Path</h2>
             <div className="h-px flex-1 bg-white/10 ml-8" />
          </div>

          <div className="space-y-0">
            {CURRICULUM.map((module, index) => {
              // Module Locking Logic
              const prevModule = CURRICULUM[index - 1];
              const isLocked = index > 0 && !progress?.completed_modules?.includes(prevModule.id);
              const isLast = index === CURRICULUM.length - 1;

              return (
                <ModulePathItem
                  key={module.id}
                  index={index}
                  module={module}
                  progress={{ 
                      completedLessons: progress?.completed_lessons || [],
                      completedModules: progress?.completed_modules || []
                  }}
                  isLocked={isLocked}
                  isLast={isLast}
                  onClick={() => handleModuleClick(module)}
                />
              );
            })}
          </div>
        </div>

        {/* Playgrounds Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-6">Sandboxes & Tools</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <PlaygroundCard 
              title="Encryption Playground" 
              description="Experiment with client-side encryption using cofhejs before sending to chain."
            />
            <PlaygroundCard 
              title="FHE Operations" 
              description="Test basic homomorphic operations like add, sub, and bitwise logic."
            />
             <PlaygroundCard 
              title="Permission Generator" 
              description="Generate and sign access permits to view encrypted state."
            />
          </div>
        </div>

      </div>
    </div>
  );
}