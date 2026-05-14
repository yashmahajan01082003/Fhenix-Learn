import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CodeEditor from './CodeEditor';
import Terminal from './Terminal';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ArrowRight, Sidebar, Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Objective, Alert, CyberCode, StepList, StepItem, SectionHeader } from './MarkdownComponents';

/**
 * Validate user code against required patterns.
 * Each pattern is checked case-insensitively with whitespace normalization.
 */
function validateCode(code, requiredPatterns = []) {
    const errors = [];
    const passed = [];
    const normalizedCode = code.replace(/\s+/g, ' ').toLowerCase();

    // Basic syntax checks
    if (!code.trim()) {
        return { success: false, errors: ['Code is empty. Write your solution!'], passed: [] };
    }

    // Check each required pattern
    for (const pattern of requiredPatterns) {
        const normalizedPattern = pattern.replace(/\s+/g, ' ').toLowerCase();
        if (normalizedCode.includes(normalizedPattern)) {
            passed.push(`✓ Found: \`${pattern}\``);
        } else {
            errors.push(`Missing: \`${pattern}\``);
        }
    }

    // If no required patterns defined, do basic Solidity structural check
    if (requiredPatterns.length === 0) {
        if (!normalizedCode.includes('contract ')) {
            errors.push('Missing contract declaration');
        }
        if (!normalizedCode.includes('function ')) {
            errors.push('Missing function declaration');
        }
        if (normalizedCode.includes('contract ')) passed.push('✓ Contract declaration found');
        if (normalizedCode.includes('function ')) passed.push('✓ Function declaration found');
    }

    return {
        success: errors.length === 0,
        errors,
        passed
    };
}

export default function ChallengeLayout({
    lesson,
    onComplete,
    onNext,
    isCompleted,
    initialCode,
    isLastLesson = false
}) {
    const navigate = useNavigate();
    const [code, setCode] = useState(initialCode || '// Write your code here...');
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState(null); // 'running', 'success', 'error'
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Reset code when lesson changes
    useEffect(() => {
        setCode(initialCode || '// Write your code here...');
        setLogs([]);
        setStatus(null);
    }, [lesson.id, initialCode]);

    const handleRun = () => {
        setStatus('running');
        setLogs([{ type: 'info', message: 'Validating your code...' }]);

        // Small delay for UX feel
        setTimeout(() => {
            const requiredPatterns = lesson.requiredPatterns || [];
            const result = validateCode(code, requiredPatterns);

            // Show passed checks first
            const newLogs = [{ type: 'info', message: 'Validating your code...' }];

            for (const p of result.passed) {
                newLogs.push({ type: 'success', message: p });
            }

            if (result.success) {
                newLogs.push({ type: 'success', message: '' });
                newLogs.push({ type: 'success', message: '━━━ All checks passed! ━━━' });
                newLogs.push({ type: 'success', message: lesson.successMessage || 'Great work! Your code is correct. 🎉' });
                setStatus('success');
                setLogs(newLogs);

                // Mark as completed
                if (!isCompleted) {
                    onComplete();
                }
            } else {
                for (const err of result.errors) {
                    newLogs.push({ type: 'error', message: `✗ ${err}` });
                }
                newLogs.push({ type: 'info', message: '' });
                newLogs.push({ type: 'info', message: 'Fix the issues above and try again.' });
                setStatus('error');
                setLogs(newLogs);
            }
        }, 600);
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#011623] flex flex-col animate-in fade-in duration-300 font-sans">
            {/* Top Navigation Bar */}
            <header className="h-16 border-b border-white/5 bg-[#011623]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-20 relative">
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#0AD9DC]/20 to-transparent" />

                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="text-slate-400 hover:text-white hover:bg-white/5 transition-colors group"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden md:inline font-medium">Back</span>
                    </Button>

                    <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />

                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#0AD9DC] font-bold uppercase tracking-widest border border-[#0AD9DC]/30 px-1.5 py-0.5 rounded bg-[#0AD9DC]/5 shadow-[0_0_10px_rgba(10,217,220,0.1)]">
                                FHE Challenge
                            </span>
                        </div>
                        <h1 className="text-sm md:text-base font-bold text-slate-400 truncate max-w-[200px] md:max-w-md mt-0.5">
                            {lesson.title || 'Mission Control'}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {(isCompleted || status === 'success') && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Button
                                onClick={onNext}
                                className="bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold h-9 px-5 shadow-[0_0_20px_rgba(10,217,220,0.4)] hover:shadow-[0_0_30px_rgba(10,217,220,0.6)] transition-all border border-[#0AD9DC]/50"
                            >
                                {isLastLesson ? 'Next Module' : 'Next Lesson'} <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </motion.div>
                    )}
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 overflow-hidden relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#022031] via-[#011623] to-[#000B11]">
                <PanelGroup direction="horizontal" autoSaveId="challenge-layout">

                    {/* Left Panel: Instructions */}
                    <Panel
                        defaultSize={50}
                        minSize={20}
                        collapsible={true}
                        collapsedSize={0}
                        onCollapse={() => setIsSidebarCollapsed(true)}
                        onExpand={() => setIsSidebarCollapsed(false)}
                        className={`bg-[#011623]/50 backdrop-blur-sm border-r border-white/5 transition-all duration-300 ${isSidebarCollapsed ? 'min-w-0' : ''}`}
                    >
                        <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                                <div className="max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            h1: Objective,
                                            h2: SectionHeader,
                                            blockquote: Alert,
                                            code: CyberCode,
                                            ul: StepList,
                                            ol: StepList,
                                            li: StepItem,
                                            p: ({ node, ...props }) => <p className="text-slate-300 leading-7 mb-4" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
                                        }}
                                    >
                                        {lesson.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-transparent hover:bg-[#0AD9DC]/50 transition-colors flex items-center justify-center group focus:outline-none z-10 -ml-0.5">
                        <div className="w-0.5 h-12 bg-white/10 group-hover:bg-[#0AD9DC] rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(10,217,220,0)] group-hover:shadow-[0_0_10px_rgba(10,217,220,0.5)]" />
                    </PanelResizeHandle>

                    {/* Right Panel: Editor & Terminal */}
                    <Panel minSize={40}>
                        <PanelGroup direction="vertical">

                            {/* Top: Editor */}
                            <Panel defaultSize={65} minSize={30} className="bg-[#011623] relative flex flex-col">
                                {/* Editor Tabs */}
                                <div className="h-10 bg-[#000B11] border-b border-white/5 flex items-center px-2 gap-1">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#011623] border-t-2 border-[#0AD9DC] text-white text-xs font-medium rounded-t-sm">
                                        <Code2 className="w-3.5 h-3.5 text-[#0AD9DC]" />
                                        Contract.sol
                                    </div>
                                    {isSidebarCollapsed && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 ml-auto text-slate-400 hover:text-white"
                                            onClick={() => { }}
                                        >
                                            <Sidebar className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>

                                <div className="flex-1 relative">
                                    <CodeEditor
                                        code={code}
                                        onChange={(val) => setCode(val)}
                                        language="solidity"
                                    />
                                </div>
                            </Panel>

                            <PanelResizeHandle className="h-1 bg-transparent hover:bg-[#0AD9DC]/50 transition-colors flex items-center justify-center group focus:outline-none z-10 -mt-0.5">
                                <div className="h-0.5 w-12 bg-white/10 group-hover:bg-[#0AD9DC] rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(10,217,220,0)] group-hover:shadow-[0_0_10px_rgba(10,217,220,0.5)]" />
                            </PanelResizeHandle>

                            {/* Bottom: Terminal */}
                            <Panel defaultSize={35} minSize={10} className="bg-[#000B11] border-t border-white/5">
                                <Terminal
                                    logs={logs}
                                    isRunning={status === 'running'}
                                    onRun={handleRun}
                                    status={status}
                                    onNext={onNext}
                                    isLastLesson={isLastLesson}
                                    isCompleted={isCompleted}
                                />
                            </Panel>

                        </PanelGroup>
                    </Panel>

                </PanelGroup>
            </div>
        </div>
    );
}
