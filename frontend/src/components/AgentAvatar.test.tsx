import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgentAvatar } from './AgentAvatar';
import type { AvatarConfig } from '../utils/api';

vi.mock('@dicebear/core', () => ({
  createAvatar: () => ({ toString: () => '<svg xmlns="http://www.w3.org/2000/svg"></svg>' }),
}));
vi.mock('@dicebear/collection', () => ({
  pixelArt: {},
}));
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { animate?: unknown; transition?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const config: AvatarConfig = {
  eyes: 'variant01',
  mouth: 'happy04',
  hair: 'short01',
  skinColor: 'fcd5b0',
  hairColor: '6b3a2a',
  backgroundColor: '1e293b',
  clothingColor: '5bc0de',
  clothing: 'variant01',
  glasses: '',
  beard: '',
  hat: '',
  accessories: '',
};

describe('AgentAvatar', () => {
  it('renders an img element', () => {
    render(<AgentAvatar avatarConfig={config} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('applies pixelated image rendering', () => {
    render(<AgentAvatar avatarConfig={config} />);
    const img = screen.getByRole('img');
    expect(img).toHaveStyle({ imageRendering: 'pixelated' });
  });

  it('renders at the specified size', () => {
    render(<AgentAvatar avatarConfig={config} size={32} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '32');
    expect(img).toHaveAttribute('height', '32');
  });

  it('uses 40 as default size', () => {
    render(<AgentAvatar avatarConfig={config} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '40');
  });
});
