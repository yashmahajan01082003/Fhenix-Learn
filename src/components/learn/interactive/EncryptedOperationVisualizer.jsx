import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, Lock, Unlock, Plus, Equal, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EncryptedOperationVisualizer() {
  const [state, setState] = useState('initial'); // initial, encrypted, computed, decrypted
  
  // Random "Ciphertext" hex strings
  const cipherA = "0x7f...3a";
  const cipherB = "0x2b...9c";
  const cipherSum = "0x9d...d6";

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="my-10 p-6 bg-[#00101a] border border-white/10 rounded-2xl max-w-2xl mx-auto">
      <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
        <span className="w-2 h-2 bg-[#0AD9DC] rounded-full animate-pulse" />
        FHE Addition Visualizer
      </h3>

      <div className="flex items-center justify-center gap-8 mb-8">
        {/* Input A */}
        <div className="flex flex-col items-center gap-2">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-500
            ${state === 'initial' || state === 'decrypted' ? 'bg-white text-black border-white' : 'bg-slate-800 text-slate-500 border-slate-700 border-dashed border-2'}
          `}>
            {state === 'initial' || state === 'decrypted' ? 5 : '?'}
          </div>
          <span className="text-xs text-slate-500 uppercase font-mono">Value A</span>
        </div>

        <Plus className="text-slate-600" />

        {/* Input B */}
        <div className="flex flex-col items-center gap-2">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-500
            ${state === 'initial' || state === 'decrypted' ? 'bg-white text-black border-white' : 'bg-slate-800 text-slate-500 border-slate-700 border-dashed border-2'}
          `}>
            {state === 'initial' || state === 'decrypted' ? 3 : '?'}
          </div>
          <span className="text-xs text-slate-500 uppercase font-mono">Value B</span>
        </div>
      </div>

      {/* Operation Flow */}
      <div className="relative min-h-[160px] bg-[#011623] rounded-xl border border-white/5 p-6 mb-6 flex flex-col items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {state === 'initial' && (
            <motion.div 
              key="step1"
              initial="hidden" animate="visible" exit="hidden" variants={variants}
              className="text-center"
            >
              <p className="text-slate-400 mb-4">Ready to encrypt values?</p>
              <Button onClick={() => setState('encrypted')} className="bg-[#0AD9DC] text-[#011623] hover:bg-[#0AD9DC]/90">
                <Lock className="w-4 h-4 mr-2" /> Encrypt Inputs
              </Button>
            </motion.div>
          )}

          {state === 'encrypted' && (
            <motion.div 
              key="step2"
              initial="hidden" animate="visible" exit="hidden" variants={variants}
              className="text-center w-full"
            >
              <div className="flex justify-center gap-8 mb-4 font-mono text-sm text-[#0AD9DC]">
                <div className="bg-[#0AD9DC]/10 px-3 py-1 rounded">{cipherA}</div>
                <div className="bg-[#0AD9DC]/10 px-3 py-1 rounded">{cipherB}</div>
              </div>
              <p className="text-slate-400 mb-4">Values are now encrypted handles.</p>
              <Button onClick={() => setState('computed')} className="bg-purple-500 text-white hover:bg-purple-600">
                <Equal className="w-4 h-4 mr-2" /> Compute FHE.add(a, b)
              </Button>
            </motion.div>
          )}

          {state === 'computed' && (
            <motion.div 
              key="step3"
              initial="hidden" animate="visible" exit="hidden" variants={variants}
              className="text-center"
            >
               <div className="flex justify-center gap-8 mb-4 font-mono text-sm text-purple-400">
                <div className="bg-purple-500/10 px-3 py-1 rounded border border-purple-500/30">{cipherSum}</div>
              </div>
              <p className="text-slate-400 mb-4">Result is a new ciphertext. Network doesn't know it's 8.</p>
              <Button onClick={() => setState('decrypted')} className="bg-green-500 text-white hover:bg-green-600">
                <Unlock className="w-4 h-4 mr-2" /> Decrypt Result
              </Button>
            </motion.div>
          )}

          {state === 'decrypted' && (
            <motion.div 
              key="step4"
              initial="hidden" animate="visible" exit="hidden" variants={variants}
              className="text-center"
            >
              <div className="text-4xl font-bold text-green-400 mb-2">8</div>
              <p className="text-slate-400 mb-4">Decryption successful!</p>
              <Button onClick={() => setState('initial')} variant="outline" className="border-white/10 hover:bg-white/5">
                Reset Demo
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="text-xs text-slate-500 text-center">
        Visualization of FHE Operations on Ethereum
      </div>
    </div>
  );
}