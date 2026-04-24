import React, { useState, useEffect, useMemo } from 'react';
import type { Persona } from '../utils/api';
import { getPersonas, createPersona, updatePersona, deletePersona } from '../utils/api';
import type { AvatarConfig } from '../utils/api';
import { DEFAULT_AVATAR_CONFIG } from '../utils/api';
import { AgentAvatar } from './AgentAvatar';
import { Plus, Search, Save, Trash2, X, Ghost } from 'lucide-react';

const PersonaStudio: React.FC = () => {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<Persona>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPersonas();
    }, []);

    const fetchPersonas = async () => {
        setIsLoading(true);
        try {
            const fetchedPersonas = await getPersonas();
            setPersonas(fetchedPersonas);
        } catch (err) {
            setError('Failed to fetch personas.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPersona = (persona: Persona) => {
        setSelectedPersona(persona);
        setFormData(persona);
        setIsCreatingNew(false);
    };

    const handleCreateNew = () => {
        setSelectedPersona(null);
        setFormData({ id: '', name: '', instructions: '', avatarConfig: { ...DEFAULT_AVATAR_CONFIG } });
        setIsCreatingNew(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarConfigChange = (field: keyof AvatarConfig, value: string) => {
        setFormData(prev => ({
            ...prev,
            avatarConfig: {
                ...(prev.avatarConfig ?? DEFAULT_AVATAR_CONFIG),
                [field]: value,
            },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.id || !formData.name || !formData.instructions) {
            setError('ID, Name, and Instructions are required.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (isCreatingNew) {
                await createPersona(formData as Persona);
            } else if (selectedPersona) {
                await updatePersona(selectedPersona.id, formData as Persona);
            }
            await fetchPersonas();
            setIsCreatingNew(false);
            setSelectedPersona(null);
            setFormData({});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this persona?')) {
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await deletePersona(id);
            await fetchPersonas();
            if (selectedPersona?.id === id) {
                setSelectedPersona(null);
                setFormData({});
            }
        } catch (err) {
            setError('Failed to delete persona.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPersonas = useMemo(() =>
        personas.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.toLowerCase().includes(searchTerm.toLowerCase())
        ), [personas, searchTerm]
    );

    const Sidebar = () => (
        <div className="flex flex-col bg-slate-800/50 border-r border-slate-700/50 w-1/3">
            <div className="p-4 border-b border-slate-700/50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search personas..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-md pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-grow overflow-y-auto">
                {filteredPersonas.map(persona => (
                    <div
                        key={persona.id}
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50 ${selectedPersona?.id === persona.id && !isCreatingNew ? 'bg-blue-600/30' : ''}`}
                        onClick={() => handleSelectPersona(persona)}
                    >
                        <div>
                            <p className="font-semibold text-white">{persona.name}</p>
                            <p className="text-xs text-slate-400">{persona.id}</p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(persona.id);
                            }}
                            className="text-slate-500 hover:text-red-400"
                            aria-label="Delete Persona"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-slate-700/50">
                <button
                    onClick={handleCreateNew}
                    className={`w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 ${isCreatingNew ? 'ring-2 ring-blue-400' : ''}`}
                >
                    <Plus className="w-5 h-5" />
                    Create New Persona
                </button>
            </div>
        </div>
    );

    const Editor = () => (
        <div className="w-2/3 p-8 flex flex-col">
            {!selectedPersona && !isCreatingNew ? (
                <div className="m-auto text-center text-slate-500">
                    <Ghost className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-xl font-bold">Persona Studio</h2>
                    <p>Select a persona to edit or create a new one.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">
                            {isCreatingNew ? 'Create New Persona' : `Editing: ${selectedPersona?.name}`}
                        </h2>
                        <button type="button" onClick={() => { setSelectedPersona(null); setIsCreatingNew(false); }} className="text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4">{error}</div>}

                    <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                        <div>
                            <label htmlFor="id" className="block text-sm font-semibold text-slate-300 mb-1">ID</label>
                            <input
                                type="text"
                                name="id"
                                value={formData.id || ''}
                                onChange={handleFormChange}
                                disabled={!isCreatingNew}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-800 disabled:cursor-not-allowed"
                                placeholder="unique-persona-id"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleFormChange}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="My Awesome Persona"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="instructions" className="block text-sm font-semibold text-slate-300 mb-1">System Prompt</label>
                            <textarea
                                name="instructions"
                                value={formData.instructions || ''}
                                onChange={handleFormChange}
                                rows={15}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="You are a helpful assistant..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3">Avatar</label>
                            <div className="flex gap-8">
                                {/* Left: controls */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Eyes</label>
                                        <select
                                            value={formData.avatarConfig?.eyes ?? 'variant01'}
                                            onChange={e => handleAvatarConfigChange('eyes', e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="variant01">Default</option>
                                            <option value="variant09">Narrow</option>
                                            <option value="variant06">Wide</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Mouth</label>
                                        <select
                                            value={formData.avatarConfig?.mouth ?? 'variant04'}
                                            onChange={e => handleAvatarConfigChange('mouth', e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="variant04">Smile</option>
                                            <option value="variant09">Open</option>
                                            <option value="variant14">Grin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Hair</label>
                                        <select
                                            value={formData.avatarConfig?.hair ?? 'short01'}
                                            onChange={e => handleAvatarConfigChange('hair', e.target.value)}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="short01">Short</option>
                                            <option value="short02">Short Alt</option>
                                            <option value="mohawk01">Mohawk</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-2">Skin Tone</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['fcd5b0', 'f5cba7', 'd4a574', 'c68642', '8d5524', '4a2912'].map(hex => (
                                                <button
                                                    key={hex}
                                                    type="button"
                                                    onClick={() => handleAvatarConfigChange('skinColor', hex)}
                                                    className={`w-7 h-7 rounded-md border-2 transition-all ${formData.avatarConfig?.skinColor === hex ? 'border-blue-400 scale-110' : 'border-transparent hover:border-slate-500'}`}
                                                    style={{ backgroundColor: `#${hex}` }}
                                                    title={`#${hex}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-2">Hair Color</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['6b3a2a', '8b4513', '6b6b6b', 'f0c040', '00ff88', '1a1a1a', 'ff4444', '4444ff'].map(hex => (
                                                <button
                                                    key={hex}
                                                    type="button"
                                                    onClick={() => handleAvatarConfigChange('hairColor', hex)}
                                                    className={`w-7 h-7 rounded-md border-2 transition-all ${formData.avatarConfig?.hairColor === hex ? 'border-blue-400 scale-110' : 'border-transparent hover:border-slate-500'}`}
                                                    style={{ backgroundColor: `#${hex}` }}
                                                    title={`#${hex}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-2">Background</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['1e293b', '0f172a', '0a0a0f', '1a1a2e', '0d1117', '111827'].map(hex => (
                                                <button
                                                    key={hex}
                                                    type="button"
                                                    onClick={() => handleAvatarConfigChange('backgroundColor', hex)}
                                                    className={`w-7 h-7 rounded-md border-2 transition-all ${formData.avatarConfig?.backgroundColor === hex ? 'border-blue-400 scale-110' : 'border-transparent hover:border-slate-500'}`}
                                                    style={{ backgroundColor: `#${hex}` }}
                                                    title={`#${hex}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {/* Right: live preview */}
                                <div className="flex flex-col items-center gap-2 pt-2">
                                    <AgentAvatar
                                        avatarConfig={formData.avatarConfig ?? DEFAULT_AVATAR_CONFIG}
                                        state="idle"
                                        size={128}
                                    />
                                    <span className="text-xs text-slate-500">Preview</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-auto flex justify-end gap-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {isLoading ? 'Saving...' : (isCreatingNew ? 'Create Persona' : 'Save Changes')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );


    return (
        <div className="flex h-full w-full bg-slate-900 text-slate-300 font-sans">
            <Sidebar />
            <Editor />
        </div>
    );
};

export default PersonaStudio;
