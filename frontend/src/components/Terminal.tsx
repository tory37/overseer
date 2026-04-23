import { useEffect, useRef } from 'react';
import { Terminal as Xterm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  id?: string;
  cwd?: string;
  command?: string;
  personaId?: string | null;
  onVoiceMessage?: (message: string) => void;
}

export const Terminal = ({ id, cwd, command, personaId, onVoiceMessage }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Xterm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const onVoiceMessageRef = useRef(onVoiceMessage);
  const bufferRef = useRef('');

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onVoiceMessageRef.current = onVoiceMessage;
  }, [onVoiceMessage]);

  useEffect(() => {
    if (!terminalRef.current) return;
    if (!id) return;
    
    // Reset buffer on connect
    bufferRef.current = '';

    const term = new Xterm({
      theme: {
        background: '#0f172a',
        foreground: '#f8fafc',
        cursor: '#f8fafc',
      },
      fontFamily: '"Fira Code", monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = new URL(`${protocol}//${window.location.host}/ws/terminal`);
    
    wsUrl.searchParams.append('sessionId', id);
    if (cwd) {
      wsUrl.searchParams.append('cwd', cwd);
    }
    if (command) {
      wsUrl.searchParams.append('command', command);
    }
    if (personaId) {
      wsUrl.searchParams.append('personaId', personaId);
    }
    
    console.log(`Connecting to WebSocket: ${wsUrl.toString()}`);
    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = event.data;
      if (typeof data !== 'string') return;

      bufferRef.current += data;
      let currentBuffer = bufferRef.current;
      
      const voiceRegex = /<voice>(.*?)<\/voice>/gs;
      let match;
      let lastIndex = 0;
      let processedData = '';

      while ((match = voiceRegex.exec(currentBuffer)) !== null) {
        // Text before the tag is normal terminal output
        processedData += currentBuffer.substring(lastIndex, match.index);
        
        // Extract message and notify
        const message = match[1].trim();
        if (message) {
          onVoiceMessageRef.current?.(message);
        }
        lastIndex = voiceRegex.lastIndex;
      }

      // Check for partial tags at the end of the buffer
      const remaining = currentBuffer.substring(lastIndex);
      
      // We only want to buffer if the 'remaining' string looks like a partial <voice> or </voice> tag.
      // If it has a '<' but it's followed by something that CAN'T be 'voice>' or '/voice>', we should flush it.
      const lastOpenBracket = remaining.lastIndexOf('<');
      
      if (lastOpenBracket !== -1) {
        const potentialTag = remaining.substring(lastOpenBracket);
        // If it's just "<", or "<v", "<vo" etc., keep it in buffer.
        // If it's something like "<echo", it's NOT a voice tag, so flush it.
        const isPotentialStart = /^<(v(o(i(c(e(>)?)?)?)?)?)?$/.test(potentialTag);
        const isPotentialEnd = /^<\/(v(o(i(c(e(>)?)?)?)?)?)?$/.test(potentialTag);
        
        if (isPotentialStart || isPotentialEnd) {
          // Flush everything before the bracket
          processedData += remaining.substring(0, lastOpenBracket);
          bufferRef.current = potentialTag;
        } else {
          // Not a voice tag, flush everything
          processedData += remaining;
          bufferRef.current = '';
        }
      } else {
        // No open bracket, flush everything
        processedData += remaining;
        bufferRef.current = '';
      }

      if (processedData) {
        term.write(processedData);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      term.write('\r\n\x1b[31m[Overseer] Connection error. Is the backend running?\x1b[0m\r\n');
    };

    ws.onclose = () => {
      term.write('\r\n\x1b[33m[Overseer] Connection closed.\x1b[0m\r\n');
    };

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
      fitAddon.fit();
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [id, cwd, command]); // Removed onVoiceMessage from dependencies

  return (
    <div className="w-full h-full bg-slate-900 overflow-hidden">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
};
