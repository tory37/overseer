import React, { useState, useEffect, useMemo } from 'react';
import type { Persona } from '../utils/api';
import { getPersonas, createPersona, updatePersona, deletePersona } from '../utils/api';
import type { AvatarConfig } from '../utils/api';
import { DEFAULT_AVATAR_CONFIG } from '../utils/api';
import { AgentAvatar } from './AgentAvatar';

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
  const showDots = total <= 16;

  const go = (dir: number) => {
    onChange(options[(idx + dir + total) % total].value);
    setAnimKey(k => k + 1);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
      <div className="flex items-center bg-slate-950/50 border border-slate-800/70 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => go(-1)}
          className="px-3.5 py-2.5 text-slate-600 hover:text-blue-400 transition-colors text-base leading-none bg-transparent border-none cursor-pointer"
        >‹</button>
        <div
          key={animKey}
          className="flex-1 text-center font-mono text-[12px] text-slate-200 py-2.5 px-1 select-none"
          style={{ animation: 'cycleSlide 0.18s ease-out' }}
        >
          {options[idx]?.label || value || 'None'}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="px-3.5 py-2.5 text-slate-600 hover:text-blue-400 transition-colors text-base leading-none bg-transparent border-none cursor-pointer"
        >›</button>
      </div>
      <div className="flex items-center justify-center gap-1 h-1.5">
        {showDots ? (
          options.map((_, i) => (
            <div
              key={i}
              onClick={() => { onChange(options[i].value); setAnimKey(k => k + 1); }}
              className="cursor-pointer rounded-sm transition-all duration-200"
              style={{ width: i === idx ? 14 : 4, height: 4, background: i === idx ? '#3b82f6' : '#1e293b' }}
            />
          ))
        ) : (
          <span className="font-mono text-[9px] text-slate-700">{idx + 1} / {total}</span>
        )}
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
    <div className="flex gap-1.5 flex-wrap">
      {options.map(hex => (
        <button
          key={hex}
          type="button"
          onClick={() => onChange(hex)}
          title={`#${hex}`}
          className="w-7 h-7 rounded-lg border-none cursor-pointer transition-all duration-150"
          style={{
            backgroundColor: `#${hex}`,
            outline: value === hex ? '2px solid #3b82f6' : '2px solid transparent',
            outlineOffset: 2,
            transform: value === hex ? 'scale(1.15)' : 'scale(1)',
            boxShadow: value === hex ? '0 0 12px rgba(59,130,246,0.5)' : 'none',
          }}
        />
      ))}
    </div>
  </div>
);

// ─── Section Header ────────────────────────────────────────────────────────────
const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-2">
    <div className="flex items-center gap-3 mb-5 mt-8 first:mt-0">
      <span className="font-mono text-[10px] font-bold tracking-[0.18em] uppercase text-blue-500/70 whitespace-nowrap">
        // {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(30,41,59,0.8), transparent)' }} />
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

// ─── Mini Persona Card ─────────────────────────────────────────────────────────
const PersonaCard: React.FC<{
  persona: Persona;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}> = ({ persona, isActive, onClick, onDelete }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all border ${
      isActive
        ? 'bg-blue-600/10 border-blue-500/20'
        : 'border-transparent hover:bg-slate-800/40'
    }`}
  >
    <AgentAvatar avatarConfig={persona.avatarConfig} state="idle" size={32} />
    <div className="flex-1 min-w-0">
      <div className={`font-bold text-xs truncate ${isActive ? 'text-blue-300' : 'text-slate-400'}`}>{persona.name}</div>
      <div className="font-mono text-[9px] text-slate-600 truncate">{persona.title}</div>
    </div>
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onDelete(persona.id); }}
      className="text-slate-700 hover:text-red-400 transition-colors text-sm leading-none bg-transparent border-none cursor-pointer flex-shrink-0 p-0.5"
    >×</button>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const PersonaStudio: React.FC<PersonaStudioProps> = ({ onPersonaChanged }) => {
  const [personas, setPersonas]         = useState<Persona[]>([]);
  const [activeId, setActiveId]         = useState<string | null>(null);
  const [isNew, setIsNew]               = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [isSaved, setIsSaved]           = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Form state
  const [cfg, setCfg]                   = useState<AvatarConfig>({ ...DEFAULT_AVATAR_CONFIG });
  const [name, setName]                 = useState('');
  const [title, setTitle]               = useState('');
  const [handle, setHandle]             = useState('');
  const [instructions, setInstructions] = useState('');

  // Preview state
  const [previewState, setPreviewState] = useState<'idle' | 'talking' | 'thinking'>('idle');
  const [talkingUntil, setTalkingUntil] = useState(0);

  useEffect(() => {
    if (previewState === 'talking') {
      setTalkingUntil(Date.now() + 999999); // keep talking indefinitely while in talk mode
    } else {
      setTalkingUntil(0);
    }
  }, [previewState]);

  const fetchPersonas = async () => {
    setIsLoading(true);
    try {
      const data = await getPersonas();
      setPersonas(data);
    } catch {
      setError('Failed to load personas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPersonas(); }, []);

  const loadPersona = (p: Persona) => {
    setActiveId(p.id); setIsNew(false); setError(null);
    setCfg({ ...p.avatarConfig });
    setName(p.name); setTitle(p.title); setHandle(p.id);
    setInstructions(p.instructions || '');
  };

  const handleNew = () => {
    setActiveId(null); setIsNew(true); setError(null);
    setCfg({ ...DEFAULT_AVATAR_CONFIG });
    setName(''); setTitle(''); setHandle(''); setInstructions('');
  };

  const randomize = () => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const pickVal = (opts: CyclerOpt[]) => pick(opts).value;
    setCfg({
      eyes:            pickVal(EYES_OPTS),
      mouth:           pickVal(MOUTH_OPTS),
      hair:            pickVal(HAIR_OPTS),
      clothing:        pickVal(CLOTHING_OPTS),
      glasses:         pickVal(GLASSES_OPTS),
      beard:           pickVal(BEARD_OPTS),
      hat:             pickVal(HAT_OPTS),
      accessories:     pickVal(ACC_OPTS),
      skinColor:       pick(SKIN_TONES),
      hairColor:       pick(HAIR_COLORS),
      clothingColor:   pick(CLOTH_COLORS),
      backgroundColor: pick(BG_COLORS),
    });
  };

  const set = (field: keyof AvatarConfig) => (val: string) =>
    setCfg(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    if (!handle || !name || !title || !instructions) {
      setError('Handle, name, title, and personality are required.');
      return;
    }
    setIsLoading(true); setError(null);
    try {
      const p: Persona = { id: handle, name, title, instructions, avatarConfig: { ...cfg } };
      if (isNew) { await createPersona(p); } else { await updatePersona(handle, p); }
      await fetchPersonas();
      onPersonaChanged?.();
      setActiveId(handle); setIsNew(false);
      setIsSaved(true); setTimeout(() => setIsSaved(false), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this persona?')) return;
    setIsLoading(true); setError(null);
    try {
      await deletePersona(id);
      await fetchPersonas();
      onPersonaChanged?.();
      if (activeId === id) handleNew();
    } catch {
      setError('Failed to delete persona.');
    } finally {
      setIsLoading(false);
    }
  };

  const avatarStateForPreview = previewState === 'thinking' ? 'thinking' : previewState === 'talking' ? 'talking' : 'idle';
  const glowStyle: React.CSSProperties = previewState === 'thinking'
    ? { boxShadow: '0 0 0 2px rgba(59,130,246,0.4), 0 0 30px rgba(59,130,246,0.2)' }
    : previewState === 'talking'
    ? { boxShadow: '0 0 0 2px rgba(16,185,129,0.5), 0 0 30px rgba(16,185,129,0.2)' }
    : { boxShadow: '0 0 0 2px rgba(30,41,59,0.8), 0 0 20px rgba(59,130,246,0.08)' };

  const dotColor = previewState === 'thinking' ? '#3b82f6' : previewState === 'talking' ? '#10b981' : '#475569';

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes cycleSlide { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes scanMove { 0%{transform:translateY(-100%)} 100%{transform:translateY(200%)} }
        .scan-overlay { position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit; }
        .scan-overlay::after { content:'';position:absolute;left:0;right:0;height:40%;background:linear-gradient(to bottom,transparent,rgba(59,130,246,0.04) 50%,transparent);animation:scanMove 4s linear infinite; }
      `}</style>

      <div className="flex h-full w-full overflow-hidden bg-slate-950 text-slate-300">

        {/* ── Sticky avatar panel ──────────────────────────── */}
        <div className="flex flex-col h-full flex-shrink-0 border-r border-slate-800/50" style={{ width: 280, background: 'rgba(5,13,28,0.95)' }}>

          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-800/40 flex items-center gap-2 flex-shrink-0">
            <span className="text-sm">👻</span>
            <span className="font-bold text-sm text-slate-400">Persona Lab</span>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center px-5 pt-7 pb-5 gap-4 flex-shrink-0">
            <div className="relative">
              <div
                className="rounded-2xl overflow-hidden relative"
                style={{ width: 148, height: 148, background: '#0f172a', ...glowStyle, transition: 'box-shadow 0.3s' }}
              >
                <div className="scan-overlay" />
                <AgentAvatar
                  avatarConfig={cfg}
                  state={avatarStateForPreview}
                  talkingUntil={talkingUntil}
                  size={148}
                />
              </div>
              <div
                className="absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full border-2 border-slate-950 transition-all duration-300"
                style={{ background: dotColor, boxShadow: previewState !== 'idle' ? `0 0 8px ${dotColor}` : 'none' }}
              />
            </div>

            {/* Name + title */}
            <div className="text-center">
              <div className="font-extrabold text-base text-slate-100 leading-tight">{name || 'New Persona'}</div>
              <div className="font-mono text-[10px] text-slate-600 mt-1">
                {title || 'No title'}{handle && <span className="text-slate-700"> · @{handle}</span>}
              </div>
            </div>

            {/* State preview toggle */}
            <div className="flex gap-1 bg-slate-950/60 rounded-xl p-0.5 border border-slate-800/60">
              {(['idle', 'talking', 'thinking'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPreviewState(s)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold tracking-widest uppercase transition-all border-none cursor-pointer ${
                    previewState === s ? 'bg-slate-800 text-blue-300' : 'bg-transparent text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {s === 'talking' ? 'TALK' : s === 'thinking' ? 'THINK' : 'IDLE'}
                </button>
              ))}
            </div>

            {/* Randomize */}
            <button
              type="button"
              onClick={randomize}
              className="w-full py-2.5 rounded-xl border border-slate-800/70 bg-transparent text-slate-500 hover:text-blue-300 hover:border-blue-500/40 hover:bg-blue-600/5 font-mono text-[10px] font-bold tracking-[0.14em] uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="text-sm">⟳</span> Randomize
            </button>
          </div>

          {/* Saved personas */}
          <div className="border-t border-slate-800/40 flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-2.5 flex items-center justify-between flex-shrink-0">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-700">Saved</span>
              <button
                type="button"
                onClick={handleNew}
                className="font-mono text-[9px] border border-slate-800/70 rounded-md px-2 py-1 text-slate-600 hover:text-blue-300 hover:border-blue-500/40 transition-all bg-transparent cursor-pointer"
              >+ NEW</button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-3">
              {isLoading && personas.length === 0 && (
                <div className="px-2 py-6 text-center font-mono text-[10px] text-slate-700">Loading…</div>
              )}
              {personas.map(p => (
                <PersonaCard
                  key={p.id}
                  persona={p}
                  isActive={activeId === p.id && !isNew}
                  onClick={() => loadPersona(p)}
                  onDelete={handleDelete}
                />
              ))}
              {!isLoading && personas.length === 0 && (
                <div className="px-2 py-6 text-center font-mono text-[10px] text-slate-700">No personas yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable config ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-10 py-8">
          <div style={{ maxWidth: 600 }}>

            {/* How it works */}
            <div className="mb-8 px-4 py-3.5 rounded-xl border border-blue-500/10" style={{ background: 'rgba(37,99,235,0.05)' }}>
              <div className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-blue-500/60 mb-2">// How personas work</div>
              <p className="text-xs text-slate-500 leading-relaxed m-0">
                Attach a persona to any session when you start it. The AI takes on their personality for the whole session — their tone, attitude, how they react. As they work, they'll occasionally speak in character: short, spontaneous observations shown as speech bubbles next to their avatar in the terminal corner.
              </p>
            </div>

            {error && (
              <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{error}</div>
            )}

            {/* IDENTITY */}
            <Section label="Identity">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Handle</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    disabled={!isNew && !!activeId}
                    placeholder="unique-id"
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Display name"
                    className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Netrunner, Veteran, Agent"
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-200 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </Section>

            {/* APPEARANCE */}
            <Section label="Appearance">
              <div className="grid grid-cols-2 gap-5">
                <ArrowCycler label="Eyes"       options={EYES_OPTS}     value={cfg.eyes}        onChange={set('eyes')} />
                <ArrowCycler label="Mouth"      options={MOUTH_OPTS}    value={cfg.mouth}       onChange={set('mouth')} />
                <ArrowCycler label="Hair"       options={HAIR_OPTS}     value={cfg.hair}        onChange={set('hair')} />
                <ArrowCycler label="Clothing"   options={CLOTHING_OPTS} value={cfg.clothing}    onChange={set('clothing')} />
                <ArrowCycler label="Glasses"    options={GLASSES_OPTS}  value={cfg.glasses}     onChange={set('glasses')} />
                <ArrowCycler label="Beard"      options={BEARD_OPTS}    value={cfg.beard}       onChange={set('beard')} />
                <ArrowCycler label="Hat"        options={HAT_OPTS}      value={cfg.hat}         onChange={set('hat')} />
                <ArrowCycler label="Extras"     options={ACC_OPTS}      value={cfg.accessories} onChange={set('accessories')} />
              </div>
            </Section>

            {/* COLORS */}
            <Section label="Colors">
              <div className="grid grid-cols-2 gap-5">
                <ColorSwatches label="Skin Tone"      options={SKIN_TONES}   value={cfg.skinColor}       onChange={set('skinColor')} />
                <ColorSwatches label="Hair Color"     options={HAIR_COLORS}  value={cfg.hairColor}       onChange={set('hairColor')} />
                <ColorSwatches label="Clothing Color" options={CLOTH_COLORS} value={cfg.clothingColor}   onChange={set('clothingColor')} />
                <ColorSwatches label="Background"     options={BG_COLORS}    value={cfg.backgroundColor} onChange={set('backgroundColor')} />
              </div>
            </Section>

            {/* PERSONALITY */}
            <Section label="Personality">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">System Prompt</label>
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  rows={14}
                  placeholder="You are [NAME], [who they are and their vibe]...&#10;&#10;Describe their personality, tone, attitude, and how they talk. The AI will fully adopt this character for the session."
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-3 font-mono text-xs text-slate-200 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all resize-y leading-relaxed"
                />
                <p className="font-mono text-[10px] text-slate-700 leading-relaxed m-0">
                  Describe who this persona is — their personality, attitude, and how they talk. The AI will adopt this character for the entire session.
                </p>
              </div>
            </Section>

            {/* Actions */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800/50">
              <button
                type="button"
                onClick={() => activeId && handleDelete(activeId)}
                disabled={isNew || !activeId}
                className="px-4 py-2 rounded-xl border border-slate-800/70 bg-transparent text-slate-600 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 font-medium text-xs transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Delete persona
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                style={{ boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
              >
                {isSaved ? '✓ Saved' : isLoading ? 'Saving…' : isNew ? 'Create Persona' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default PersonaStudio;
