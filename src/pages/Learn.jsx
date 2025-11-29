import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { CURRICULUM } from '@/components/learn/curriculum';
import ModuleCard from '@/components/modules/ModuleCard';
import ModulePathItem from '@/components/learn/ModulePathItem';
import BadgeStrip from '@/components/learn/BadgeStrip';
import PlaygroundCard from '@/components/learn/PlaygroundCard';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, Terminal, PlayCircle } from 'lucide-react';

export default function Learn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser) {
          // Prioritize passed state to avoid stale DB reads
          if (location.state?.progress && location.state.progress.user_id === currentUser.id) {
              setProgress(location.state.progress);
              setLoading(false);
              return;
          }

          // Fetch progress from DB
          const res = await base44.entities.UserProgress.list({
            user_id: currentUser.id
          });
          
          if (res.length > 0) {
            // Progress exists
            let currentP = res[0];
            
            // SELF-HEALING: Check for missed module completions
            // Sometimes a user might finish lessons but the module completion event wasn't captured
            let updatesNeeded = false;
            const missingModules = [];
            const currentCompletedModules = currentP.completed_modules || [];
            const currentCompletedLessons = currentP.completed_lessons || [];

            CURRICULUM.forEach(mod => {
                const allLessonsDone = mod.lessons.every(l => currentCompletedLessons.includes(l.id));
                if (allLessonsDone && !currentCompletedModules.includes(mod.id)) {
                    missingModules.push(mod.id);
                    updatesNeeded = true;
                }
            });

            if (updatesNeeded) {
                const newCompletedModules = [...currentCompletedModules, ...missingModules];
                // Calculate new XP if needed (optional, but good for consistency)
                // For now, just syncing the unlock status is the priority
                const updated = await base44.entities.UserProgress.update(currentP.id, {
                    completed_modules: newCompletedModules
                });
                currentP = updated;
            }

            setProgress(currentP);
            
            // Background sync display_name if needed
            if (!currentP.display_name && currentUser.email) {
                base44.entities.UserProgress.update(currentP.id, {
                    display_name: currentUser.email.split('@')[0]
                });
            }
          } else {
            // Initialize progress if none exists
            const newProgress = await base44.entities.UserProgress.create({
              user_id: currentUser.id,
              display_name: currentUser.email?.split('@')[0] || 'Anonymous',
              xp: 0,
              completed_lessons: [],
              completed_modules: [],
              badges: []
            });
            setProgress(newProgress);
          }
        }
      } catch (e) {
        console.error("Auth/Progress error", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [location.state]);

  const handleModuleClick = (module) => {
    // Find the first incomplete lesson or the first lesson
    const firstLesson = module.lessons[0];
    // In a real app, we'd jump to last accessed lesson.
    navigate(`${createPageUrl('Lesson')}?module=${module.slug}&lesson=${firstLesson.id}`);
  };

  if (loading) return <div className="min-h-screen bg-[#011623] flex items-center justify-center text-[#0AD9DC]">Loading...</div>;

  // Calculate Stats
  const xp = progress?.xp || 0;
  const completedModulesCount = progress?.completed_modules?.length || 0;
  const totalModules = CURRICULUM.length;
  const progressPercent = Math.round((completedModulesCount / totalModules) * 100);

  // Calculate Next Lesson (Resume Logic)
  let nextLessonUrl = null;
  let nextLessonTitle = "Start Learning";
  
  for (const module of CURRICULUM) {
    const completedLessons = progress?.completed_lessons || [];
    const incompleteLesson = module.lessons.find(l => !completedLessons.includes(l.id));
    
    // Check if module is locked (previous module not complete)
    const moduleIndex = CURRICULUM.findIndex(m => m.id === module.id);
    const prevModule = CURRICULUM[moduleIndex - 1];
    const isLocked = moduleIndex > 0 && !progress?.completed_modules?.includes(prevModule.id);
    
    if (incompleteLesson && !isLocked) {
      nextLessonUrl = `${createPageUrl('Lesson')}?module=${module.slug}&lesson=${incompleteLesson.id}`;
      nextLessonTitle = `Continue: ${incompleteLesson.title}`;
      break;
    }
  }
  
  // Fallback for brand new user or all complete
  if (!nextLessonUrl && CURRICULUM.length > 0) {
      // If nothing incomplete found, check if user is brand new (no progress) or finished everything
      if (!progress || progress.completed_lessons.length === 0) {
          const firstMod = CURRICULUM[0];
          nextLessonUrl = `${createPageUrl('Lesson')}?module=${firstMod.slug}&lesson=${firstMod.lessons[0].id}`;
          nextLessonTitle = "Start: " + firstMod.lessons[0].title;
      } else {
          // All done? Point to the last lesson of last module or just stay on dashboard
           const lastMod = CURRICULUM[CURRICULUM.length - 1];
           const lastLesson = lastMod.lessons[lastMod.lessons.length - 1];
           nextLessonUrl = `${createPageUrl('Lesson')}?module=${lastMod.slug}&lesson=${lastLesson.id}`;
           nextLessonTitle = "Review: " + lastLesson.title;
      }
  }

  return (
    <div className="min-h-screen bg-[#011623] pb-20">
      
      {/* Dashboard Header */}
      <div className="bg-[#022031] border-b border-white/5 pt-10 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0AD9DC] to-blue-600 flex items-center justify-center text-[#011623] font-bold text-2xl">
                  {user?.email?.[0].toUpperCase() || '?'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Welcome back, <span className="text-[#0AD9DC]">{user?.email?.split('@')[0] || 'Explorer'}</span>
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-slate-400 text-sm">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-amber-400" /> {xp} XP
                    </span>
                    <span className="flex items-center gap-1">
                      <Terminal className="w-4 h-4 text-purple-400" /> Level {Math.floor(xp / 1000) + 1}
                    </span>
                  </div>
                  
                  {/* Resume Button */}
                  <div className="mt-6">
                    <Link to={nextLessonUrl}>
                        <Button className="bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold px-8 py-6 rounded-full text-lg shadow-[0_0_20px_rgba(10,217,220,0.3)] hover:shadow-[0_0_30px_rgba(10,217,220,0.5)] transition-all">
                            <PlayCircle className="w-5 h-5 mr-2" />
                            {nextLessonTitle}
                        </Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Global Progress */}
              <div className="w-full max-w-md">
                <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                  <span>Overall Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#0AD9DC] transition-all duration-1000" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Badges Widget */}
            <div className="bg-[#011623]/50 p-4 rounded-xl border border-white/5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Badges</p>
              <BadgeStrip earnedBadges={progress?.badges || []} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-8">
        
        {/* Modules Path */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white mt-8 mb-10">Learning Path</h2>

          <div className="max-w-4xl mx-auto relative space-y-8">
            {/* Connecting Line */}
            <div className="absolute left-[35px] top-4 bottom-4 w-0.5 bg-white/5 -z-10" />

            {CURRICULUM.map((module, index) => {
              // Module Locking Logic
              // Module 0 is always unlocked.
              // Module N is unlocked if Module N-1 is in completed_modules
              const prevModule = CURRICULUM[index - 1];
              const isLocked = index > 0 && !progress?.completed_modules?.includes(prevModule.id);

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