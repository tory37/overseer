import { useState, useEffect } from 'react';
import { Zap, Search, Plus, Save, Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { getSkills, createSkill, updateSkill, type Skill } from '../utils/api';

interface SkillLibraryProps {
  onSkillsChanged?: () => void;
}

export const SkillLibrary: React.FC<SkillLibraryProps> = ({ onSkillsChanged }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const fetchSkills = async () => {
    setIsLoading(true);
    try {
      const data = await getSkills();
      setSkills(data);
    } catch (err) {
      setError('Failed to load skills.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const loadSkill = (skill: Skill) => {
    setSelectedSkillId(skill.id);
    setIsNew(false);
    setError(null);
    setName(skill.name);
    setCategory(skill.category || '');
    setDescription(skill.description || '');
    setContent(skill.content);
  };

  const handleNew = () => {
    setSelectedSkillId(null);
    setIsNew(true);
    setError(null);
    setName('');
    setCategory('');
    setDescription('');
    setContent('');
  };

  const handleSave = async () => {
    if (!name || !content) {
      setError('Name and content are required.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (isNew) {
        const result = await createSkill({ name, category, description, content });
        setSelectedSkillId(result.id);
        setIsNew(false);
      } else if (selectedSkillId) {
        await updateSkill(selectedSkillId, { name, category, description, content });
      }
      await fetchSkills();
      onSkillsChanged?.();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folder: string) => {
    const next = new Set(expandedFolders);
    if (next.has(folder)) next.delete(folder);
    else next.add(folder);
    setExpandedFolders(next);
  };

  // Group skills by category
  const filteredSkills = skills.filter(s => 
    s.name.toLowerCase().includes(filter.toLowerCase()) || 
    s.category?.toLowerCase().includes(filter.toLowerCase())
  );

  const groups = new Map<string, Skill[]>();
  filteredSkills.forEach(s => {
    const cat = s.category || '';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(s);
  });

  const sortedCategories = Array.from(groups.keys()).sort();

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 text-slate-300">
      {/* Sidebar: Skill Explorer */}
      <div className="w-72 flex flex-col border-r border-slate-800/50 bg-slate-900/30">
        <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-sm text-slate-200">Skill Library</span>
          </div>
          <button 
            onClick={handleNew}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
            title="New Skill"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input 
              className="w-full bg-slate-950/50 border border-slate-800/50 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="Search skills..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {sortedCategories.map(cat => (
            <div key={cat} className="space-y-0.5">
              {cat && (
                <button 
                  onClick={() => toggleFolder(cat)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider"
                >
                  {expandedFolders.has(cat) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <Folder className="w-3.5 h-3.5 text-slate-600" />
                  <span className="truncate">{cat}</span>
                </button>
              )}
              {(expandedFolders.has(cat) || !cat) && groups.get(cat)!.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => loadSkill(skill)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                    selectedSkillId === skill.id && !isNew
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 opacity-50" />
                  <span className="truncate">{skill.name}</span>
                </button>
              ))}
            </div>
          ))}
          {skills.length === 0 && !isLoading && (
            <div className="p-4 text-center text-xs text-slate-600">
              No skills found. Click + to create your first skill.
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Editor */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {(selectedSkillId || isNew) ? (
          <>
            {/* Editor Header */}
            <div className="h-14 border-b border-slate-800/50 flex items-center justify-between px-6 bg-slate-900/10">
              <div className="flex items-center gap-4">
                <div className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                  {isNew ? 'New Skill' : 'Edit Skill'}
                </div>
                {selectedSkillId && (
                  <div className="font-mono text-[10px] text-slate-600 truncate max-w-xs">
                    {selectedSkillId}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSaved 
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                  }`}
                >
                  {isSaved ? 'Saved!' : isLoading ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save Skill</>}
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                    {error}
                  </div>
                )}

                {/* Metadata Section */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Skill Name</label>
                    <input 
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="e.g. Test Driven Development"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Category / Folder</label>
                    <input 
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="e.g. workflows, frontend, devops"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Description</label>
                  <input 
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Short summary of what this skill enables..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                {/* Content Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">Skill Content (Markdown)</label>
                    <span className="text-[10px] text-slate-600 italic">Supports full markdown instructions</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500/10 to-transparent rounded-2xl blur opacity-20 group-focus-within:opacity-100 transition duration-500"></div>
                    <textarea 
                      className="relative w-full h-[500px] bg-slate-950 border border-slate-800 rounded-2xl px-5 py-5 font-mono text-sm text-slate-300 leading-relaxed outline-none focus:border-blue-500/50 transition-all resize-none"
                      placeholder="# Skill Title\n\nProvide detailed instructions for the agent..."
                      value={content}
                      onChange={e => setContent(e.target.value)}
                    />
                  </div>
                </div>

                {/* Helper Card */}
                <div className="p-6 rounded-2xl border border-blue-500/10 bg-blue-500/5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Skill Writing Tip</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Skills are essentially specialized system instructions. Be explicit about the tools the agent should use, 
                    the standards they should follow, and the expected output format. You can use standard Markdown like 
                    headings, lists, and code blocks.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-6 p-12 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center border border-slate-800">
              <Zap className="w-10 h-10 text-slate-700" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-300">Skill Library</h3>
              <p className="text-sm max-w-sm">
                Select a skill from the sidebar to edit it, or create a new one to extend your agent's capabilities.
              </p>
            </div>
            <button 
              onClick={handleNew}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-all border border-slate-700"
            >
              <Plus className="w-4 h-4" /> Create New Skill
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
