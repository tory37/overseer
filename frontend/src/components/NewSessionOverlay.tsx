import { useState, useEffect } from 'react'
import { X, Terminal, Search, Folder, Play, Check, AlertCircle } from 'lucide-react'
import FileBrowser from './FileBrowser'
import { getBaseUrl, type Persona, type Skill, getSkills } from '../utils/api'
import { AgentAvatar } from './AgentAvatar'

interface NewSessionOverlayProps {
  personas: Persona[]
  onClose: () => void
  onLaunch: (name: string, path: string, command: string, personaId: string | null, selectedSkills: string[]) => void
}

export const NewSessionOverlay = ({ personas, onClose, onLaunch }: NewSessionOverlayProps) => {
  const [selectedPath, setSelectedPath] = useState('')
  const [selectedCommand, setSelectedCommand] = useState('gemini --approval-mode yolo')
  const [repos, setRepos] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/repos`)
      .then(res => res.json())
      .then(data => setRepos(data))
      .catch(err => console.error("Failed to fetch repos:", err))
  }, [])

  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoadingSkills(true);
      try {
        const skills = await getSkills();
        setAvailableSkills(skills);
      } catch (err) {
        console.error("Failed to fetch skills:", err);
      } finally {
        setIsLoadingSkills(false);
      }
    };
    fetchSkills();
  }, []);

  const handleLaunch = () => {
    onLaunch("New Session", selectedPath, selectedCommand, selectedPersonaId, selectedSkills)
  }

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId) 
        : [...prev, skillId]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[80vh] shadow-2xl shadow-black/50 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Create New Session</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black">Configure your environment & agent</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-2 divide-x divide-slate-800 overflow-hidden">
          {/* Left Column: Context */}
          <div className="flex flex-col p-8 space-y-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">1. Select Context</h3>
            
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  placeholder="Filter repositories..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {repos.filter(r => r.name.toLowerCase().includes(filter.toLowerCase())).map(repo => (
                  <div 
                    key={repo.id}
                    onClick={() => { setSelectedPath(repo.path); setShowFileBrowser(false); }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                      selectedPath === repo.path 
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className={`w-5 h-5 ${selectedPath === repo.path ? 'text-blue-400' : 'text-slate-600'}`} />
                      <div>
                        <p className="font-bold text-sm">{repo.name}</p>
                        <p className="text-[10px] font-mono opacity-50 truncate">{repo.path}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button 
                  onClick={() => setShowFileBrowser(!showFileBrowser)}
                  className="w-full py-3 rounded-xl border border-dashed border-slate-700 text-slate-500 text-xs font-bold uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                >
                  <Folder className="w-4 h-4" />
                  {showFileBrowser ? 'Hide File Browser' : 'Browse Local System'}
                </button>
              </div>

              {showFileBrowser && (
                <div className="h-64 border border-slate-800 rounded-xl overflow-hidden mt-2">
                  <FileBrowser 
                    onPathChange={(path) => setSelectedPath(path)}
                    onSelectPath={(path) => setSelectedPath(path)}
                    initialPath={selectedPath || '/'} 
                    showHeader={false}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Agent */}
          <div className="flex flex-col p-8 space-y-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">2. Configure Agent</h3>
            <div className="space-y-6">
              {/* Persona Selection */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Select Persona</h4>
                <div className="grid grid-cols-1 gap-2">
                  {personas.map(persona => (
                    <button
                      key={persona.id}
                      onClick={() => setSelectedPersonaId(persona.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        selectedPersonaId === persona.id
                          ? 'bg-blue-600/10 border-blue-500'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <AgentAvatar 
                        avatarConfig={persona.avatarConfig} 
                        className={`w-10 h-10 ${selectedPersonaId === persona.id ? '' : 'grayscale opacity-50'}`} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-bold text-sm truncate ${selectedPersonaId === persona.id ? 'text-blue-400' : 'text-slate-300'}`}>
                            {persona.name}
                          </p>
                          {selectedPersonaId === persona.id && <Check className="w-4 h-4 text-blue-500" />}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{persona.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills Selection */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Active Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {isLoadingSkills ? (
                    <div className="text-[10px] text-slate-600 animate-pulse px-1">Loading skills...</div>
                  ) : availableSkills.length > 0 ? (
                    availableSkills.map(skill => (
                      <button
                        key={skill.name}
                        onClick={() => toggleSkill(skill.name)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                          selectedSkills.includes(skill.name)
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                        }`}
                      >
                        {skill.name}
                      </button>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 px-1 text-slate-600 italic">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px]">No skills found in directory</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Command Input */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Command</h4>
                <div className="relative group">
                  <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all text-slate-300"
                    placeholder="gemini --approval-mode yolo"
                    value={selectedCommand}
                    onChange={e => setSelectedCommand(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${selectedPath ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {selectedPath ? 'Ready to launch' : 'Select context to continue'}
            </span>
          </div>
          <button 
            onClick={handleLaunch}
            disabled={!selectedPath}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Launch Agent
          </button>
        </div>
      </div>
    </div>
  )
}