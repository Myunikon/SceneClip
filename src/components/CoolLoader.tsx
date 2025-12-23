
import { motion } from "framer-motion";

export function CoolLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Container for the animation */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        
        {/* Outer Ring - Rotating */}
        <motion.div
          className="absolute w-full h-full rounded-full border-4 border-primary/30 border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Middle Ring - Rotating Opposite */}
        <motion.div
          className="absolute w-16 h-16 rounded-full border-4 border-purple-500/30 border-b-purple-500"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner Pulse Circle */}
        <motion.div
          className="w-8 h-8 bg-primary rounded-full blur-[2px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Glow Effect behind */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
      </div>

      {/* Animated Text */}
      <motion.p 
        className="font-medium text-lg tracking-widest text-primary uppercase"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </div>
  );
}
