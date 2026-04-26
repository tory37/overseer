import React from 'react';

interface MascotFrameProps {
  voiceText?: string;
  isThinking?: boolean;
}

export const MascotFrame: React.FC<MascotFrameProps> = ({ voiceText, isThinking }) => {
  return (
    <div style={{ 
      padding: '20px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      borderTop: '1px solid #33467C',
      backgroundColor: '#16161e'
    }}>
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <img 
          src="/assets/avatars/overseer.svg" 
          alt="Overseer Mascot" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        {isThinking && (
          <div className="thinking-dots" style={{ position: 'absolute', top: -10, right: -10 }}>
            ...
          </div>
        )}
      </div>
      
      {voiceText && (
        <div style={{ 
          marginTop: '15px', 
          padding: '12px 16px', 
          backgroundColor: '#33467C', 
          borderRadius: '12px',
          color: '#fff',
          fontSize: '0.9rem',
          lineHeight: '1.4',
          position: 'relative',
          width: '100%',
          maxWidth: '200px'
        }}>
          {voiceText}
          <div style={{ 
            position: 'absolute', 
            top: '-8px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '8px solid #33467C'
          }} />
        </div>
      )}
    </div>
  );
};
