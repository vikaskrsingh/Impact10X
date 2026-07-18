import { motion } from "framer-motion";
import { BrainCircuit, Sparkles } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 group cursor-pointer">
      <div className="relative flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)] overflow-hidden">
        
        {/* Animated Background Mesh */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-cyan-500/20"
          animate={{ 
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Hover Pulse Effect */}
        <motion.div 
          className="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 mix-blend-screen"
          transition={{ duration: 0.3 }}
        />

        {/* Central Icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          <BrainCircuit className="w-7 h-7 text-purple-300 drop-shadow-[0_0_10px_rgba(216,180,254,0.8)] group-hover:text-cyan-300 transition-colors duration-500" strokeWidth={1.5} />
        </motion.div>

        {/* Sparkles on hover */}
        <motion.div 
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          animate={{ rotate: 180, scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          animate={{ rotate: -180, scale: [1.2, 0.8, 1.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
        </motion.div>

      </div>

      <div className="flex flex-col justify-center">
        <h1 className="text-2xl font-black tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-cyan-200 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] leading-none group-hover:drop-shadow-[0_0_15px_rgba(168,85,247,0.6)] transition-all duration-500">
          AURA
        </h1>
        <p className="text-[9px] font-bold text-purple-400/80 uppercase tracking-[0.35em] mt-1.5 leading-none group-hover:text-cyan-400/80 transition-colors duration-500">
          Enterprise AI
        </p>
      </div>
    </div>
  );
}