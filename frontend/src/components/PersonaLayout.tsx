import React from 'react';

export const PersonaLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-64 border-r border-gray-700 bg-gray-900 overflow-y-auto">
        <div className="p-4 text-gray-200">Persona Sidebar</div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-950">
        <div className="p-4 text-gray-200">Active Session</div>
      </main>
    </div>
  );
};

export default PersonaLayout;
