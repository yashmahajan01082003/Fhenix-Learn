import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  GitBranch, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Play, 
  RotateCcw,
  HelpCircle,
  Split
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// --- Data & Constants ---

const AVAILABLE_BLOCKS = [
  { id: 'block-x', label: 'x', type: 'variable', value: 'Encrypted(x)' },
  { id: 'block-y', label: 'y', type: 'variable', value: 'Encrypted(y)' },
  { id: 'block-0', label: '0', type: 'constant', value: 'Encrypted(0)' },
  { id: 'block-100', label: '100', type: 'constant', value: 'Encrypted(100)' },
  { id: 'block-add', label: 'x + y', type: 'operation', value: 'FHE.add(x, y)' },
  { id: 'block-mul', label: 'x * 2', type: 'operation', value: 'FHE.mul(x, 2)' },
  { id: 'block-sub', label: 'x - y', type: 'operation', value: 'FHE.sub(x, y)' },
];

const CONDITIONS = [
  { id: 'gt', label: 'x > y', code: 'x.gt(y)' },
  { id: 'lt', label: 'x < y', code: 'x.lt(y)' },
  { id: 'eq', label: 'x == y', code: 'x.eq(y)' },
  { id: 'gte', label: 'x >= y', code: 'x.gte(y)' },
];

const CHALLENGES = [
  {
    id: 1,
    title: "Recreate max(x, y)",
    description: "Build a logic that returns the larger of x or y.",
    check: (a, b, cond) => (cond === 'gt' && a?.label === 'x' && b?.label === 'y') || (cond === 'lt' && a?.label === 'y' && b?.label === 'x')
  },
  {
    id: 2,
    title: "Safe Default",
    description: "If x > y, return x - y. Otherwise return 0.",
    check: (a, b, cond) => cond === 'gt' && a?.label === 'x - y' && b?.label === '0'
  }
];

// --- Components ---

const DraggableBlock = ({ block, index, isDragDisabled }) => (
  <Draggable draggableId={block.id} index={index} isDragDisabled={isDragDisabled}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={`
          p-3 rounded-lg border-2 font-mono text-sm font-bold shadow-sm transition-all
          ${snapshot.isDragging ? 'scale-105 rotate-2 z-50 shadow-xl ring-2 ring-[#0AD9DC]' : ''}
          ${block.type === 'variable' ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 
            block.type === 'constant' ? 'bg-purple-500/20 border-purple-500/50 text-purple-200' : 
            'bg-orange-500/20 border-orange-500/50 text-orange-200'}
        `}
      >
        <div className="flex items-center gap-2">
            {block.type === 'variable' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
            {block.type === 'constant' && <div className="w-2 h-2 rounded-full bg-purple-400" />}
            {block.type === 'operation' && <div className="w-2 h-2 rounded-full bg-orange-400" />}
            {block.label}
        </div>
      </div>
    )}
  </Draggable>
);

const ConnectionLine = ({ active, delay = 0 }) => (
  <div className="flex-1 h-1 bg-white/5 relative overflow-hidden rounded-full mx-2">
    {active && (
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear", delay }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0AD9DC] to-transparent opacity-50"
      />
    )}
  </div>
);

export default function EncryptedBranchingSimulator() {
  const [branchA, setBranchA] = useState(null);
  const [branchB, setBranchB] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState(CONDITIONS[0]);
  const [simulationState, setSimulationState] = useState('idle'); // idle, computing, selecting, done
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  // Reset toolbox items availability? 
  // For simplicity, we'll allow cloning or just moving back and forth. 
  // Let's treat the toolbox as a source that always has items (cloning behavior simulated by not removing)
  // But standard dnd removes items. Let's stick to moving for the MVP feel, or just distinct items.
  // To make it easy: we won't remove from toolbox visually, we'll just copy. 
  // BUT @hello-pangea/dnd is strict about unique IDs.
  // WORKAROUND: We'll use the toolbox as a "Palette" and the slots as state containers.
  // DND will be used only for the visual drag.

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const block = AVAILABLE_BLOCKS.find(b => b.id === draggableId);

    if (destination.droppableId === 'branch-a') {
      setBranchA(block);
    } else if (destination.droppableId === 'branch-b') {
      setBranchB(block);
    }
    
    // Reset simulation on change
    if (simulationState !== 'idle') setSimulationState('idle');
  };

  const runSimulation = () => {
    if (!branchA || !branchB) return;
    setSimulationState('computing');
    
    // Sequence
    setTimeout(() => setSimulationState('selecting'), 1500);
    setTimeout(() => {
        setSimulationState('done');
        checkChallenge();
    }, 3000);
  };

  const reset = () => {
    setBranchA(null);
    setBranchB(null);
    setSimulationState('idle');
    setChallengeCompleted(false);
  };

  const checkChallenge = () => {
    const challenge = CHALLENGES[currentChallenge];
    if (challenge && challenge.check(branchA, branchB, selectedCondition.id)) {
      setChallengeCompleted(true);
    }
  };

  const nextChallenge = () => {
    if (currentChallenge < CHALLENGES.length - 1) {
        setCurrentChallenge(prev => prev + 1);
        reset();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      
      {/* Header & Instructions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white font-display mb-2">Encrypted Branching Simulator</h2>
            <p className="text-slate-400 max-w-2xl">
                In FHE, you cannot use <code className="text-[#0AD9DC]">if/else</code> because data is encrypted. 
                Instead, you must use <code className="text-[#0AD9DC]">FHE.select()</code> (oblivious execution).
                Both branches run, and the encrypted result is chosen mathematically.
            </p>
        </div>
        
        {/* Challenge Card */}
        {CHALLENGES[currentChallenge] && (
            <Card className="bg-[#022031] border-[#0AD9DC]/30 p-4 min-w-[300px] relative overflow-hidden">
                <div className="flex items-start gap-3 relative z-10">
                    <TrophyIcon completed={challengeCompleted} />
                    <div>
                        <div className="text-xs font-bold text-[#0AD9DC] uppercase tracking-wider mb-1">
                            Challenge {currentChallenge + 1}/{CHALLENGES.length}
                        </div>
                        <h3 className="text-white font-bold text-sm mb-1">{CHALLENGES[currentChallenge].title}</h3>
                        <p className="text-slate-400 text-xs">{CHALLENGES[currentChallenge].description}</p>
                    </div>
                </div>
                {challengeCompleted && (
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="absolute bottom-2 right-2"
                    >
                        <Button size="sm" onClick={nextChallenge} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold h-7">
                            Next Level <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </motion.div>
                )}
                {/* Bg Glow */}
                {challengeCompleted && <div className="absolute inset-0 bg-green-500/10 animate-pulse pointer-events-none" />}
            </Card>
        )}
      </div>

      {/* Main Interactive Area */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid lg:grid-cols-12 gap-8 h-[600px]">
            
            {/* Left: Toolbox */}
            <div className="lg:col-span-3 bg-[#022031] rounded-xl border border-white/10 p-4 flex flex-col">
                <div className="flex items-center gap-2 text-white font-bold mb-6 pb-4 border-b border-white/10">
                    <Split className="w-5 h-5 text-[#0AD9DC]" /> Component Library
                </div>
                <Droppable droppableId="toolbox" isDropDisabled={true}>
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {AVAILABLE_BLOCKS.map((block, index) => (
                                <DraggableBlock key={block.id} block={block} index={index} isDragDisabled={simulationState !== 'idle'} />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                <div className="mt-4 text-xs text-slate-500 bg-black/20 p-3 rounded-lg">
                    Drag components into the Branch slots to build your logic.
                </div>
            </div>

            {/* Center: Flow Editor */}
            <div className="lg:col-span-9 bg-black/20 rounded-xl border border-white/10 p-8 relative flex flex-col">
                
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                {/* The Circuit */}
                <div className="flex-1 flex items-center relative z-10">
                    
                    {/* Left Side: Branches */}
                    <div className="w-1/3 flex flex-col gap-12 justify-center">
                        {/* Branch A */}
                        <BranchSlot 
                            id="branch-a" 
                            label="Branch A (True Path)" 
                            item={branchA} 
                            isActive={simulationState === 'computing'}
                            isRejected={simulationState === 'done' && selectedCondition.id !== 'gt' && selectedCondition.id !== 'gte' && selectedCondition.id !== 'eq'} 
                        />
                        
                        {/* Branch B */}
                        <BranchSlot 
                            id="branch-b" 
                            label="Branch B (False Path)" 
                            item={branchB} 
                            isActive={simulationState === 'computing'}
                        />
                    </div>

                    {/* Middle: Connections & Condition */}
                    <div className="w-1/3 flex flex-col items-center justify-center relative h-full">
                        
                        {/* Flow Lines (SVG) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                             {/* Path A to Selector */}
                            <motion.path 
                                d="M 0 25% C 50 25%, 50 50%, 100% 50%" 
                                fill="none" 
                                stroke={simulationState === 'computing' || simulationState === 'selecting' ? '#0AD9DC' : '#334155'} 
                                strokeWidth="3"
                                strokeDasharray="8 4"
                                initial={{ pathLength: 0, opacity: 0.2 }}
                                animate={{ 
                                    pathLength: 1, 
                                    opacity: 1,
                                    strokeDashoffset: simulationState !== 'idle' ? -100 : 0 
                                }}
                                transition={{ duration: 1.5 }}
                            />
                            {/* Path B to Selector */}
                            <motion.path 
                                d="M 0 75% C 50 75%, 50 50%, 100% 50%" 
                                fill="none" 
                                stroke={simulationState === 'computing' || simulationState === 'selecting' ? '#0AD9DC' : '#334155'} 
                                strokeWidth="3"
                                strokeDasharray="8 4"
                                initial={{ pathLength: 0, opacity: 0.2 }}
                                animate={{ 
                                    pathLength: 1, 
                                    opacity: 1,
                                    strokeDashoffset: simulationState !== 'idle' ? -100 : 0 
                                }}
                                transition={{ duration: 1.5 }}
                            />
                        </svg>

                        {/* Condition Node */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                            <motion.div 
                                animate={simulationState === 'selecting' ? { scale: [1, 1.2, 1], boxShadow: "0 0 30px #0AD9DC" } : {}}
                                className="bg-[#022031] border-2 border-[#0AD9DC] rounded-xl p-4 shadow-lg min-w-[180px] text-center"
                            >
                                <div className="text-[10px] text-[#0AD9DC] font-bold uppercase tracking-widest mb-2">Encrypted Condition</div>
                                {simulationState === 'idle' ? (
                                    <select 
                                        value={selectedCondition.id}
                                        onChange={(e) => setSelectedCondition(CONDITIONS.find(c => c.id === e.target.value))}
                                        className="bg-black/30 text-white text-sm font-mono font-bold p-2 rounded w-full border border-white/10 outline-none focus:border-[#0AD9DC]"
                                    >
                                        {CONDITIONS.map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 font-mono font-bold text-white h-9">
                                        <Lock className="w-3 h-3 text-[#0AD9DC]" /> {selectedCondition.code}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                    </div>

                    {/* Right: Selector & Output */}
                    <div className="w-1/3 flex items-center justify-end pl-8">
                        <div className="flex flex-col items-center gap-4 w-full">
                            
                            {/* The FHE.select Node */}
                            <div className="relative">
                                <motion.div 
                                    className={`
                                        w-16 h-16 rounded-full flex items-center justify-center border-4 z-10 relative bg-[#011623]
                                        ${simulationState === 'selecting' || simulationState === 'done' ? 'border-[#0AD9DC] shadow-[0_0_30px_rgba(10,217,220,0.4)]' : 'border-slate-700'}
                                    `}
                                >
                                    <Split className={`w-6 h-6 ${simulationState === 'selecting' ? 'text-white animate-spin' : 'text-slate-500'}`} />
                                </motion.div>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-slate-500 font-mono">
                                    FHE.select()
                                </div>
                            </div>

                            {/* Connection to Output */}
                            <div className="h-12 w-1 bg-slate-700 relative overflow-hidden">
                                {simulationState === 'done' && (
                                    <motion.div 
                                        initial={{ y: '-100%' }}
                                        animate={{ y: '100%' }}
                                        className="absolute inset-0 bg-[#0AD9DC]"
                                    />
                                )}
                            </div>

                            {/* Final Output */}
                            <motion.div 
                                initial={{ opacity: 0.5, scale: 0.9 }}
                                animate={simulationState === 'done' ? { opacity: 1, scale: 1 } : {}}
                                className={`
                                    w-full p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all
                                    ${simulationState === 'done' ? 'bg-[#0AD9DC]/10 border-[#0AD9DC]' : 'bg-white/5 border-white/10 border-dashed'}
                                `}
                            >
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0AD9DC]/20">
                                    <Lock className="w-5 h-5 text-[#0AD9DC]" />
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Result</div>
                                    <div className="text-white font-mono font-bold">
                                        {simulationState === 'done' ? 'Encrypted(Result)' : 'Waiting...'}
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </div>

                {/* Code Preview Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#011623] border border-white/10 p-4 rounded-lg font-mono text-xs text-slate-400 flex justify-between items-center">
                    <div>
                        <span className="text-purple-400">euint32</span> result = <span className="text-yellow-400">FHE</span>.select(
                        <span className="text-[#0AD9DC]">{selectedCondition.code}</span>,{' '}
                        <span className="text-blue-300">{branchA ? branchA.value : 'a'}</span>,{' '}
                        <span className="text-blue-300">{branchB ? branchB.value : 'b'}</span>);
                    </div>
                    {simulationState === 'done' && (
                        <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Executed Obliviously</span>
                    )}
                </div>

            </div>
        </div>
      </DragDropContext>

      {/* Controls */}
      <div className="flex justify-center gap-4">
         <Button 
            size="lg" 
            onClick={runSimulation} 
            disabled={!branchA || !branchB || simulationState !== 'idle'}
            className="bg-[#0AD9DC] hover:bg-[#0AD9DC]/90 text-[#011623] font-bold px-8 min-w-[200px]"
         >
            {simulationState === 'idle' ? (
                <> <Play className="w-4 h-4 mr-2" /> Run Encrypted Logic </>
            ) : simulationState === 'done' ? (
                <> <CheckCircle2 className="w-4 h-4 mr-2" /> Complete </>
            ) : (
                <> <Cpu className="w-4 h-4 mr-2 animate-pulse" /> Processing... </>
            )}
         </Button>

         {simulationState === 'done' && (
             <Button 
                variant="outline" 
                size="lg" 
                onClick={reset}
                className="border-white/10 text-white hover:bg-white/5"
             >
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
             </Button>
         )}
      </div>

    </div>
  );
}

// Helper Components

function BranchSlot({ id, label, item, isActive, isRejected }) {
    return (
        <div className="relative">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 ml-1">{label}</div>
            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                            h-24 rounded-xl border-2 border-dashed transition-all relative overflow-hidden flex items-center justify-center
                            ${snapshot.isDraggingOver ? 'border-[#0AD9DC] bg-[#0AD9DC]/5' : 'border-white/10 bg-black/20'}
                            ${item ? 'border-solid border-slate-600' : ''}
                            ${isActive ? 'ring-2 ring-[#0AD9DC] shadow-[0_0_20px_rgba(10,217,220,0.2)]' : ''}
                        `}
                    >
                        {item ? (
                            <div className="flex flex-col items-center gap-1 z-10">
                                <div className={`px-3 py-1 rounded text-xs font-mono font-bold
                                     ${item.type === 'variable' ? 'bg-blue-500/20 text-blue-200' : 
                                       item.type === 'constant' ? 'bg-purple-500/20 text-purple-200' : 
                                       'bg-orange-500/20 text-orange-200'}
                                `}>
                                    {item.label}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <Lock className="w-3 h-3" /> Encrypted
                                </div>
                            </div>
                        ) : (
                            <span className="text-slate-600 text-xs font-medium">Drag block here</span>
                        )}
                        
                        {/* Processing Overlay */}
                        {isActive && (
                            <motion.div 
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0AD9DC]/10 to-transparent"
                            />
                        )}

                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
            
            {/* Info Tooltip simulation */}
            <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                {isActive && <Cpu className="w-4 h-4 text-[#0AD9DC] animate-pulse" />}
            </div>
        </div>
    );
}

function TrophyIcon({ completed }) {
    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${completed ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
            <CheckCircle2 className="w-5 h-5" />
        </div>
    );
}