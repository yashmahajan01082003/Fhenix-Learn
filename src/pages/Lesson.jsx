import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { CURRICULUM } from '@/components/learn/curriculum';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Play, HelpCircle, Lock } from 'lucide-react';
import EncryptedOperationVisualizer from '@/components/learn/interactive/EncryptedOperationVisualizer';
import CodeCompare from '@/components/learn/interactive/CodeCompare';

const MarkdownComponents = {
  h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mt-10 mb-6 pb-4 border-b border-white/10" {...props} />,
  h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-[#0AD9DC] mt-10 mb-4" {...props} />,
  h3: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-8 mb-3" {...props} />,
  p: ({node, ...props}) => <p className="text-slate-300 leading-7 mb-4 text-lg" {...props} />,
  ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-6 text-slate-300 space-y-2 marker:text-[#0AD9DC]" {...props} />,
  ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-6 text-slate-300 space-y-2 marker:text-[#0AD9DC]" {...props} />,
  li: ({node, ...props}) => <li className="pl-2" {...props} />,
  blockquote: ({node, ...props}) => (
      <div className="border-l-4 border-[#0AD9DC] bg-[#0AD9DC]/5 p-6 my-8 rounded-r-lg italic text-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#0AD9DC]/10 to-transparent opacity-20 pointer-events-none" />
          {props.children}
      </div>
  ),
  code: ({node, inline, className, children, ...props}) => {
      if (inline) {
          return <code className="bg-[#0AD9DC]/10 text-[#0AD9DC] px-1.5 py-0.5 rounded text-sm font-mono border border-[#0AD9DC]/20" {...props}>{children}</code>;
      }
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : '';

      if (lang === 'visualizer') {
        return <EncryptedOperationVisualizer />;
      }
      
      if (lang === 'compare') {
        return <CodeCompare />;
      }

      return (
          <div className="relative my-8 rounded-xl overflow-hidden bg-[#00101a] border border-white/10 shadow-2xl group">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                  <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">{lang || 'code'}</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed">
                  <code className={className} {...props}>{children}</code>
              </pre>
          </div>
      );
  },
  table: ({node, ...props}) => <div className="overflow-x-auto my-8 rounded-lg border border-white/10"><table className="w-full border-collapse text-left" {...props} /></div>,
  th: ({node, ...props}) => <th className="border-b border-white/20 p-4 text-[#0AD9DC] font-bold text-sm uppercase tracking-wider bg-white/5" {...props} />,
  td: ({node, ...props}) => <td className="border-b border-white/10 p-4 text-slate-300 text-sm" {...props} />,
  a: ({node, ...props}) => <a className="text-[#0AD9DC] hover:underline decoration-[#0AD9DC]/50 underline-offset-4 transition-colors font-medium" {...props} />,
  hr: ({node, ...props}) => <hr className="border-white/10 my-10" {...props} />,
};

export default function Lesson() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  
  // Parse params
  const params = new URLSearchParams(window.location.search);
  const moduleSlug = params.get('module');
  const lessonId = params.get('lesson');

  // Find Data
  const currentModule = CURRICULUM.find(m => m.slug === moduleSlug);
  const currentLessonIndex = currentModule?.lessons.findIndex(l => l.id === lessonId);
  const currentLesson = currentModule?.lessons[currentLessonIndex];

  // State
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  useEffect(() => {
    const init = async () => {
      if (!currentModule || !currentLesson) return;
      
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser) {
          let p;
          
          // STRATEGY: Use passed state if available (fresher), otherwise fetch (potentially stale)
          if (location.state?.progress && location.state.progress.user_id === currentUser.id) {
             p = location.state.progress;
             // Refresh from DB in background just in case, but don't block
             base44.entities.UserProgress.list({ user_id: currentUser.id }).then(res => {
                 if(res.length > 0) {
                     // Only update if DB has MORE completed lessons than local state (merge logic could be complex, skipping for now to rely on passed state)
                 }
             });
          } else {
             const res = await base44.entities.UserProgress.list({ user_id: currentUser.id });
             if (res.length > 0) {
               p = res[0];
             } else {
                // Create progress record if it doesn't exist
                p = await base44.entities.UserProgress.create({
                  user_id: currentUser.id,
                  display_name: currentUser.email?.split('@')[0] || 'Anonymous',
                  xp: 0,
                  completed_lessons: [],
                  completed_modules: [],
                  badges: []
                });
             }
          }

          if (p) {
            setProgress(p);
            setIsCompleted(p.completed_lessons?.includes(currentLesson.id));

            // Sequential Lock Check
            const currentModuleIndex = CURRICULUM.findIndex(m => m.id === currentModule.id);
            const prevModule = currentModuleIndex > 0 ? CURRICULUM[currentModuleIndex - 1] : null;
            const isModuleLocked = prevModule && !p.completed_modules.includes(prevModule.id);
            
            const currentLessonIdx = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
            const prevLesson = currentLessonIdx > 0 ? currentModule.lessons[currentLessonIdx - 1] : null;
            // Check if previous lesson is unlocked. 
            const isLessonLocked = prevLesson && !p.completed_lessons.includes(prevLesson.id);

            if (isModuleLocked || isLessonLocked) {
                console.warn("Locked content accessed, redirecting.", { isModuleLocked, isLessonLocked, completed: p.completed_lessons });
                navigate(createPageUrl('Learn'));
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [moduleSlug, lessonId]);

  const handleComplete = async () => {
    if (!user || !progress) return;

    // Optimistic update
    setIsCompleted(true);

    // Prepare updates
    let newCompletedLessons = [...(progress.completed_lessons || [])];
    let newXP = progress.xp || 0;
    let xpGained = 0;

    // Only award for new completions
    if (!newCompletedLessons.includes(currentLesson.id)) {
      newCompletedLessons.push(currentLesson.id);
      newXP += 50; // 50 XP per challenge/lesson
      xpGained += 50;
    }

    let newCompletedModules = [...(progress.completed_modules || [])];
    let newBadges = [...(progress.badges || [])];

    // Check if module is finished
    const allLessonIds = currentModule.lessons.map(l => l.id);
    const allFinished = allLessonIds.every(id => newCompletedLessons.includes(id));
    
    if (allFinished && !newCompletedModules.includes(currentModule.id)) {
      newCompletedModules.push(currentModule.id);
      newXP += 100; // Bonus for module
      xpGained += 100;
      newBadges.push(currentModule.id); // Badge ID matches module ID
    }

    // If no new XP gained, we might still want to update badges/modules if they were somehow missed, 
    // but primarily we want to avoid calling update if nothing changed? 
    // For now, we always update to be safe, but we rely on the checks above for XP logic.

    try {
      // Optimistically update local state first to ensure responsiveness
      const updatedProgress = {
        ...progress,
        completed_lessons: newCompletedLessons,
        completed_modules: newCompletedModules,
        xp: newXP,
        badges: newBadges
      };
      setProgress(updatedProgress);

      // Then persist
      await base44.entities.UserProgress.update(progress.id, {
        completed_lessons: newCompletedLessons,
        completed_modules: newCompletedModules,
        xp: newXP,
        badges: newBadges
      });

      // Show Celebration ONLY if we finished the module (last lesson)
      const isLastLesson = currentLessonIndex === currentModule.lessons.length - 1;
      if (xpGained > 0 && isLastLesson) {
        setEarnedXP(xpGained);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }

    } catch (e) {
      console.error("Failed to save progress", e);
    }
  };

  const handleNext = () => {
    // Pass the current 'progress' state to the next route to prevent stale DB reads
    const state = { progress };

    if (currentLessonIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      navigate(`${createPageUrl('Lesson')}?module=${moduleSlug}&lesson=${nextLesson.id}`, { state });
    } else {
        // Next Module logic
        const currentModuleIndex = CURRICULUM.findIndex(m => m.id === currentModule.id);
        if (currentModuleIndex < CURRICULUM.length - 1) {
            const nextModule = CURRICULUM[currentModuleIndex + 1];
            navigate(`${createPageUrl('Lesson')}?module=${nextModule.slug}&lesson=${nextModule.lessons[0].id}`, { state });
        } else {
            navigate(createPageUrl('Learn'), { state: { progress } });
        }
    }
  };

  if (!currentModule || !currentLesson) return <div className="p-20 text-white text-center">Lesson not found</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#011623]">
      
      {/* Sidebar */}
      <aside className="w-80 bg-[#00101a] border-r border-white/5 overflow-y-auto hidden lg:block">
        <div className="p-6">
          <Link to={createPageUrl('Learn')} className="text-slate-400 hover:text-white text-sm flex items-center gap-2 mb-6">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h3 className="text-white font-bold mb-4">{currentModule.title}</h3>
          <div className="space-y-2">
            {currentModule.lessons.map((l, idx) => {
              const isActive = l.id === currentLesson.id;
              const isDone = progress?.completed_lessons?.includes(l.id);
              
              const previousLessonId = idx > 0 ? currentModule.lessons[idx - 1].id : null;
              // Explicit check: Unlocked if it is the first lesson, OR previous lesson is completed
              const isUnlocked = idx === 0 || (progress?.completed_lessons?.includes(previousLessonId));

              return (
                <div key={l.id} className={!isUnlocked ? 'opacity-50 pointer-events-none' : ''}>
                  <Link 
                    to={`${createPageUrl('Lesson')}?module=${moduleSlug}&lesson=${l.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${
                      isActive 
                        ? 'bg-[#0AD9DC]/10 text-[#0AD9DC] border border-[#0AD9DC]/20' 
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                    onClick={(e) => !isUnlocked && e.preventDefault()}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                      ${isDone ? 'bg-green-500/20 text-green-500' : isActive ? 'bg-[#0AD9DC]/20' : !isUnlocked ? 'bg-white/5 text-slate-600' : 'bg-white/5'}
                    `}>
                      {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : !isUnlocked ? <Lock className="w-3 h-3" /> : idx + 1}
                    </div>
                    <span className="line-clamp-2">{l.title}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className={`mx-auto p-6 md:p-10 ${currentLesson.type === 'sandbox' ? 'max-w-[1600px]' : 'max-w-4xl'}`}>

          {/* Celebration Overlay */}
          {showCelebration && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCelebration(false)} />
                <div className="relative bg-[#022031] border-2 border-[#0AD9DC] p-8 rounded-2xl text-center animate-in fade-in zoom-in duration-300 shadow-[0_0_50px_rgba(10,217,220,0.5)] min-w-[300px]">
                    <button 
                        onClick={() => setShowCelebration(false)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-white p-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold text-white mb-2">Lesson Completed!</h2>
                    <p className="text-[#0AD9DC] text-xl font-bold">+{earnedXP} XP</p>
                </div>
            </div>
          )}

          {/* Render Type */}
          {currentLesson.type === 'reading' && (
             <div className="max-w-none">
               <ReactMarkdown components={MarkdownComponents}>
                 {currentLesson.content}
               </ReactMarkdown>
             </div>
          )}

          {currentLesson.type === 'sandbox' && (
              <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
                  <h1 className="text-3xl font-bold text-white mb-6">{currentLesson.title}</h1>
                  <div className="grid lg:grid-cols-2 gap-6 flex-1 min-h-0">
                      {/* Instructions */}
                      <div className="bg-[#022031] border border-white/10 rounded-xl p-6 overflow-y-auto shadow-inner custom-scrollbar">
                          <ReactMarkdown components={MarkdownComponents}>{currentLesson.content}</ReactMarkdown>
                      </div>
                      
                      {/* Mock Editor */}
                      <div className="bg-black rounded-xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
                          <div className="bg-slate-900 px-4 py-2 border-b border-white/10 flex items-center justify-between">
                              <span className="text-xs text-slate-400 font-mono">Contract.sol</span>
                              <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs">
                                  <Play className="w-3 h-3 mr-1" /> Run
                              </Button>
                          </div>
                          <div className="flex-1 p-4 font-mono text-sm text-green-400 bg-black/50">
                              {/* Fake Code Editor Look */}
                              <div className="opacity-50 mb-2">// Write your code here</div>
                              <div>contract EncryptedCounter {'{'}</div>
                              <div className="pl-4">euint32 private counter;</div>
                              <div className="pl-4 text-slate-500">// ... more logic</div>
                              <div>{'}'}</div>
                          </div>
                          <div className="bg-slate-900 p-4 border-t border-white/10 h-32 font-mono text-xs">
                              <div className="text-slate-500 mb-1">Output:</div>
                              <div className="text-green-400">{'>'} Compilation successful</div>
                              <div className="text-slate-400">{'>'} Deploying to Fhenix Helium Testnet...</div>
                              <div className="text-blue-400 animate-pulse">{'>'} Waiting for transaction...</div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {currentLesson.type === 'quiz' && (
              <div className="max-w-2xl mx-auto mt-10 bg-[#022031] border border-white/10 rounded-2xl p-8">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0AD9DC]/20 text-[#0AD9DC] mb-6 mx-auto">
                      <HelpCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-white text-center mb-2">Knowledge Check</h2>
                  <p className="text-slate-400 text-center mb-8">Verify your understanding of {currentModule.title}</p>
                  
                  <div className="space-y-4">
                      {['FHE allows computing on encrypted data', 'FHE encrypts the blockchain itself', 'FHE is just for private payments'].map((opt, i) => (
                          <button
                              key={i}
                              onClick={() => setQuizAnswer(i)}
                              className={`w-full p-4 rounded-xl text-left transition-all border ${
                                  quizAnswer === i 
                                  ? 'bg-[#0AD9DC]/20 border-[#0AD9DC] text-white' 
                                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                              }`}
                          >
                              {opt}
                          </button>
                      ))}
                  </div>

                  <Button 
                    className="w-full mt-8 bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold"
                    onClick={() => {
                        setIsCompleted(true);
                        handleComplete();
                    }}
                    disabled={quizAnswer === null}
                  >
                      Submit Answer
                  </Button>
              </div>
          )}

          {/* Navigation Footer */}
          <div className="flex justify-between items-center mt-16 pt-8 border-t border-white/10">
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="text-slate-400 hover:text-white"
              >
                  Previous
              </Button>

              <div className="flex gap-3">
                  {!isCompleted && currentLesson.type !== 'quiz' && (
                      <Button 
                        onClick={handleComplete}
                        className="border border-[#0AD9DC] text-[#0AD9DC] hover:bg-[#0AD9DC]/10 bg-transparent"
                      >
                          Mark as Complete
                      </Button>
                  )}
                  
                  <div className="relative group">
                    <Button 
                      onClick={handleNext}
                      disabled={!isCompleted} 
                      className={`bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold transition-all duration-500 
                        ${!isCompleted ? 'opacity-0 pointer-events-none transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}
                    >
                        {currentLessonIndex === currentModule.lessons.length - 1 ? 'Next Module' : 'Next Lesson'} 
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
              </div>
          </div>
        </div>
      </main>
    </div>
  );
}