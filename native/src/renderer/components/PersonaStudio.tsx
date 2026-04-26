import React, { useState, useEffect } from 'react';
import { AgentAvatar } from './AgentAvatar';
import { Persona, AvatarConfig, DEFAULT_AVATAR_CONFIG } from '../types';

const { ipcRenderer } = window.require('electron');

interface PersonaStudioProps {
  onPersonaChanged?: () => void;
}

// ─── Option arrays ─────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');
const range = (n: number, prefix: string, labelPrefix: string) =>
  Array.from({ length: n }, (_, i) => ({ value: `${prefix}${pad(i + 1)}`, label: `${labelPrefix} ${pad(i + 1)}` }));

const EYES_OPTS     = range(12, 'variant', 'Style');
const MOUTH_OPTS    = [...range(13, 'happy', 'Happy'), ...range(10, 'sad', 'Sad')];
const HAIR_OPTS     = [...range(24, 'short', 'Short'), ...range(21, 'long', 'Long')];
const CLOTHING_OPTS = range(23, 'variant', 'Style');
const GLASSES_OPTS  = [{ value: '', label: 'None' }, ...range(7, 'light', 'Light'), ...range(7, 'dark', 'Dark')];
const BEARD_OPTS    = [{ value: '', label: 'None' }, ...range(8, 'variant', 'Style')];
const HAT_OPTS      = [{ value: '', label: 'None' }, ...range(10, 'variant', 'Style')];
const ACC_OPTS      = [{ value: '', label: 'None' }, ...range(4, 'variant', 'Style')];

const SKIN_TONES    = ['fcd5b0', 'f5cba7', 'd4a574', 'c68642', '8d5524', '4a2912'];
const HAIR_COLORS   = ['6b3a2a', '8b4513', '1a1a1a', '6b6b6b', 'f0c040', '00ff88', 'ff4444', '4444ff'];
const CLOTH_COLORS  = ['5bc0de', '4a5568', '2d6a4f', '9b2335', 'f0c040', 'ff6b35', '6c5ce7', '1a1a2e'];
const BG_COLORS     = ['1e293b', '0f172a', '0a0a0f', '1a1a2e', '0d1117', '111827'];

// ─── Arrow Cycler ──────────────────────────────────────────────────────────────
interface CyclerOpt { value: string; label: string; }

const ArrowCycler: React.FC<{
  label: string;
  options: CyclerOpt[];
  value: string;
  onChange: (val: string) => void;
}> = ({ label, options, value, onChange }) => {
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  const [animKey, setAnimKey] = useState(0);
  const total = options.length;

  const go = (dir: number) => {
    const nextIdx = (idx + dir + total) % total;
    onChange(options[nextIdx].value);
    setAnimKey(k => k + 1);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden h-10">
        <button
          type="button"
          onClick={() => go(-1)}
          className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-all text-xl font-light cursor-pointer border-none"
        >‹</button>
        <div
          key={animKey}
          className="flex-1 text-center font-mono text-[11px] text-slate-300 select-none truncate px-1"
        >
          {options[idx]?.label || 'None'}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-all text-xl font-light cursor-pointer border-none"
        >›</button>
      </div>
    </div>
  );
};

// ─── Color Swatches ────────────────────────────────────────────────────────────
const ColorSwatches: React.FC<{
  label: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}> = ({ label, options, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
    <div className="flex gap-2 flex-wrap">
      {options.map(hex => (
        <button
          key={hex}
          onClick={() => onChange(hex)}
          className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-90 cursor-pointer p-0"
          style={{
            backgroundColor: `#${hex}`,
            borderColor: value === hex ? '#3b82f6' : 'rgba(255,255,255,0.1)',
            boxShadow: value === hex ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none'
          }}
        />
      ))}
    </div>
  </div>
);

export const PersonaStudio: React.FC<PersonaStudioProps> = ({ onPersonaChanged }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Persona>({
    id: '',
    name: '',
    title: '',
    instructions: '',
    avatarConfig: { ...DEFAULT_AVATAR_CONFIG }
  });

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const data = await ipcRenderer.invoke('store-load-personas');
      setPersonas(data);
    } catch (err) {
      console.error('Failed to load personas:', err);
    }
  };

  const handleSelect = (p: Persona) => {
    setSelectedPersonaId(p.id);
    setFormData(p);
    setIsEditing(false);
  };

  const handleNew = () => {
    setSelectedPersonaId(null);
    const newPersona = {
      id: `persona-${Date.now()}`,
      name: 'New Agent',
      title: 'Expert Assistant',
      instructions: 'You are a helpful AI assistant.',
      avatarConfig: { ...DEFAULT_AVATAR_CONFIG }
    };
    setFormData(newPersona);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      let updated;
      if (personas.find(p => p.id === formData.id)) {
        updated = personas.map(p => p.id === formData.id ? formData : p);
      } else {
        updated = [...personas, formData];
      }
      setPersonas(updated);
      ipcRenderer.send('store-save-personas', updated);
      setIsEditing(false);
      setSelectedPersonaId(formData.id);
      onPersonaChanged?.();
    } catch (err) {
      console.error('Failed to save persona:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return;
    try {
      const updated = personas.filter(p => p.id !== id);
      setPersonas(updated);
      ipcRenderer.send('store-save-personas', updated);
      if (selectedPersonaId === id) {
        setSelectedPersonaId(null);
        setIsEditing(false);
      }
      onPersonaChanged?.();
    } catch (err) {
      console.error('Failed to delete persona:', err);
    }
  };

  return (
    <div className="flex h-full text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800/50 flex flex-col bg-slate-950/20">
        <div className="p-4 border-b border-slate-800/30 flex justify-between items-center">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Agent Roster</h2>
          <button
            onClick={handleNew}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 transition-all border-none cursor-pointer"
          >+</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {personas.map(p => (
            <div
              key={p.id}
              onClick={() => handleSelect(p)}
              className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                selectedPersonaId === p.id 
                  ? 'bg-blue-600/10 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                  : 'hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <AgentAvatar avatarConfig={p.avatarConfig} size={36} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${selectedPersonaId === p.id ? 'text-blue-300' : 'text-slate-300'}`}>{p.name}</div>
                <div className="text-[9px] text-slate-500 truncate uppercase tracking-widest mt-0.5">{p.title}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-red-400 transition-all border-none bg-transparent cursor-pointer"
              >×</button>
            </div>
          ))}
          {personas.length === 0 && (
            <div className="text-center py-10 px-4 text-slate-600">
              <p className="text-[10px] uppercase tracking-widest">No personas found</p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#1a1b26]">
        {(selectedPersonaId || isEditing) ? (
          <div className="p-10 max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
            {/* Header / Avatar Preview */}
            <div className="flex items-center gap-10 p-8 bg-slate-900/40 rounded-[2rem] border border-slate-800/50 backdrop-blur shadow-2xl">
              <div className="relative group">
                <div className="absolute -inset-4 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <AgentAvatar avatarConfig={formData.avatarConfig} size={140} state="auto" className="relative z-10" />
              </div>
              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Agent Name"
                  className="w-full bg-transparent border-none text-4xl font-black text-white placeholder:text-slate-800 focus:outline-none focus:ring-0"
                />
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Professional Title"
                  className="w-full bg-transparent border-none text-xs font-mono uppercase tracking-[0.3em] text-blue-400 placeholder:text-slate-800 focus:outline-none focus:ring-0"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.95] border-none cursor-pointer whitespace-nowrap"
                >Save Agent</button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 items-start">
              {/* Identity & Instructions */}
              <div className="xl:col-span-2 space-y-8">
                <div className="flex flex-col gap-3">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500/70">Core Directives</span>
                  <textarea
                    value={formData.instructions}
                    onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                    rows={12}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-sm font-mono leading-relaxed text-slate-300 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 transition-all resize-none shadow-inner"
                    placeholder="Describe behavior, tone, and specific knowledge..."
                  />
                </div>
              </div>

              {/* Avatar Customization */}
              <div className="xl:col-span-3 space-y-8 p-8 bg-slate-900/30 rounded-[2rem] border border-slate-800/40">
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <ArrowCycler label="Eyes" options={EYES_OPTS} value={formData.avatarConfig.eyes} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, eyes: v } })} />
                  <ArrowCycler label="Mouth" options={MOUTH_OPTS} value={formData.avatarConfig.mouth} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, mouth: v } })} />
                  <ArrowCycler label="Hair" options={HAIR_OPTS} value={formData.avatarConfig.hair} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, hair: v } })} />
                  <ArrowCycler label="Clothing" options={CLOTHING_OPTS} value={formData.avatarConfig.clothing} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, clothing: v } })} />
                  <ArrowCycler label="Glasses" options={GLASSES_OPTS} value={formData.avatarConfig.glasses} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, glasses: v } })} />
                  <ArrowCycler label="Beard" options={BEARD_OPTS} value={formData.avatarConfig.beard} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, beard: v } })} />
                  <ArrowCycler label="Hat" options={HAT_OPTS} value={formData.avatarConfig.hat} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, hat: v } })} />
                  <ArrowCycler label="Accessory" options={ACC_OPTS} value={formData.avatarConfig.accessories} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, accessories: v } })} />
                </div>
                
                <div className="grid grid-cols-1 gap-6 pt-8 border-t border-slate-800/40">
                  <div className="grid grid-cols-2 gap-8">
                    <ColorSwatches label="Skin Tone" options={SKIN_TONES} value={formData.avatarConfig.skinColor} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, skinColor: v } })} />
                    <ColorSwatches label="Hair" options={HAIR_COLORS} value={formData.avatarConfig.hairColor} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, hairColor: v } })} />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <ColorSwatches label="Clothing" options={CLOTH_COLORS} value={formData.avatarConfig.clothingColor} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, clothingColor: v } })} />
                    <ColorSwatches label="Background" options={BG_COLORS} value={formData.avatarConfig.backgroundColor} onChange={v => setFormData({ ...formData, avatarConfig: { ...formData.avatarConfig, backgroundColor: v } })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-6">
            <div className="w-32 h-32 rounded-full bg-slate-900/50 flex items-center justify-center border border-slate-800 shadow-inner">
              <span className="text-5xl opacity-20">👤</span>
            </div>
            <div className="text-center">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] mb-2 text-slate-600">Persona Roster</h3>
              <p className="text-xs text-slate-800">Select an agent or create a new identity</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
