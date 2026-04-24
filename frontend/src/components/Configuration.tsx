import React from 'react';
import { useViewMode } from '../utils/useViewMode';

export const Configuration: React.FC = () => {
  const { isPersonaView, toggleViewMode } = useViewMode();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Configuration</h2>
      <div className="flex items-center justify-between p-4 border rounded">
        <span>Persona-based View</span>
        <button
          onClick={toggleViewMode}
          className={`px-4 py-2 rounded ${
            isPersonaView ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          {isPersonaView ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
  );
};
