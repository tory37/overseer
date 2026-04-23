import { useEffect, useRef } from 'react';
import { Terminal as Xterm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  id?: string;
  cwd?: string;
  command?: string;
}

export const Terminal = ({ id, cwd, command }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Xterm | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

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
    const host = window.location.host;
    const wsUrl = new URL(`${protocol}//${host}/ws/terminal`);
    
    if (id) {
      wsUrl.searchParams.append('sessionId', id);
    }
    if (cwd) {
      wsUrl.searchParams.append('cwd', cwd);
    }
    if (command) {
      wsUrl.searchParams.append('command', command);
    }
    
    console.log(`Connecting to WebSocket: ${wsUrl.toString()}`);
    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onmessage = (event) => {
      term.write(event.data);
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
  }, [id, cwd, command]);

  return (
    <div className="w-full h-full bg-slate-900 overflow-hidden">
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
};
