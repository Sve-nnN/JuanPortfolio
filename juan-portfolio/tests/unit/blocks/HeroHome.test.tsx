import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroHome } from '../../../src/blocks/HeroHome/Component';

describe('HeroHomeBlock component', () => {
  const mockMedia = {
    id: '1',
    filename: 'test.jpg',
    alt: 'Test Image',
    url: '/test.jpg',
  };

  it('renders with all props', () => {
    render(
      <HeroHome
        badge="Test Badge"
        title="Test Title"
        subtitle="Test Subtitle"
        description="Test Description"
        primaryCta={{ label: 'Primary CTA', url: '/primary' }}
        secondaryCta={{ label: 'Secondary CTA', url: '/secondary' }}
        media={mockMedia}
      />
    );

    expect(screen.getByText('Test Badge')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Primary CTA' })).toHaveAttribute('href', '/primary');
    expect(screen.getByRole('link', { name: 'Secondary CTA' })).toHaveAttribute('href', '/secondary');
    expect(screen.getByAltText('Test Image')).toBeInTheDocument();
  });

  it('renders with minimal props', () => {
    render(<HeroHome title="Minimal Title" />);
    expect(screen.getByText('Minimal Title')).toBeInTheDocument();
  });

  it('renders with richText instead of description', () => {
    const richText = { root: { type: 'root', version: 1, children: [] } };
    render(<HeroHome title="Rich Text Title" richText={richText as any} />); // Cast richText to any
    expect(screen.getByText('Rich Text Title')).toBeInTheDocument();
  });
});
