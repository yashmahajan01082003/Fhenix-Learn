import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import { createPageUrl, createLessonUrl } from '@/utils';
import { loadCurriculum } from '@/lib/curriculum-loader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, Play, HelpCircle, Lock, ArrowRight, BookOpen } from 'lucide-react';
import EncryptedOperationVisualizer from '@/components/learn/interactive/EncryptedOperationVisualizer';
import CodeCompare from '@/components/learn/interactive/CodeCompare';
import { useUserProgress } from '@/components/UserProgressContext';
import BadgeAwardModal from '@/components/learn/BadgeAwardModal';
import { BADGES } from '@/components/learn/badges';
import { motion, AnimatePresence } from 'framer-motion';
import ChallengeLayout from '@/components/learn/challenge/ChallengeLayout';

const MarkdownComponents = {
  h1: ({ node, ...props }) => <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mt-12 mb-8 pb-6 border-b border-white/5 font-display" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-2xl md:text-3xl font-bold text-[#0AD9DC] mt-12 mb-6 flex items-center gap-3" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-white mt-8 mb-4" {...props} />,
  p: ({ node, ...props }) => <p className="text-slate-300 leading-8 mb-6 text-lg font-light tracking-wide" {...props} />,
  ul: ({ node, ...props }) => <ul className="ml-6 mb-8 space-y-3 text-slate-300 list-disc marker:text-[#0AD9DC]" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-6 mb-6 text-slate-300 space-y-2 marker:text-[#0AD9DC]" {...props} />,
  li: ({ node, ...props }) => <li className="pl-2 leading-7 text-slate-300" {...props} />,
  blockquote: ({ node, ...props }) => (
    <div className="border-l-4 border-[#0AD9DC] bg-gradient-to-r from-[#0AD9DC]/10 to-transparent p-6 my-10 rounded-r-xl italic text-slate-200 relative overflow-hidden shadow-lg">
      <div className="absolute top-0 left-0 w-1 h-full bg-[#0AD9DC] shadow-[0_0_10px_#0AD9DC]" />
      {props.children}
    </div>
  ),
  code: ({ node, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    // If there is no language match, treat as a block ONLY if it has actual multiple lines of code.
    // React children might be an array, so we join it if necessary.
    const textContent = Array.isArray(children) ? children.join('') : String(children);
    const isMultiLine = textContent.includes('\n') && textContent.trim().length > 0;
    const isBlock = match || isMultiLine;

    if (!isBlock) {
      return <code className="text-[#0AD9DC] text-[0.9em] font-mono font-medium bg-[#0AD9DC]/10 px-1.5 py-0.5 rounded-md border border-[#0AD9DC]/20 whitespace-pre-wrap" {...props}>{children}</code>;
    }

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
        <SyntaxHighlighter
          language={lang || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.7',
          }}
          codeTagProps={{
            className: 'font-mono',
          }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  },
  table: ({ node, ...props }) => <div className="overflow-x-auto my-8 rounded-lg border border-white/10"><table className="w-full border-collapse text-left" {...props} /></div>,
  th: ({ node, ...props }) => <th className="border-b border-white/20 p-4 text-[#0AD9DC] font-bold text-sm uppercase tracking-wider bg-white/5" {...props} />,
  td: ({ node, ...props }) => <td className="border-b border-white/10 p-4 text-slate-300 text-sm" {...props} />,
  a: ({ node, ...props }) => <a className="text-[#0AD9DC] hover:underline decoration-[#0AD9DC]/50 underline-offset-4 transition-colors font-medium" {...props} />,
  hr: ({ node, ...props }) => <hr className="border-white/10 my-10" {...props} />,
};

export default function Lesson() {
  const CURRICULUM = loadCurriculum();
  const navigate = useNavigate();
  const location = useLocation();
  const { moduleDir, lessonFile } = useParams();

  // Debug: Log curriculum loading
  useEffect(() => {
    if (CURRICULUM.length === 0) {
      console.error('Curriculum failed to load - no modules found');
    } else {
      console.log('Curriculum loaded:', CURRICULUM.length, 'modules');
      if (moduleDir) {
        const mod = CURRICULUM.find(m => m.id === moduleDir);
        if (mod) {
          console.log('Module found:', mod.id, 'with', mod.lessons?.length || 0, 'lessons');
        }
      }
    }
  }, [CURRICULUM, moduleDir]);

  // Use context instead of local state
  const { user, progress, loading, updateProgress } = useUserProgress();

  let currentModule = null;
  let currentLesson = null;
  let currentLessonIndex = -1;
  let moduleSlug = null;

  // Strategy 1: Path Parameters (/learn/module-1/01-intro)
  if (moduleDir && lessonFile) {
    currentModule = CURRICULUM.find(m => m.id === moduleDir);
    if (currentModule) {
      moduleSlug = currentModule.slug;
      // Try to match by filename slug
      // lessonFile is "01-encrypted-types" (no .mdx extension in URL)
      // lesson.slug is "encrypted-types"
      // lesson.id is "module-2-encrypted-types"

      // Remove number prefix and any file extension
      const fileSlug = lessonFile.replace(/^\d+-/, '').replace(/\.mdx$/, '');

      // Try exact match first
      currentLesson = currentModule.lessons.find(l => l.slug === fileSlug);

      // If no match, try case-insensitive match
      if (!currentLesson) {
        currentLesson = currentModule.lessons.find(l => l.slug.toLowerCase() === fileSlug.toLowerCase());
      }

      // Debug logging
      if (!currentLesson && currentModule.lessons.length > 0) {
        console.warn('Lesson not found:', {
          lessonFile,
          fileSlug,
          availableSlugs: currentModule.lessons.map(l => l.slug),
          availableIds: currentModule.lessons.map(l => l.id)
        });
      }

      if (currentLesson) {
        currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
      }
    } else {
      console.warn('Module not found:', {
        moduleDir,
        availableModules: CURRICULUM.map(m => m.id)
      });
    }
  }

  // Strategy 2: Query Parameters (?module=slug&lesson=id)
  if (!currentLesson) {
    const params = new URLSearchParams(location.search);
    moduleSlug = params.get('module');
    const lessonId = params.get('lesson');

    if (moduleSlug && lessonId) {
      currentModule = CURRICULUM.find(m => m.slug === moduleSlug);
      if (currentModule) {
        currentLessonIndex = currentModule.lessons.findIndex(l => l.id === lessonId);
        currentLesson = currentModule.lessons[currentLessonIndex];
      }
    }
  }

  // Local UI State
  const [isCompleted, setIsCompleted] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [earnedBadge, setEarnedBadge] = useState(null);

  // Sync with progress and handle locks
  useEffect(() => {
    if (!currentModule || !currentLesson || loading) return;

    if (progress) {
      const completedModules = progress.completed_modules || [];
      const completedLessons = progress.completed_lessons || [];

      // Sync completion status
      setIsCompleted(completedLessons.includes(currentLesson.id));

      // Sequential Lock Check
      const currentModuleIndex = CURRICULUM.findIndex(m => m.id === currentModule.id);
      const prevModule = currentModuleIndex > 0 ? CURRICULUM[currentModuleIndex - 1] : null;

      // Unlocked if: It's the first module OR previous module is explicitly marked complete
      const isModuleLocked = prevModule && !completedModules.includes(prevModule.id);

      const currentLessonIdx = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
      const prevLesson = currentLessonIdx > 0 ? currentModule.lessons[currentLessonIdx - 1] : null;

      // Unlocked if: It's the first lesson OR previous lesson is complete
      // Also allow if the lesson itself is already complete (revisiting)
      const isLessonLocked = prevLesson && !completedLessons.includes(prevLesson.id) && !completedLessons.includes(currentLesson.id);

      if (isModuleLocked || isLessonLocked) {
        console.warn("Locked content accessed, redirecting.", { isModuleLocked, isLessonLocked });
        // navigate(createPageUrl('Learn')); // Temporarily disabled for testing
      }
    }
  }, [currentModule, currentLesson, progress, loading, navigate]);

  const handleComplete = async () => {
    console.log("handleComplete invoked!", { user, hasProgress: !!progress, progress });
    if (!user || !progress) {
      console.warn("handleComplete aborted: missing user or progress", { user, progress });
      return;
    }

    // Optimistic update for UI
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
    const wasModuleCompletedBefore = (progress.completed_modules || []).includes(currentModule.id);

    // Only award XP / mark completion once per module
    if (allFinished && !wasModuleCompletedBefore) {
      newCompletedModules.push(currentModule.id);
      newXP += 100; // Bonus for module
      xpGained += 100;
      newBadges.push(currentModule.id); // Badge ID matches module ID
    }

    try {
      // Use Context to update
      await updateProgress({
        completed_lessons: newCompletedLessons,
        completed_modules: newCompletedModules,
        xp: newXP,
        badges: newBadges
      });

      // Check if ALL modules are completed (for completion badge)
      const allModulesCompleted = CURRICULUM.every(mod => newCompletedModules.includes(mod.id));
      const hasCompletionBadge = newBadges.includes('completion');

      // Show Celebration or Badge
      const isLastLesson = currentLessonIndex === currentModule.lessons.length - 1;
      const isNewModuleCompletion = allFinished && !wasModuleCompletedBefore;
      const shouldShowModuleBadge = allFinished; // Always allow minting once all lessons are done

      if (shouldShowModuleBadge) {
        // Module finished - show badge modal, even if XP/completion was already recorded earlier
        const badge = BADGES.find(b => b.id === currentModule.id);
        if (badge) {
          setEarnedBadge(badge);

          // If this was the last module AND we don't have the completion badge yet
          if (allModulesCompleted && !hasCompletionBadge) {
            // Award completion badge after a delay
            setTimeout(() => {
              const completionBadge = BADGES.find(b => b.id === 'completion');
              if (completionBadge) {
                // Update badges to include completion
                updateProgress({ badges: [...newBadges, 'completion'] });
                setEarnedBadge(completionBadge);
              }
            }, 2000); // Show completion badge 2 seconds after module badge
          }
        }
      } else if (xpGained > 0 && !isNewModuleCompletion) {
        // Regular lesson completion (not module completion) - show XP celebration
        setEarnedXP(xpGained);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }

    } catch (e) {
      console.error("Failed to save progress", e);
    }
  };

  const handleNext = () => {
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      navigate(createLessonUrl(currentModule, nextLesson));
    } else {
      // Next Module logic
      const currentModuleIndex = CURRICULUM.findIndex(m => m.id === currentModule.id);
      if (currentModuleIndex < CURRICULUM.length - 1) {
        const nextModule = CURRICULUM[currentModuleIndex + 1];
        navigate(createLessonUrl(nextModule, nextModule.lessons[0]));
      } else {
        navigate(createPageUrl('Learn'));
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#011623] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#0AD9DC]"></div>
    </div>
  );
  if (!currentModule || !currentLesson) return <div className="p-20 text-white text-center">Lesson not found</div>;

  return (
    <div className="flex flex-col h-full bg-[#011623]">

      {/* Lesson Progress Header — sticky bar for reading/quiz lessons */}
      {currentLesson.type !== 'sandbox' && (
        <div className="sticky top-0 z-30 bg-[#011623]/90 backdrop-blur-md border-b border-white/5">
          <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-12 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-slate-400 hover:text-white hover:bg-white/5 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{currentModule.title}</p>
                <p className="text-sm text-white font-medium truncate">{currentLesson.title}</p>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5">
                {currentModule.lessons.map((l, i) => (
                  <div
                    key={l.id}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentLessonIndex
                      ? 'bg-[#0AD9DC] shadow-[0_0_6px_#0AD9DC] scale-125'
                      : progress?.completed_lessons?.includes(l.id)
                        ? 'bg-green-500'
                        : 'bg-white/10'
                      }`}
                    title={l.title}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">{currentLessonIndex + 1}/{currentModule.lessons.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className={`mx-auto p-4 md:p-8 lg:p-12 ${currentLesson.type === 'sandbox' ? 'max-w-[1800px]' : 'max-w-5xl'}`}>

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

          {/* Render Type (challenge normalized to reading in loader; fallback here for safety) */}
          {(currentLesson.type === 'reading' || currentLesson.type === 'challenge') && (
            <div className="max-w-none">
              <ReactMarkdown
                components={MarkdownComponents}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {currentLesson.content}
              </ReactMarkdown>
            </div>
          )}

          {currentLesson.type === 'sandbox' && (
            <div className="fixed inset-0 z-50 bg-[#011623]">
              <ChallengeLayout
                lesson={currentLesson}
                initialCode={currentLesson.starterCode}
                isCompleted={isCompleted}
                onComplete={handleComplete}
                onNext={handleNext}
                isLastLesson={currentLessonIndex === currentModule.lessons.length - 1}
              />
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
                    className={`w-full p-4 rounded-xl text-left transition-all border ${quizAnswer === i
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
          <div className="flex justify-between items-center mt-20 pt-10 border-t border-white/5">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-white hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>

            <div className="flex gap-3">
              <AnimatePresence mode="wait">
                {!isCompleted && currentLesson.type !== 'quiz' ? (
                  <motion.div
                    key="complete-btn"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Button
                      onClick={handleComplete}
                      size="lg"
                      className="bg-transparent border border-[#0AD9DC] text-[#0AD9DC] hover:bg-[#0AD9DC]/10 font-bold px-8"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Mark as Complete
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="next-btn"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <Button
                      onClick={handleNext}
                      size="lg"
                      className="bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold px-8 shadow-[0_0_20px_-5px_#0AD9DC] hover:shadow-[0_0_30px_-5px_#0AD9DC] transition-all"
                    >
                      {currentLessonIndex === currentModule.lessons.length - 1 ? 'Next Module' : 'Next Lesson'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <BadgeAwardModal
        isOpen={!!earnedBadge}
        onClose={() => setEarnedBadge(null)}
        badge={earnedBadge}
      />
    </div>
  );
}