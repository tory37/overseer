import React, { useEffect, useRef } from 'react';
import { Terminal as Xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const { ipcRenderer } = window.require('electron');

interface TerminalProps {
  id: string;
  cwd?: string;
  persona?: string;
  cliType?: string;
  yoloMode?: boolean;
  allowedTools?: string;
  cursorMode?: string;
  agentSessionId?: string;
  onData?: (data: string) => void;
  onVoice?: (text: string) => void;
  onActivity?: (isThinking: boolean) => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  id, cwd, persona, cliType, yoloMode, allowedTools, cursorMode, agentSessionId, onData, onVoice, onActivity
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Xterm>();
  const fitAddonRef = useRef<FitAddon>();
  const voiceBufferRef = useRef<string>('');
  const thinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const term = new Xterm({
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        cursor: '#f7768e',
        selectionBackground: '#33467C',
        black: '#15161E',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    if (terminalRef.current) {
      term.open(terminalRef.current);
      fitAddon.fit();
    }

    const onDataHandler = (data: string) => {
      term.write(data);
      if (onData) onData(data);
      
      // Activity / Thinking detection
      const text = data.toString();
      const isSpinning = text.includes('\r') && (
        text.includes('⠋') || text.includes('⠙') || text.includes('⠹') || 
        text.includes('⠸') || text.includes('⠼') || text.includes('⠴') || 
        text.includes('⠦') || text.includes('⠧') || text.includes('⠇') || 
        text.includes('⠏')
      );
      
      const isThinkingText = text.toLowerCase().includes('thinking...');
      
      if (isSpinning || isThinkingText) {
        if (onActivity) onActivity(true);
        if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
        thinkingTimeoutRef.current = setTimeout(() => {
          if (onActivity) onActivity(false);
        }, 2000);
      }

      // Voice detection logic
      voiceBufferRef.current += data;
      const voiceRegex = /<voice>(.*?)<\/voice>/g;
      let match;
      while ((match = voiceRegex.exec(voiceBufferRef.current)) !== null) {
        if (onVoice) onVoice(match[1]);
      }
      if (voiceBufferRef.current.length > 5000) {
        voiceBufferRef.current = voiceBufferRef.current.slice(-1000);
      }
    };

    const ptyDataListener = (_: any, data: string) => onDataHandler(data);
    ipcRenderer.on(`pty-data-${id}`, ptyDataListener);

    term.onData(data => {
      ipcRenderer.send('pty-write', { id, data });
    });

    ipcRenderer.send('pty-create', {
      id,
      cwd: cwd || process.env.HOME,
      persona,
      cliType,
      yoloMode,
      allowedTools,
      cursorMode,
      agentSessionId,
    });

    xtermRef.current = term;

    const handleResize = () => {
      fitAddon.fit();
      ipcRenderer.send('pty-resize', { id, cols: term.cols, rows: term.rows });
    };

    window.addEventListener('resize', handleResize);
    // Initial resize report
    setTimeout(handleResize, 100);

    return () => {
      if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
      window.removeEventListener('resize', handleResize);
      ipcRenderer.removeListener(`pty-data-${id}`, ptyDataListener);
      term.dispose();
    };
  }, [id, cwd, persona, cliType, yoloMode, allowedTools, cursorMode, agentSessionId, onData, onVoice, onActivity]);

  return <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />;
};
