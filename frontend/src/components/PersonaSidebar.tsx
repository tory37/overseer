import React, { useState } from 'react';

export const SessionItem = ({ title, isActive }: { title: string; isActive: boolean }) => (
  <div className={`cursor-pointer px-2 py-1 rounded ${isActive ? 'bg-blue-900 text-blue-100' : 'hover:bg-gray-800 text-gray-400'}`}>
    {title}
  </div>
);

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
      {expanded && (
        <div className="pl-4 mt-1 space-y-1">
          <SessionItem title="Analysis Session" isActive={true} />
          <SessionItem title="Setup Session" isActive={false} />
        </div>
      )}
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
