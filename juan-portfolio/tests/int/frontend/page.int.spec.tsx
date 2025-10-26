import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Page from '../../../src/app/(frontend)/[slug]/page';

// Mock dependencies
vi.mock('payload', async () => {
  const actual = await vi.importActual('payload');
  return {
    ...actual,
    getPayload: vi.fn().mockResolvedValue({
      find: vi.fn().mockImplementation(({ collection, where }) => {
        if (collection === 'pages' && where.slug.equals === 'test-page') {
          return Promise.resolve({ docs: [{ id: '1', title: 'Test Page', slug: 'test-page', hero: {}, layout: [] }] });
        }
        return Promise.resolve({ docs: [] });
      }),
      findGlobal: vi.fn().mockResolvedValue({ id: '1', title: 'Home' }),
    }),
  };
});
vi.mock('next/headers', () => ({
  headers: vi.fn(() => new Map()),
  draftMode: vi.fn(() => ({ isEnabled: false })),
}));

describe('Page component', () => {
  it('renders the home page', async () => {
    render(await Page({ params: Promise.resolve({ slug: 'home' }) }));
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders a regular page', async () => {
    render(await Page({ params: Promise.resolve({ slug: 'test-page' }) }));
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('renders a not found page for a non-existent slug', async () => {
    render(await Page({ params: Promise.resolve({ slug: 'non-existent' }) }));
    // You might need to adjust this expectation based on your PayloadRedirects component
    expect(screen.getByText('Redirecting...')).toBeInTheDocument();
  });
});
