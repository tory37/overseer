import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  return (
    <div style={{ backgroundColor: '#1a1b26', color: '#a9b1d6', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <h1>Overseer Native</h1>
      <p>The stable command center is coming to life...</p>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
