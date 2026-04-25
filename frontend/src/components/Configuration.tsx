import React, { useState, useEffect } from 'react';
import { Save, Folder } from 'lucide-react';
import { getBaseUrl } from '../utils/api';
import Modal from './Modal';
import FileBrowser from './FileBrowser';

export const Configuration: React.FC = () => {
  const [skillsDir, setSkillsDir] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/config`)
      .then(res => res.json())
      .then(data => {
        if (data.skills_directory) {
          setSkillsDir(data.skills_directory);
        }
      })
      .catch(err => console.error("Failed to fetch config:", err));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/config/skills-directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: skillsDir }),
      });
      if (response.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save skills directory:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPath = (path: string) => {
    setSkillsDir(path);
    setIsBrowserOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-100">Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">Application settings</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Skill System</h3>
            </div>
            
            <div className="space-y-3">
              <label className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Skills Directory Path</label>
              <div className="flex gap-3">
                <div className="flex-1 relative group">
                  <input 
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pr-32"
                    placeholder="e.g. ~/.gemini/skills"
                    value={skillsDir}
                    onChange={e => setSkillsDir(e.target.value)}
                  />
                  <button 
                    onClick={() => setIsBrowserOpen(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 text-xs font-bold border border-slate-700"
                    title="Browse folders"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    Browse
                  </button>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSaved 
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isSaved ? 'Saved!' : isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed px-1">
                The folder where your agent skills are stored as Markdown files. 
                You can point this to a git repository to sync your skills across devices.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isBrowserOpen} 
        onClose={() => setIsBrowserOpen(false)} 
        title="Browse Skills Directory"
      >
        <div className="w-full max-w-[600px] h-[500px]">
          <FileBrowser 
            initialPath={skillsDir || '~'} 
            onSelectPath={handleSelectPath}
            onClose={() => setIsBrowserOpen(false)}
          />
        </div>
      </Modal>
    </div>
  );
};
