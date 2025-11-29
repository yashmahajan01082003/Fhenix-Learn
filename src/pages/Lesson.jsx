import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { CURRICULUM } from '@/components/learn/curriculum';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Play, Code, HelpCircle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Lesson() {
  const navigate = useNavigate();
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

  useEffect(() => {
    const init = async () => {
      if (!currentModule || !currentLesson) return;
      
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser) {
          const res = await base44.entities.UserProgress.list({ user_id: currentUser.id });
          if (res.length > 0) {
            const p = res[0];
            setProgress(p);
            setIsCompleted(p.completed_lessons?.includes(currentLesson.id));
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
    if (!newCompletedLessons.includes(currentLesson.id)) {
      newCompletedLessons.push(currentLesson.id);
    }

    let newXP = (progress.xp || 0) + 50; // 50 XP per lesson
    let newCompletedModules = [...(progress.completed_modules || [])];
    let newBadges = [...(progress.badges || [])];

    // Check if module is finished
    const allLessonIds = currentModule.lessons.map(l => l.id);
    const allFinished = allLessonIds.every(id => newCompletedLessons.includes(id));
    
    if (allFinished && !newCompletedModules.includes(currentModule.id)) {
      newCompletedModules.push(currentModule.id);
      newXP += 500; // Bonus for module
      newBadges.push(currentModule.id); // Badge ID matches module ID
    }

    try {
      await base44.entities.UserProgress.update(progress.id, {
        completed_lessons: newCompletedLessons,
        completed_modules: newCompletedModules,
        xp: newXP,
        badges: newBadges
      });
      
      // Refresh progress state
      setProgress({
        ...progress,
        completed_lessons: newCompletedLessons,
        completed_modules: newCompletedModules,
        xp: newXP,
        badges: newBadges
      });

      // If it's the last lesson, show completion state or navigate
      // Or just let user click Next
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  };

  const handleNext = () => {
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      navigate(`${createPageUrl('Lesson')}?module=${moduleSlug}&lesson=${nextLesson.id}`);
    } else {
        // Next Module?
        const currentModuleIndex = CURRICULUM.findIndex(m => m.id === currentModule.id);
        if (currentModuleIndex < CURRICULUM.length - 1) {
            const nextModule = CURRICULUM[currentModuleIndex + 1];
            navigate(`${createPageUrl('Lesson')}?module=${nextModule.slug}&lesson=${nextModule.lessons[0].id}`);
        } else {
            navigate(createPageUrl('Learn'));
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
              
              return (
                <Link 
                  key={l.id}
                  to={`${createPageUrl('Lesson')}?module=${moduleSlug}&lesson=${l.id}`}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${
                    isActive 
                      ? 'bg-[#0AD9DC]/10 text-[#0AD9DC] border border-[#0AD9DC]/20' 
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                    ${isDone ? 'bg-green-500/20 text-green-500' : isActive ? 'bg-[#0AD9DC]/20' : 'bg-white/5'}
                  `}>
                    {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className="line-clamp-2">{l.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8 md:p-12">
            <div className="flex items-center gap-2 text-[#0AD9DC] text-sm font-bold uppercase tracking-wider mb-4">
                {currentModule.difficulty} MODULE
            </div>
          
          {/* Render Type */}
          {currentLesson.type === 'reading' && (
             <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-slate-300 prose-a:text-[#0AD9DC] prose-code:text-[#0AD9DC] prose-pre:bg-[#022031] prose-pre:border prose-pre:border-white/10">
               <ReactMarkdown
                 components={{
                   code({node, inline, className, children, ...props}) {
                     const match = /language-(\w+)/.exec(className || '')
                     return !inline && match ? (
                       <SyntaxHighlighter
                         {...props}
                         children={String(children).replace(/\n$/, '')}
                         style={atomDark}
                         language={match[1]}
                         PreTag="div"
                         customStyle={{ background: 'transparent' }}
                       />
                     ) : (
                       <code {...props} className={className}>
                         {children}
                       </code>
                     )
                   }
                 }}
               >
                 {currentLesson.content}
               </ReactMarkdown>
             </div>
          )}

          {currentLesson.type === 'sandbox' && (
              <div className="space-y-6">
                  <h1 className="text-3xl font-bold text-white">{currentLesson.title}</h1>
                  <div className="grid md:grid-cols-2 gap-6 h-[500px]">
                      {/* Instructions */}
                      <div className="bg-[#022031] border border-white/10 rounded-xl p-6 overflow-y-auto prose prose-invert prose-sm">
                          <ReactMarkdown>{currentLesson.content}</ReactMarkdown>
                      </div>
                      
                      {/* Mock Editor */}
                      <div className="bg-black rounded-xl border border-white/10 flex flex-col overflow-hidden">
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
                    onClick={() => setIsCompleted(true)}
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
                  
                  <Button 
                    onClick={handleNext}
                    disabled={!isCompleted} 
                    className="bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold"
                  >
                      {currentLessonIndex === currentModule.lessons.length - 1 ? 'Next Module' : 'Next Lesson'} 
                      <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
              </div>
          </div>
        </div>
      </main>
    </div>
  );
}