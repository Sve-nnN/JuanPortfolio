import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContentBlock } from '../../../src/blocks/Content/Component';

describe('ContentBlock component', () => {
  it('renders a single column', () => {
    const columns = [
      {
        size: 'full',
        richText: { root: { type: 'root', version: 1, children: [] } },
        enableLink: false,
      },
    ] as any;
    render(<ContentBlock columns={columns} blockType="content" />);
    expect(screen.getByText('')).toBeInTheDocument();
  });

  it('renders multiple columns of different sizes', () => {
    const columns = [
      {
        size: 'half',
        richText: { root: { type: 'root', version: 1, children: [] } },
        enableLink: false,
      },
      {
        size: 'half',
        richText: { root: { type: 'root', version: 1, children: [] } },
        enableLink: false,
      },
    ] as any;
    render(<ContentBlock columns={columns} blockType="content" />);
    expect(screen.getAllByText('').length).toBe(2);
  });

  it('renders a column with rich text and a link', () => {
    const columns = [
      {
        size: 'full',
        richText: { root: { type: 'root', version: 1, children: [] } },
        enableLink: true,
        link: { type: 'custom', url: '/custom-url', label: 'Custom Link' },
      },
    ] as any;
    render(<ContentBlock columns={columns} blockType="content" />);
    expect(screen.getByText('')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Custom Link' })).toBeInTheDocument();
  });
});
