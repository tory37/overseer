import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Terminal as Xterm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Copy, Check } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  id?: string;
  cwd?: string;
  command?: string;
  personaId?: string | null;
  onVoiceMessage?: (message: string, id?: string) => void;
  onActivity?: (isWorking: boolean) => void;
}

export interface TerminalHandle {
  sendInput: (data: string) => void;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(
  ({ id, cwd, command, personaId, onVoiceMessage, onActivity }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Xterm | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const onVoiceMessageRef = useRef(onVoiceMessage);
    const onActivityRef = useRef(onActivity);
    const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [copied, setCopied] = useState(false);

    const cleanVoiceMessage = (text: string): string => {
      const lines = text.replace(/\r\n/g, '\n').split('\n').map(line => {
        const rParts = line.split('\r');
        const validParts = rParts.filter(p => p.length > 0);
        return validParts.length > 0 ? validParts[validParts.length - 1] : '';
      });

      const filteredLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        if (trimmed.includes('workspace (') && trimmed.includes('branch')) return false;
        if (trimmed.includes('sandbox') && trimmed.includes('model')) return false;
        if (trimmed.includes('quota') && trimmed.includes('used')) return false;
        if (trimmed.toLowerCase().includes('thinking...')) return false;
        if (trimmed.includes('YOLO Ctrl+Y')) return false;
        if (trimmed.includes('Type your message or @path/to/file')) return false;
        if (trimmed.includes('|⌐■_■|')) return false;
        if (/^[▀▄█─━═─-]+$/.test(trimmed)) return false;
        if (trimmed.length > 20 && /^[-━═─]+$/.test(trimmed.replace(/\s/g, ''))) return false;
        if (/^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]$/.test(trimmed)) return false;
        return true;
      });

      const resultLines: string[] = [];
      for (let i = 0; i < filteredLines.length; i++) {
        const line = filteredLines[i];
        const trimmed = line.trim();
        if (!trimmed) { resultLines.push(line); continue; }
        let isPrefix = false;
        for (let j = i + 1; j < Math.min(i + 5, filteredLines.length); j++) {
          const nextTrimmed = filteredLines[j].trim();
          if (nextTrimmed && nextTrimmed.startsWith(trimmed) && nextTrimmed !== trimmed) {
            isPrefix = true; break;
          }
        }
        if (isPrefix) continue;
        if (resultLines.some(rl => rl.trim() === trimmed)) continue;
        resultLines.push(line);
      }

      return resultLines.join('\n').trim();
    };

    const handleCopy = () => {
      if (xtermRef.current) {
        const term = xtermRef.current;
        const buffer = term.buffer.active;
        let text = '';
        for (let i = 0; i < buffer.length; i++) {
          const line = buffer.getLine(i);
          if (line) text += line.translateToString(true) + '\n';
        }
        navigator.clipboard.writeText(text.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    useImperativeHandle(ref, () => ({
      sendInput: (data: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'input', data }));
        }
      },
    }));

    useEffect(() => { onVoiceMessageRef.current = onVoiceMessage; }, [onVoiceMessage]);
    useEffect(() => { onActivityRef.current = onActivity; }, [onActivity]);

    useEffect(() => {
      if (!terminalRef.current || !id) return;

      const term = new Xterm({
        theme: {
          background: '#0f172a',
          foreground: '#f8fafc',
          cursor: '#f8fafc',
        },
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: 13,
        cursorBlink: true,
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      setTimeout(() => { if (terminalRef.current) fitAddon.fit(); }, 100);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = new URL(`${protocol}//${window.location.host}/ws/terminal`);
      wsUrl.searchParams.append('sessionId', id);
      wsUrl.searchParams.append('rows', term.rows.toString());
      wsUrl.searchParams.append('cols', term.cols.toString());
      if (cwd)      wsUrl.searchParams.append('cwd', cwd);
      if (command)  wsUrl.searchParams.append('command', command);
      if (personaId) wsUrl.searchParams.append('personaId', personaId);

      const ws = new WebSocket(wsUrl.toString());
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      };

      ws.onmessage = async (event) => {
        let data = event.data;
        if (data instanceof ArrayBuffer) data = new Uint8Array(data);
        if (!data) return;

        term.write(data, () => {
          const buffer = term.buffer.active;
          let fullText = '';
          for (let i = 0; i < buffer.length; i++) {
            const line = buffer.getLine(i);
            if (line) {
              fullText += line.translateToString(true);
              const nextLine = buffer.getLine(i + 1);
              if (!nextLine || !nextLine.isWrapped) fullText += '\n';
            }
          }

          // Extract completed <voice> blocks
          const voiceRegex = /<voice>([\s\S]*?)<\/voice>/g;
          let match;
          while ((match = voiceRegex.exec(fullText)) !== null) {
            const rawMessage = match[1];
            const voiceId = `voice-${match.index}`;
            if (rawMessage) {
              const cleanMessage = cleanVoiceMessage(rawMessage);
              if (cleanMessage) onVoiceMessageRef.current?.(cleanMessage, voiceId);
            }
          }

          // Handle open/streaming <voice> tag
          const lastOpenTag = fullText.lastIndexOf('<voice>');
          const lastCloseTag = fullText.lastIndexOf('</voice>');
          if (lastOpenTag > lastCloseTag) {
            const streamingContent = fullText.substring(lastOpenTag + 7);
            const voiceId = `voice-${lastOpenTag}`;
            if (streamingContent) {
              const cleanStreaming = cleanVoiceMessage(streamingContent);
              if (cleanStreaming) onVoiceMessageRef.current?.(cleanStreaming, voiceId);
            }
          }
        });

        onActivityRef.current?.(true);
        if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
        activityTimeoutRef.current = setTimeout(() => {
          onActivityRef.current?.(false);
          activityTimeoutRef.current = null;
        }, 1000);
      };

      ws.onerror = () => {
        term.write('\r\n\x1b[31m[Overseer] Connection error. Is the backend running?\x1b[0m\r\n');
      };

      ws.onclose = () => {
        term.write('\r\n\x1b[33m[Overseer] Connection closed.\x1b[0m\r\n');
      };

      // Terminal handles its own input directly — no mirroring needed
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data }));
        }
      });

      term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      });

      xtermRef.current = term;

      const resizeObserver = new ResizeObserver(() => {
        if (terminalRef.current) fitAddon.fit();
      });
      if (terminalRef.current) resizeObserver.observe(terminalRef.current);

      return () => {
        resizeObserver.disconnect();
        ws.close();
        term.dispose();
      };
    }, [id, cwd, command, personaId]);

    return (
      <div className="w-full h-full bg-slate-900 overflow-hidden relative group/term">
        <div ref={terminalRef} className="w-full h-full" />
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md border border-slate-700 opacity-0 group-hover/term:opacity-100 transition-all duration-200 z-10"
          title="Copy terminal output"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    );
  }
);
