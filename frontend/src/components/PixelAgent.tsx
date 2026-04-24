import React, { useRef, useEffect, useState } from 'react';
import { Send, Copy, Check } from 'lucide-react';
import { AgentAvatar } from './AgentAvatar';
import type { AvatarConfig } from '../utils/api';

interface VoiceMessage {
  id: string;
  text: string;
  timestamp: number;
  sender: 'agent' | 'user';
}

interface PixelAgentProps {
  messages: VoiceMessage[];
  isWorking: boolean;
  avatarConfig: AvatarConfig;
  personaName?: string;
  onSendMessage?: (text: string) => void;
}

export const PixelAgent: React.FC<PixelAgentProps> = ({ messages, isWorking, avatarConfig, personaName, onSendMessage }) => {
  const [talkingUntil, setTalkingUntil] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender !== 'agent') return;
    const wordCount = lastMsg.text.split(/\s+/).filter(Boolean).length;
    setTalkingUntil(Date.now() + wordCount * 80);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isWorking]);

  const avatarState = isWorking ? 'thinking' : talkingUntil > Date.now() ? 'talking' : 'idle';

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
            <AgentAvatar avatarConfig={avatarConfig} state={avatarState} talkingUntil={talkingUntil} size={40} />
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-952 ${isWorking ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
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
