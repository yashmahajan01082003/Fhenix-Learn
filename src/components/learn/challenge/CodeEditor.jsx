import React from 'react';
import { Editor } from '@monaco-editor/react';

export default function CodeEditor({ code, onChange, language = 'solidity', readOnly = false }) {
    const handleEditorDidMount = (editor, monaco) => {
        monaco.editor.defineTheme('fhenix-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6272a4' },
                { token: 'keyword', foreground: 'ff79c6' },
                { token: 'string', foreground: 'f1fa8c' },
                { token: 'number', foreground: 'bd93f9' },
                { token: 'type', foreground: '8be9fd' },
            ],
            colors: {
                'editor.background': '#011623',
                'editor.foreground': '#f8f8f2',
                'editor.lineHighlightBackground': '#022031',
                'editorCursor.foreground': '#0AD9DC',
                'editor.selectionBackground': '#44475a',
            }
        });
        monaco.editor.setTheme('fhenix-dark');
    };

    return (
        <div className="h-full w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-[#011623]">
            <Editor
                height="100%"
                defaultLanguage={language}
                value={code}
                onChange={onChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, monospace',
                    scrollBeyondLastLine: false,
                    readOnly: readOnly,
                    padding: { top: 16, bottom: 16 },
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                }}
            />
        </div>
    );
}
