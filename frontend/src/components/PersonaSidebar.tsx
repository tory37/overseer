import React, { useState } from 'react';

const PersonaGroup = ({ name }: { name: string }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="text-sm">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full text-left font-bold text-gray-400 py-1 hover:text-white flex items-center"
      >
        <span className="mr-1">{expanded ? '▼' : '▶'}</span> {name}
      </button>
      {expanded && <div className="pl-4 mt-1 space-y-1 text-gray-500 cursor-pointer hover:text-gray-300">Session 1</div>}
    </div>
  );
};

export const PersonaSidebar = () => {
  return (
    <nav className="p-2 space-y-2">
      <PersonaGroup name="Default Persona" />
      <PersonaGroup name="Research Agent" />
    </nav>
  );
};
