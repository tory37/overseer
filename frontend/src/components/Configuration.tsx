import React from 'react';
import { Settings } from 'lucide-react';

export const Configuration: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-100">Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">Application settings</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
        <Settings className="w-10 h-10" />
        <p className="text-sm font-medium">No settings available yet.</p>
      </div>
    </div>
  );
};
