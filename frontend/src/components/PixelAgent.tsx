import React from 'react';

interface PixelAgentProps {
  message: string | null;
  avatarId: string;
  personaName?: string;
}

export const PixelAgent: React.FC<PixelAgentProps> = ({ message, avatarId, personaName }) => {
  const [avatarError, setAvatarError] = React.useState(false);

  React.useEffect(() => {
    setAvatarError(false); // Reset error state when avatarId changes
  }, [avatarId]);

  return (
    <div className="absolute bottom-6 left-6 flex items-end space-x-3 pointer-events-none">
      <div className="flex flex-col items-center space-y-2 pointer-events-auto">
        <div className="relative group">
          {avatarId && !avatarError ? (
            <img
              src={`/assets/avatars/${avatarId}.svg`}
              alt="Agent Avatar"
              className="w-14 h-14 rounded-2xl object-cover shadow-2xl border-2 border-slate-800 bg-slate-900 transition-transform group-hover:scale-110"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xl font-black shadow-2xl border-2 border-slate-800 group-hover:scale-110 transition-transform">
              {avatarId ? avatarId.substring(0, 1).toUpperCase() : '?'}
            </div>
          )}
          {/* Status indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-slate-900 shadow-lg"></div>
        </div>
        
        {personaName && (
          <div className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-lg">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.1em]">{personaName}</span>
          </div>
        )}
      </div>

      {message && (
        <div className="relative bg-slate-900/90 backdrop-blur-md text-slate-100 p-4 rounded-2xl shadow-2xl border border-slate-700/50 max-w-sm break-words animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-auto">
          <p className="text-sm leading-relaxed font-medium">{message}</p>
          <div className="absolute left-0 bottom-6 w-0 h-0 border-t-[10px] border-t-transparent border-r-[12px] border-r-slate-900/90 border-b-[10px] border-b-transparent transform -translate-x-full"></div>
        </div>
      )}
    </div>
  );
};