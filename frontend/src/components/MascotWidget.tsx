import React, { useState, useEffect, useRef } from 'react';
import { AgentAvatar } from './AgentAvatar';
import type { AvatarConfig } from '../utils/api';

interface VoiceMessage {
  id: string;
  text: string;
  timestamp: number;
  sender: 'agent' | 'user';
}

interface MascotWidgetProps {
  latestVoice: VoiceMessage | null;
  isWorking: boolean;
  avatarConfig: AvatarConfig;
  personaName: string;
}

const BUBBLE_LINGER_MS = 7000;

export const MascotWidget: React.FC<MascotWidgetProps> = ({
  latestVoice,
  isWorking,
  avatarConfig,
  personaName,
}) => {
  const [bubble, setBubble] = useState<{ text: string; key: string } | null>(null);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [talkingUntil, setTalkingUntil] = useState(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show bubble when a new voice message arrives
  useEffect(() => {
    if (!latestVoice) return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);

    const wordCount = latestVoice.text.split(/\s+/).filter(Boolean).length;
    setTalkingUntil(Date.now() + wordCount * 80);

    setBubble({ text: latestVoice.text, key: latestVoice.id });
    setPhase('in');

    dismissTimer.current = setTimeout(() => {
      setPhase('out');
      setTimeout(() => setBubble(null), 320);
    }, BUBBLE_LINGER_MS);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [latestVoice]);

  const dismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setPhase('out');
    setTimeout(() => setBubble(null), 320);
  };

  const avatarState: 'idle' | 'talking' | 'thinking' =
    isWorking ? 'thinking' : talkingUntil > Date.now() ? 'talking' : 'idle';

  return (
    <div
      style={{
        position: 'absolute',
        top: 44,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      {/* Speech bubble */}
      {bubble && (
        <div
          key={bubble.key}
          style={{
            position: 'relative',
            maxWidth: 280,
            background: 'linear-gradient(135deg, #0f1e36 0%, #0d1829 100%)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 14,
            padding: '10px 13px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.06)',
            pointerEvents: 'auto',
            animation: phase === 'in'
              ? 'mascotBubbleIn 0.25s cubic-bezier(0.34,1.4,0.64,1) forwards'
              : 'mascotBubbleOut 0.3s ease-in forwards',
          }}
        >
          {/* Persona label */}
          <div style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#3b82f6',
            marginBottom: 5,
            opacity: 0.8,
            fontFamily: 'inherit',
          }}>
            {personaName}
          </div>

          {/* Message text */}
          <p style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.55,
            color: '#cbd5e1',
          }}>
            {bubble.text}
          </p>

          {/* Tail — points up toward avatar (top-right) */}
          <div style={{
            position: 'absolute',
            top: -7,
            right: 18,
            width: 12,
            height: 8,
            background: '#0f1e36',
            clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
          }} />

          {/* Dismiss */}
          <button
            onClick={dismiss}
            style={{
              position: 'absolute',
              top: 6,
              right: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#334155',
              fontSize: 14,
              lineHeight: 1,
              padding: 2,
              pointerEvents: 'auto',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Avatar row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', flexDirection: 'row-reverse', gap: 8 }}>
        <AgentAvatar
          avatarConfig={avatarConfig}
          state={avatarState}
          talkingUntil={talkingUntil}
          size={44}
        />

        {/* Thinking dots */}
        {isWorking && (
          <div style={{
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            padding: '6px 10px',
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(51,65,85,0.5)',
            borderRadius: 10,
            marginBottom: 4,
            pointerEvents: 'none',
          }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#475569',
                  animation: `mascotDot 1.2s ease-in-out infinite ${i * 150}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Keyframes injected once */}
      <style>{`
        @keyframes mascotBubbleIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes mascotBubbleOut {
          from { opacity: 1; transform: translateY(0)    scale(1);    }
          to   { opacity: 0; transform: translateY(-8px) scale(0.95); }
        }
        @keyframes mascotDot {
          0%,80%,100% { transform: translateY(0); }
          40%         { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default MascotWidget;
