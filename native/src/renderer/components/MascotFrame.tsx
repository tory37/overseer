import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AgentAvatar } from './AgentAvatar';
import { Persona } from '../types';

interface MascotFrameProps {
  persona?: Persona;
  voiceText?: string;
  isThinking?: boolean;
}

export const MascotFrame: React.FC<MascotFrameProps> = ({ persona, voiceText, isThinking }) => {
  return (
    <div className="p-6 flex flex-col items-center border-t border-[#33467C]/30 bg-[#16161e] shrink-0">
      <div className="relative group">
        <div className="absolute -inset-2 bg-blue-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative w-20 h-20 bg-slate-900/50 rounded-2xl border border-slate-800/50 p-2 shadow-inner overflow-hidden flex items-center justify-center">
          {persona ? (
            <AgentAvatar 
              avatarConfig={persona.avatarConfig}
              state={voiceText ? 'talking' : isThinking ? 'thinking' : 'idle'}
              size={64}
            />
          ) : (
            <img 
              src="/assets/avatars/overseer.svg" 
              alt="Overseer" 
              className="w-16 h-16 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            />
          )}
        </div>
        
        {isThinking && !voiceText && (
          <div className="absolute -top-1 -right-1 flex gap-1 bg-blue-600 px-2 py-1 rounded-full shadow-lg border border-blue-400">
            <span className="w-1 h-1 bg-white rounded-full animate-bounce" />
            <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {voiceText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-5 relative w-full"
          >
            <div className="p-4 bg-blue-600 rounded-2xl text-white text-[13px] leading-relaxed shadow-xl shadow-blue-900/20 font-medium">
              <p className="line-clamp-4">{voiceText}</p>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
