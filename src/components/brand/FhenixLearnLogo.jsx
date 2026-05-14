import { motion } from 'framer-motion';

export default function FhenixLearnLogo() {
  return (
    <div className="relative group cursor-pointer">
      <div className="absolute inset-0 bg-[#0AD9DC]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0AD9DC]/10 border border-[#0AD9DC]/20 group-hover:border-[#0AD9DC]/50 transition-colors">
        <div className="flex items-center font-display font-bold tracking-tight text-white">
          fhenix
          <motion.span
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="text-[#0AD9DC] text-xl leading-none ml-0.5 -mt-1"
          >
            *
          </motion.span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <span className="text-xs font-bold text-[#0AD9DC] tracking-wider uppercase">Learn</span>
      </div>
    </div>
  );
}