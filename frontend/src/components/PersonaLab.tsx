import React, { useState } from 'react';
import type { Persona } from '../utils/api';
import { createPersona, getPersonas, DEFAULT_AVATAR_CONFIG } from '../utils/api';
import { Ghost, CheckCircle, XCircle } from 'lucide-react'; // Importing icons for success/error

interface PersonaLabProps {
    onCreated?: () => void;
}

export const PersonaLab: React.FC<PersonaLabProps> = ({ onCreated }) => {
    const [persona, setPersona] = useState<Persona>({
        id: '',
        name: '',
        title: '',
        instructions: '',
        avatarConfig: DEFAULT_AVATAR_CONFIG,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPersona(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null); // Clear previous messages

        try {
            // Basic validation
            if (!persona.id || !persona.instructions) {
                throw new Error('ID and Instructions are required.');
            }

            // Client-side validation for ID uniqueness
            const existingPersonas = await getPersonas();
            const idExists = existingPersonas.some(p => p.id === persona.id);
            if (idExists) {
                throw new Error(`Persona with ID '${persona.id}' already exists. Please choose a unique ID.`);
            }
            
            await createPersona(persona);
            setMessage({ type: 'success', text: 'Persona created successfully!' });
            // Clear form after successful submission
            setPersona({ 
                id: '', 
                name: '', 
                title: '',
                instructions: '', 
                avatarConfig: DEFAULT_AVATAR_CONFIG 
            });
            
            // Trigger callback if provided
            if (onCreated) {
                onCreated();
            }
        } catch (err: any) {
            console.error('Failed to create persona:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to create persona.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5 space-y-6">
            <div className="flex items-center gap-2 text-slate-500">
                <Ghost className="w-4 h-4 text-blue-500/50" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Persona Lab</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="id" className="block text-xs font-semibold text-slate-400 mb-1">ID</label>
                        <input
                            type="text"
                            id="id"
                            name="id"
                            value={persona.id}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="unique-persona-id"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-xs font-semibold text-slate-400 mb-1">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={persona.name}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Walt"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="title" className="block text-xs font-semibold text-slate-400 mb-1">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={persona.title}
                        onChange={handleChange}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="The Salty Sailor"
                    />
                </div>
                <div>
                    <label htmlFor="instructions" className="block text-xs font-semibold text-slate-400 mb-1">Instructions</label>
                    <textarea
                        id="instructions"
                        name="instructions"
                        value={persona.instructions}
                        onChange={handleChange}
                        rows={5}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="You are a helpful AI assistant..."
                        required
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                    Create Persona
                </button>
            </form>

            {message && (
                <div className={`flex items-center gap-2 p-3 rounded-md ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    <p className="text-sm">{message.text}</p>
                </div>
            )}
        </div>
    );
};
