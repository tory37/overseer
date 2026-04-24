import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import { pixelArt } from '@dicebear/collection';
import type { AvatarConfig } from '../utils/api';

interface AgentAvatarProps {
  avatarConfig: AvatarConfig;
  state?: 'idle' | 'talking' | 'thinking';
  talkingUntil?: number;
  size?: number;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  avatarConfig,
  state = 'idle',
  talkingUntil = 0,
  size = 40,
}) => {
  const [mouthVariant, setMouthVariant] = useState(avatarConfig.mouth);

  useEffect(() => {
    if (state !== 'talking') {
      setMouthVariant(avatarConfig.mouth);
      return;
    }
    setMouthVariant(avatarConfig.mouth);
    const interval = setInterval(() => {
      setMouthVariant(v => (v === avatarConfig.mouth ? 'variant01' : avatarConfig.mouth));
    }, 150);
    return () => clearInterval(interval);
  }, [talkingUntil, state, avatarConfig.mouth]);

  const svgDataUrl = useMemo(() => {
    const avatar = createAvatar(pixelArt, {
      eyes: [avatarConfig.eyes],
      mouth: [mouthVariant],
      hair: [avatarConfig.hair],
      skinColor: [avatarConfig.skinColor],
      hairColor: [avatarConfig.hairColor],
      backgroundColor: [avatarConfig.backgroundColor],
      size,
    });
    const svg = avatar.toString();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [avatarConfig, mouthVariant, size]);

  return (
    <motion.div
      animate={state === 'thinking' ? { opacity: [0.6, 1, 0.6] } : { y: [0, -2, 0] }}
      transition={{
        duration: state === 'thinking' ? 1.2 : 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }}
    >
      <img
        src={svgDataUrl}
        alt="Agent Avatar"
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated' }}
      />
    </motion.div>
  );
};
