import React, { useRef, useEffect, useState } from 'react';
import { Send, Copy, Check } from 'lucide-react';

interface VoiceMessage {
  id: string;
  text: string;
  timestamp: number;
  sender: 'agent' | 'user';
}

interface PixelAgentProps {
  messages: VoiceMessage[];
  isWorking: boolean;
  avatarId: string;
  personaName?: string;
  onSendMessage?: (text: string) => void;
}

export const PixelAgent: React.FC<PixelAgentProps> = ({ messages, isWorking, avatarId, personaName, onSendMessage }) => {
  const [avatarError, setAvatarError] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isWorking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    onSendMessage?.(inputValue);
    setInputValue('');
  };

  const handleCopyAll = () => {
    const text = messages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="p-4 border-b border-slate-900 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {avatarId && !avatarError ? (
              <img
                src={`/assets/avatars/${avatarId}.svg`}
                alt="Agent Avatar"
                className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-900"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-black border border-slate-700">
                {avatarId ? avatarId.substring(0, 1).toUpperCase() : '?'}
              </div>
            )}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${isWorking ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">{personaName || 'Overseer'}</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {isWorking ? 'Processing...' : 'Online'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleCopyAll}
          className="p-1.5 hover:bg-slate-800 text-slate-500 hover:text-slate-200 rounded-md transition-colors"
          title="Copy all messages"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && !isWorking && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
            <div className="w-12 h-12 rounded-full border-2 border-slate-50 border-dashed animate-spin-slow"></div>
            <p className="text-xs font-medium">Waiting for transmission...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`animate-in fade-in slide-in-from-bottom-2 duration-300 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex flex-col space-y-1 max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl p-3 border shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-blue-600/20 border-blue-500/30 rounded-tr-none text-right' 
                  : 'bg-slate-900/80 border-slate-800/50 rounded-tl-none'
              }`}>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-200'}`}>
                  {msg.text}
                </p>
              </div>
              <span className="text-[9px] text-slate-600 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isWorking && (
          <div className="flex space-x-2 p-3 bg-slate-900/40 rounded-2xl rounded-tl-none border border-slate-800/30 w-16 animate-pulse">
            <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce delay-75"></div>
            <div className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce delay-150"></div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-900 bg-slate-950">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a command or message..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-20 disabled:grayscale transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[9px] text-slate-600 font-medium italic">Agent listening...</span>
          <span className="text-[9px] text-slate-700 font-mono tracking-tighter uppercase">Press Enter to Send</span>
        </div>
      </div>
    </div>
  );
};