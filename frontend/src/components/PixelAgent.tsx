import React from 'react';

interface PixelAgentProps {
  message: string | null;
  avatarId: string; // Placeholder for now, can be a path or an ID
}

export const PixelAgent: React.FC<PixelAgentProps> = ({ message, avatarId }) => {
  if (!message) {
    return null;
  }

  // Basic styling for a speech bubble and an avatar placeholder
  return (
    <div className="absolute bottom-4 left-4 flex items-end space-x-2">
      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
        {/* Replace with actual avatar image later */}
        {avatarId.substring(0, 1).toUpperCase()} 
      </div>
      <div className="relative bg-gray-700 text-white p-3 rounded-lg shadow-lg max-w-xs break-words">
        {message}
        <div className="absolute left-0 bottom-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-gray-700 border-b-8 border-b-transparent transform -translate-x-full"></div>
      </div>
    </div>
  );
};