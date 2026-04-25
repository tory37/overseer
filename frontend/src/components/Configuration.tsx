import React, { useState, useEffect } from 'react';
import { Save, Folder, Bot, Zap } from 'lucide-react';
import { getBaseUrl } from '../utils/api';
import Modal from './Modal';
import FileBrowser from './FileBrowser';

export const Configuration: React.FC = () => {
  const [skillsDir, setSkillsDir] = useState('');
  const [agentsDir, setAgentsDir] = useState('');
  const [isSavingSkills, setIsSavingSkills] = useState(false);
  const [isSavedSkills, setIsSavedSkills] = useState(false);
  const [isSavingAgents, setIsSavingAgents] = useState(false);
  const [isSavedAgents, setIsSavedAgents] = useState(false);
  const [browserType, setBrowserType] = useState<'skills' | 'agents' | null>(null);

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/config`)
      .then(res => res.json())
      .then(data => {
        if (data.skills_directory) {
          setSkillsDir(data.skills_directory);
        }
        if (data.agents_directory) {
          setAgentsDir(data.agents_directory);
        }
      })
      .catch(err => console.error("Failed to fetch config:", err));
  }, []);

  const handleSaveSkills = async () => {
    setIsSavingSkills(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/config/skills-directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: skillsDir }),
      });
      if (response.ok) {
        setIsSavedSkills(true);
        setTimeout(() => setIsSavedSkills(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save skills directory:", err);
    } finally {
      setIsSavingSkills(false);
    }
  };

  const handleSaveAgents = async () => {
    setIsSavingAgents(true);
    try {
      const response = await fetch(`${getBaseUrl()}/api/config/agents-directory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: agentsDir }),
      });
      if (response.ok) {
        setIsSavedAgents(true);
        setTimeout(() => setIsSavedAgents(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save agents directory:", err);
    } finally {
      setIsSavingAgents(false);
    }
  };

  const handleSelectPath = (path: string) => {
    if (browserType === 'skills') {
      setSkillsDir(path);
    } else if (browserType === 'agents') {
      setAgentsDir(path);
    }
    setBrowserType(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-100">Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">Application settings</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl space-y-12">
          {/* Agent System */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Agent System</h3>
            </div>
            
            <div className="space-y-3">
              <label className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Agents Directory Path</label>
              <div className="flex gap-3">
                <div className="flex-1 relative group">
                  <input 
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all pr-32"
                    placeholder="e.g. ~/.gemini/agents"
                    value={agentsDir}
                    onChange={e => setAgentsDir(e.target.value)}
                  />
                  <button 
                    onClick={() => setBrowserType('agents')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 text-xs font-bold border border-slate-700"
                    title="Browse folders"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    Browse
                  </button>
                </div>
                <button 
                  onClick={handleSaveAgents}
                  disabled={isSavingAgents}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSavedAgents 
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isSavedAgents ? 'Saved!' : isSavingAgents ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed px-1">
                The folder where your autonomous agent workflow instructions are stored.
              </p>
            </div>
          </div>

          {/* Skill System */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-blue-500" />
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
                    onClick={() => setBrowserType('skills')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all flex items-center gap-2 text-xs font-bold border border-slate-700"
                    title="Browse folders"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    Browse
                  </button>
                </div>
                <button 
                  onClick={handleSaveSkills}
                  disabled={isSavingSkills}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                    isSavedSkills 
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isSavedSkills ? 'Saved!' : isSavingSkills ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed px-1">
                The folder where your technical expertise manuals (skills) are stored.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={browserType !== null} 
        onClose={() => setBrowserType(null)} 
        title={`Browse ${browserType === 'skills' ? 'Skills' : 'Agents'} Directory`}
      >
        <div className="w-full max-w-[600px] h-[500px]">
          <FileBrowser 
            initialPath={(browserType === 'skills' ? skillsDir : agentsDir) || '~'} 
            onSelectPath={handleSelectPath}
            onClose={() => setBrowserType(null)}
          />
        </div>
      </Modal>
    </div>
  );
};
