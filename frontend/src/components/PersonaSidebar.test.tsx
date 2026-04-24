import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SessionItem } from './PersonaSidebar';

describe('SessionItem', () => {
  it('renders the session title', () => {
    render(<SessionItem title="Analysis Session" isActive={false} />);
    expect(screen.getByText('Analysis Session')).toBeInTheDocument();
  });

  it('applies active styles when isActive is true', () => {
    const { container } = render(<SessionItem title="Active Session" isActive={true} />);
    expect(container.firstChild).toHaveClass('bg-blue-900');
  });

  it('applies inactive styles when isActive is false', () => {
    const { container } = render(<SessionItem title="Inactive Session" isActive={false} />);
    expect(container.firstChild).toHaveClass('hover:bg-gray-800');
  });
});
