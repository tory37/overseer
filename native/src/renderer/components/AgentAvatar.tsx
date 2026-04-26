import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createAvatar } from '@dicebear/core';
import { pixelArt } from '@dicebear/collection';
import { AvatarConfig } from '../types';

interface AgentAvatarProps {
  avatarConfig: AvatarConfig;
  state?: 'idle' | 'talking' | 'thinking';
  talkingUntil?: number;
  size?: number;
  className?: string;
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  avatarConfig,
  state: initialState = 'idle',
  talkingUntil = 0,
  size = 40,
  className = '',
}) => {
  const [state, setState] = useState(initialState);
  const [mouthVariant, setMouthVariant] = useState(avatarConfig.mouth);

  // Sync state if initial state changes (except when in 'auto')
  useEffect(() => {
    if (initialState !== 'auto') {
      setState(initialState);
    }
  }, [initialState]);

  // Handle auto-cycling for previews
  useEffect(() => {
    if (initialState !== 'auto') return;

    const cycle = () => {
      setState('talking');
      setTimeout(() => {
        setState('thinking');
        setTimeout(() => {
          setState('idle');
        }, 3000);
      }, 3000);
    };

    cycle();
    const interval = setInterval(cycle, 10000);
    return () => clearInterval(interval);
  }, [initialState]);

  useEffect(() => {
    if (state !== 'talking') {
      setMouthVariant(avatarConfig.mouth);
      return;
    }
    const interval = setInterval(() => {
      setMouthVariant(v => (v === avatarConfig.mouth ? 'happy07' : avatarConfig.mouth));
    }, 150);
    return () => clearInterval(interval);
  }, [state, avatarConfig.mouth]);

  const svgDataUrl = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opts: Record<string, any> = {
      eyes: [avatarConfig.eyes],
      mouth: [mouthVariant],
      hair: [avatarConfig.hair],
      skinColor: [avatarConfig.skinColor],
      hairColor: [avatarConfig.hairColor],
      backgroundColor: [avatarConfig.backgroundColor],
      clothing: [avatarConfig.clothing],
      clothingColor: [avatarConfig.clothingColor],
      glassesProbability: avatarConfig.glasses ? 100 : 0,
      beardProbability: avatarConfig.beard ? 100 : 0,
      hatProbability: avatarConfig.hat ? 100 : 0,
      accessoriesProbability: avatarConfig.accessories ? 100 : 0,
      size,
    };
    if (avatarConfig.glasses) opts.glasses = [avatarConfig.glasses];
    if (avatarConfig.beard) opts.beard = [avatarConfig.beard];
    if (avatarConfig.hat) opts.hat = [avatarConfig.hat];
    if (avatarConfig.accessories) opts.accessories = [avatarConfig.accessories];
    const avatar = createAvatar(pixelArt, opts);
    const svg = avatar.toString();
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [avatarConfig, mouthVariant, size]);

  return (
    <motion.div
      className={className}
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
