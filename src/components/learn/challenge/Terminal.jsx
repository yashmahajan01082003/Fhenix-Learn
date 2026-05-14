import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Play, CheckCircle, Loader2, Command, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function Terminal({ logs, isRunning, onRun, status, onNext, isLastLesson = false, isCompleted = false }) {
    const scrollRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const showContinue = status === 'success' || isCompleted;

    return (
        <div className="flex flex-col h-full bg-[#000B11] font-mono text-sm relative group">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#000B11] border-b border-white/5 select-none">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Console</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-2">
                        {status === 'running' && (
                            <span className="flex items-center gap-1.5 text-[10px] text-[#0AD9DC] animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" /> RUNNING
                            </span>
                        )}
                        {status === 'success' && <span className="text-[10px] text-green-500 font-bold">PASSED</span>}
                        {status === 'error' && <span className="text-[10px] text-red-500 font-bold">FAILED</span>}
                    </div>

                    {/* Run / Retry button */}
                    {!showContinue && (
                        <Button
                            size="sm"
                            onClick={onRun}
                            disabled={isRunning}
                            className={`h-7 text-[10px] font-bold px-3 transition-all ${isRunning
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : status === 'error'
                                    ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                    : 'bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] shadow-[0_0_10px_rgba(10,217,220,0.2)] hover:shadow-[0_0_15px_rgba(10,217,220,0.4)]'
                                }`}
                        >
                            {status === 'error' ? (
                                <>
                                    <RotateCcw className="w-3 h-3 mr-1.5" /> RETRY
                                </>
                            ) : (
                                <>
                                    <Play className="w-3 h-3 mr-1.5 fill-current" /> CHECK CODE
                                </>
                            )}
                        </Button>
                    )}

                    {/* Continue button */}
                    {showContinue && (
                        <Button
                            size="sm"
                            onClick={onNext}
                            className="h-7 text-[10px] font-bold px-4 bg-green-500 hover:bg-green-600 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] transition-all"
                        >
                            <ArrowRight className="w-3 h-3 mr-1.5" /> {isLastLesson ? 'NEXT MODULE' : 'CONTINUE'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Logs Area */}
            <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-1.5 font-mono text-xs md:text-sm"
            >
                <AnimatePresence initial={false}>
                    {logs.map((log, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`leading-relaxed flex items-start gap-2 ${log.type === 'error' ? 'text-red-400 bg-red-500/5 p-1 rounded border border-red-500/10' :
                                log.type === 'success' ? 'text-green-400' :
                                    log.type === 'info' ? 'text-blue-400' :
                                        'text-slate-300'
                                }`}
                        >
                            <span className="opacity-30 select-none mt-0.5">{'>'}</span>
                            <span className="break-all">{log.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-2 opacity-50">
                        <Command className="w-8 h-8 opacity-20" />
                        <p className="text-xs italic">Write your code above, then click CHECK CODE to validate.</p>
                    </div>
                )}

                {/* Big Continue CTA after success */}
                {showContinue && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 pt-4 border-t border-white/5"
                    >
                        <Button
                            onClick={onNext}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-black font-bold py-3 h-12 text-base shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all"
                        >
                            {isLastLesson ? 'Continue to Next Module' : 'Continue to Next Lesson'} <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
