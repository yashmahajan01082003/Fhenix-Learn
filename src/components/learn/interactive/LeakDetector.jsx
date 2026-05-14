import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  AlertTriangle,
  HelpCircle,
  Trophy,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
// Confetti removed due to missing dependency


// --- Game Data ---

const LEVELS = [
  {
    id: 1,
    title: "The Branching Trap",
    description: "Find the line that leaks control flow information.",
    code: [
      "function processTransaction(euint32 amount) public {",
      "    euint32 limit = FHE.asEuint32(1000);",
      "    ebool isOverLimit = FHE.gt(amount, limit);",
      "",
      "    // Check if amount exceeds limit",
      "    if (FHE.decrypt(isOverLimit)) {",
      "        revert('Limit exceeded');",
      "    }",
      "",
      "    // Process normally...",
      "}"
    ],
    leaks: [5], // Index of the 'if' line
    explanations: {
      5: "CRITICAL LEAK: Decrypting a condition to use in an 'if' statement reveals the private boolean value to all observers.",
      2: "Safe: Comparing encrypted values produces an encrypted boolean (ebool). No leak yet.",
      6: "Reverting inside a conditional branch reveals which path was taken, leaking the condition.",
    },
    safeExplanation: "This line is safe. It's standard variable declaration or logic that doesn't leak control flow."
  },
  {
    id: 2,
    title: "The Revert Leak",
    description: "require() statements can be dangerous with encrypted data.",
    code: [
      "function bid(euint32 bidAmount) public {",
      "    euint32 minBid = FHE.asEuint32(50);",
      "",
      "    // Enforce minimum bid",
      "    FHE.req(bidAmount.gt(minBid));",
      "",
      "    // Alternative approach",
      "    require(bidAmount.gt(minBid));",
      "",
      "    balances[msg.sender] = bidAmount;",
      "}"
    ],
    leaks: [7], // require(bidAmount.gt(minBid))
    explanations: {
      4: "Safe: FHE.req checks a condition optimistically during execution but verifies it later via ZK/FHE validation without revealing it on-chain immediately in a way that blocks block inclusion based on logic (simplified). Actually, FHE.req is often a specific library feature. In standard FHE context, 'require' on encrypted bool is the main issue.",
      7: "LEAK: 'require' forces the transaction to revert if false. Observers see the revert and know the encrypted condition was false.",
      9: "Writing encrypted data to storage is safe."
    },
    safeExplanation: "This operation is FHE-safe."
  },
  {
    id: 3,
    title: "Event Emission",
    description: "Logs are public. What are you emitting?",
    code: [
      "function transfer(address to, euint32 amount) public {",
      "    _encryptedTransfer(to, amount);",
      "",
      "    // Log the transfer",
      "    emit Transfer(msg.sender, to, amount);",
      "",
      "    // Log just the occurrence",
      "    emit TransferOccurred(msg.sender, to);",
      "}"
    ],
    leaks: [4], // emit Transfer with amount
    explanations: {
      4: "LEAK: You cannot emit an 'euint32' directly in an event. Even if you could, it would just be a handle. But if you decrypt it first (implied or explicit), it's a leak. If this is emitting the handle, it's technically 'safe' but useless. If it's attempting to emit the value, it's impossible or a leak. In this context, emitting sensitive data structure patterns is the trap.",
      7: "Safe: Emitting metadata (who sent to whom) is public info. The amount remains hidden."
    },
    safeExplanation: "Safe event emission pattern."
  },
  {
    id: 4,
    title: "The Safe Select",
    description: "Identify if there are any leaks in this FHE.select pattern.",
    code: [
      "function updateScore(euint32 newPoints) public {",
      "    ebool isHigh = FHE.gt(newPoints, 100);",
      "",
      "    // Update logic",
      "    euint32 bonus = FHE.select(isHigh, 10, 0);",
      "    euint32 total = FHE.add(currentScore, bonus);",
      "",
      "    currentScore = total;",
      "}"
    ],
    leaks: [], // No leaks!
    explanations: {
      4: "SAFE: FHE.select evaluates both possibilities (10 and 0) encryptedly. No branch is taken, no leak occurs.",
      5: "SAFE: Encrypted addition is perfectly secure."
    },
    safeExplanation: "This code uses FHE.select() correctly. There are no leaks here!",
    isTrick: true
  }
];

// --- Components ---

export default function LeakDetector() {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [foundLeaks, setFoundLeaks] = useState([]); // Array of line indexes
  const [mistakes, setMistakes] = useState([]); // Array of line indexes
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExplanation, setShowExplanation] = useState(null); // { line, text, type: 'leak' | 'safe' }

  const currentLevel = LEVELS[currentLevelIdx];
  const isLevelComplete = currentLevel.leaks.every(l => foundLeaks.includes(l)) && (currentLevel.leaks.length > 0 || foundLeaks.length === 0 && mistakes.length > 0 /* Trick level logic needs button */);
  // Actually for trick level (no leaks), we need a "No Leaks" button.

  const handleLineClick = (lineIdx) => {
    if (foundLeaks.includes(lineIdx)) return;

    // Reset explanation
    setShowExplanation(null);

    const isLeak = currentLevel.leaks.includes(lineIdx);
    const explanationText = currentLevel.explanations?.[lineIdx] || currentLevel.safeExplanation;

    if (isLeak) {
      setFoundLeaks([...foundLeaks, lineIdx]);
      setScore(s => s + 100 + (streak * 10));
      setStreak(s => s + 1);
      setShowExplanation({ line: lineIdx, text: explanationText, type: 'leak' });
    } else {
      setMistakes([...mistakes, lineIdx]);
      setStreak(0);
      setScore(s => Math.max(0, s - 50));
      setShowExplanation({ line: lineIdx, text: explanationText, type: 'safe' });
      
      // Clear mistake style after animation
      setTimeout(() => {
        setMistakes(m => m.filter(i => i !== lineIdx));
      }, 1000);
    }
  };

  const handleNext = () => {
    if (currentLevelIdx < LEVELS.length - 1) {
      setCurrentLevelIdx(p => p + 1);
      setFoundLeaks([]);
      setMistakes([]);
      setShowExplanation(null);
    } else {
      setShowConfetti(true);
    }
  };

  const handleNoLeaksClaim = () => {
    if (currentLevel.leaks.length === 0) {
      setScore(s => s + 200);
      setStreak(s => s + 1);
      // Mark level as done visually
      // For the logic, we can just auto-complete or show a success state
      setShowExplanation({ line: -1, text: "Correct! This code uses safe patterns.", type: 'success' });
      // Force next button state
      setFoundLeaks([-1]); // Dummy to trigger completion state if we adjusted logic, but better to handle explicitly
    } else {
      setStreak(0);
      setScore(s => Math.max(0, s - 50));
      setShowExplanation({ line: -1, text: "Careful! There are leaks hidden here.", type: 'error' });
    }
  };

  // Check completion including trick levels
  const levelDone = (currentLevel.leaks.length > 0 && currentLevel.leaks.every(l => foundLeaks.includes(l))) || 
                    (currentLevel.leaks.length === 0 && showExplanation?.type === 'success');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 font-sans">
      {/* Confetti removed */}
      
      {/* Header: Stats & Progress */}
      <div className="flex items-center justify-between bg-[#022031] p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-6">
            <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Level</div>
                <div className="text-white font-bold text-xl">{currentLevelIdx + 1}/{LEVELS.length}</div>
            </div>
            <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score</div>
                <div className="text-[#0AD9DC] font-bold text-xl font-mono">{score}</div>
            </div>
            <div className="hidden sm:block">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Streak</div>
                <div className="flex gap-1">
                    {[...Array(Math.min(streak, 5))].map((_, i) => (
                        <div key={i} className="w-2 h-6 bg-orange-500 rounded-sm animate-pulse" />
                    ))}
                </div>
            </div>
        </div>
        
        <div className="flex flex-col items-end">
            <h2 className="text-white font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" /> Leak Detector
            </h2>
            <p className="text-xs text-slate-400">Find the unsafe lines</p>
        </div>
      </div>

      {/* Main Game Area */}
      <Card className="bg-[#011623] border-white/10 overflow-hidden relative min-h-[500px] flex flex-col">
        
        {/* Level Info */}
        <div className="p-6 border-b border-white/10 bg-[#00101a]">
            <h3 className="text-xl font-bold text-white mb-1">{currentLevel.title}</h3>
            <p className="text-slate-400 text-sm">{currentLevel.description}</p>
        </div>

        {/* Code Viewer */}
        <div className="flex-1 p-6 overflow-x-auto font-mono text-sm leading-relaxed relative">
            <div className="space-y-1">
                {currentLevel.code.map((line, idx) => {
                    const isFound = foundLeaks.includes(idx);
                    const isMistake = mistakes.includes(idx);
                    
                    // Syntax highlighting simulation (basic)
                    const highlightedLine = line
                        .replace(/(function|public|return|if|else|revert|require|emit)/g, '<span class="text-purple-400">$1</span>')
                        .replace(/(euint32|ebool|address)/g, '<span class="text-[#0AD9DC]">$1</span>')
                        .replace(/(FHE\.[a-zA-Z0-9]+)/g, '<span class="text-yellow-400">$1</span>')
                        .replace(/(\/\/.*)/g, '<span class="text-slate-500 italic">$1</span>');

                    return (
                        <motion.div
                            key={idx}
                            onClick={() => !levelDone && handleLineClick(idx)}
                            initial={false}
                            animate={isMistake ? { x: [-5, 5, -5, 5, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className={`
                                group relative px-4 py-2 rounded-lg cursor-pointer transition-all border
                                ${isFound 
                                    ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                                    : isMistake 
                                        ? 'bg-slate-700/50 border-slate-600' 
                                        : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                                }
                            `}
                        >
                            {/* Line Number */}
                            <span className="inline-block w-6 text-slate-600 text-xs select-none mr-4 text-right">{idx + 1}</span>
                            
                            {/* Code Content */}
                            <span className="text-slate-300" dangerouslySetInnerHTML={{ __html: highlightedLine }} />

                            {/* Icons */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                {isFound && <ShieldAlert className="w-5 h-5 text-red-500 animate-in zoom-in" />}
                                {isMistake && <XCircle className="w-5 h-5 text-slate-400" />}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>

        {/* Explanation Overlay (Bottom) */}
        <AnimatePresence mode="wait">
            {showExplanation && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`
                        p-4 border-t backdrop-blur-md z-10
                        ${showExplanation.type === 'leak' ? 'bg-red-950/80 border-red-500/30' : 
                          showExplanation.type === 'success' ? 'bg-green-950/80 border-green-500/30' :
                          showExplanation.type === 'error' ? 'bg-red-950/80 border-red-500/30' :
                          'bg-[#022031]/90 border-[#0AD9DC]/30'}
                    `}
                >
                    <div className="flex items-start gap-3">
                        {showExplanation.type === 'leak' || showExplanation.type === 'error' ? <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" /> :
                         showExplanation.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" /> :
                         <HelpCircle className="w-6 h-6 text-[#0AD9DC] shrink-0" />}
                        
                        <div>
                            <h4 className={`font-bold text-sm mb-1 uppercase tracking-wide ${
                                showExplanation.type === 'leak' || showExplanation.type === 'error' ? 'text-red-400' : 
                                showExplanation.type === 'success' ? 'text-green-400' : 'text-[#0AD9DC]'
                            }`}>
                                {showExplanation.type === 'leak' ? 'Leak Detected!' : 
                                 showExplanation.type === 'success' ? 'Safe Pattern' :
                                 showExplanation.type === 'error' ? 'Incorrect' :
                                 'Safe Line'}
                            </h4>
                            <p className="text-slate-200 text-sm leading-relaxed">{showExplanation.text}</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Controls Footer */}
        <div className="p-4 border-t border-white/10 bg-[#00101a] flex justify-between items-center">
             <div className="flex gap-2">
                {currentLevel.isTrick && !levelDone && (
                    <Button variant="outline" onClick={handleNoLeaksClaim} className="border-[#0AD9DC] text-[#0AD9DC] hover:bg-[#0AD9DC]/10">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> No Leaks Here
                    </Button>
                )}
             </div>

             {levelDone ? (
                 <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white px-8 animate-pulse font-bold">
                    {currentLevelIdx === LEVELS.length - 1 ? 'Finish Game' : 'Next Snippet'} <ChevronRight className="w-4 h-4 ml-2" />
                 </Button>
             ) : (
                 <div className="text-xs text-slate-500 italic">
                    Tap the line containing the security vulnerability
                 </div>
             )}
        </div>

      </Card>

      {/* Completion Screen */}
      {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
              <Card className="max-w-md w-full bg-[#022031] border-[#0AD9DC] p-8 text-center shadow-[0_0_50px_rgba(10,217,220,0.3)]">
                  <div className="w-20 h-20 bg-[#0AD9DC]/20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#0AD9DC]">
                      <Trophy className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Security Expert!</h2>
                  <p className="text-slate-400 mb-6">You've identified all the leaks and mastered the basics of FHE safety.</p>
                  
                  <div className="bg-black/30 rounded-lg p-4 mb-8 flex justify-between items-center border border-white/5">
                      <div className="text-left">
                          <div className="text-xs text-slate-500 uppercase font-bold">Final Score</div>
                          <div className="text-2xl font-mono font-bold text-white">{score}</div>
                      </div>
                      <div className="text-right">
                          <div className="text-xs text-slate-500 uppercase font-bold">Rating</div>
                          <div className="text-xl font-bold text-[#0AD9DC]">A+ Audit Ready</div>
                      </div>
                  </div>

                  <div className="flex gap-4 justify-center">
                      <Button onClick={() => window.location.reload()} variant="outline" className="border-white/10 text-slate-300 hover:text-white">
                          <RefreshCcw className="w-4 h-4 mr-2" /> Play Again
                      </Button>
                      <Button onClick={() => window.location.href = '/Learn'} className="bg-[#0AD9DC] text-[#011623] hover:bg-[#0AD9DC]/90 font-bold">
                          Back to Curriculum
                      </Button>
                  </div>
              </Card>
          </motion.div>
      )}

    </div>
  );
}