import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Terminal } from './components/Terminal';

const App = () => {
  const [activeSessionId, setActiveSessionId] = useState('default');

  return (
    <div style={{ backgroundColor: '#1a1b26', color: '#a9b1d6', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
      <header style={{ padding: '10px 20px', borderBottom: '1px solid #33467C', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Overseer Native</h1>
        <div style={{ fontSize: '0.9rem', color: '#565f89' }}>Session: {activeSessionId}</div>
      </header>
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Terminal id={activeSessionId} />
      </main>
    </div>
  );
};

// Global styles for the app
const style = document.createElement('style');
style.textContent = `
  body { margin: 0; padding: 0; overflow: hidden; }
  #root { height: 100vh; }
`;
document.head.appendChild(style);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
