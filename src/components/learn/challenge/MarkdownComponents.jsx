import React from 'react';
import { AlertCircle, Info, CheckCircle, Terminal, Copy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 1. The Objective (H1)
export const Objective = ({ children }) => (
    <div className="relative overflow-hidden rounded-xl bg-[#0AD9DC]/5 border-l-4 border-[#0AD9DC] p-6 mb-8 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="w-16 h-16 text-[#0AD9DC]" />
        </div>
        <div className="relative z-10">
            <h3 className="text-[#0AD9DC] text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" /> Mission Objective
            </h3>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {children}
            </h1>
        </div>
    </div>
);

// 2. Section Headers (H2)
// 2. Section Headers (H2)
export const SectionHeader = ({ children }) => (
    <div className="flex items-center gap-4 mt-10 mb-6 group">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-[#0AD9DC]/30 transition-all" />
        <h2 className="text-lg font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
            <span className="text-[#0AD9DC]">{'{'}</span>
            {children}
            <span className="text-[#0AD9DC]">{'}'}</span>
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-[#0AD9DC]/30 transition-all" />
    </div>
);

// 3. Alerts (Blockquote)
export const Alert = ({ children }) => {
    // Extract text to determine type (Note, Warning, Tip)
    const text = React.Children.toArray(children)
        .map(c => {
            if (typeof c === 'string') return c;
            if (React.isValidElement(c) && c.props.children) return c.props.children;
            return '';
        })
        .join('');

    let type = 'info';
    let Icon = Info;
    let colorClass = 'border-blue-500 bg-blue-500/10 text-blue-200';

    if (text.toLowerCase().includes('warning')) {
        type = 'warning';
        Icon = AlertCircle;
        colorClass = 'border-amber-500 bg-amber-500/10 text-amber-200';
    } else if (text.toLowerCase().includes('tip') || text.toLowerCase().includes('success')) {
        type = 'success';
        Icon = CheckCircle;
        colorClass = 'border-green-500 bg-green-500/10 text-green-200';
    }

    return (
        <div className={cn("flex gap-4 p-4 rounded-lg border-l-4 my-6", colorClass)}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed opacity-90">
                {children}
            </div>
        </div>
    );
};

// 4. Cyber Code (Code blocks & Inline)
export const CyberCode = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');

    if (!inline && match) {
        return (
            <div className="relative rounded-lg overflow-hidden my-6 border border-white/10 bg-[#000B11] group">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                    <span className="text-xs font-mono text-slate-400 uppercase">{match[1]}</span>
                    <Copy className="w-3 h-3 text-slate-500 cursor-pointer hover:text-white transition-colors" />
                </div>
                <div className="text-sm">
                    <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent' }}
                        {...props}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                </div>
            </div>
        );
    }

    return (
        <code className="font-mono text-[0.9em] text-[#0AD9DC] bg-[#0AD9DC]/10 px-1.5 py-0.5 rounded border border-[#0AD9DC]/20" {...props}>
            {children}
        </code>
    );
};

// 5. Steps (List Items)
export const StepItem = ({ children }) => (
    <li className="relative pl-8 mb-4 text-slate-300 leading-relaxed group">
        <span className="absolute left-0 top-1 font-mono text-[#0AD9DC] opacity-50 group-hover:opacity-100 transition-opacity select-none">{'>'}</span>
        <div className="group-hover:text-white transition-colors border-l border-transparent group-hover:border-[#0AD9DC]/30 pl-4 -ml-4 duration-300">
            {children}
        </div>
    </li>
);

export const StepList = ({ children }) => (
    <ul className="space-y-2 my-6 ml-2 border-l border-white/10 pl-4">
        {children}
    </ul>
);
