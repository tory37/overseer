import { X } from 'lucide-react';

interface NewSessionOverlayProps {
  onClose: () => void;
  onLaunch: (name: string, path: string, command: string) => void;
}

export const NewSessionOverlay = ({ onClose, onLaunch }: NewSessionOverlayProps) => (
  <div className="fixed inset-0 bg-slate-950 z-[200] flex items-center justify-center">
    <button 
      onClick={onClose}
      className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-800 text-slate-500 transition-colors"
    >
      <X className="w-8 h-8" />
    </button>
    
    <div 
      className="text-white text-2xl font-black tracking-tighter uppercase opacity-20 cursor-pointer hover:opacity-40 transition-opacity"
      onClick={() => onLaunch('New Session', '.', 'ls')}
    >
      Blueprint: New Session
    </div>
  </div>
);
