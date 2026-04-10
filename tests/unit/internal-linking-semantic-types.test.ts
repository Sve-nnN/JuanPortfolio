import { describe, it, expect } from 'vitest';
import { DeterministicEmbeddingProvider } from '../../src/scripts/internal-linking/semantic/embedding-provider';
import { resolveScoringWeights } from '../../src/scripts/internal-linking/semantic/scorer';
import type { LinkOpportunity } from '../../src/scripts/internal-linking/types';

describe('internal-linking semantic contracts', () => {
  it('provides deterministic fallback vectors', async () => {
    const provider = new DeterministicEmbeddingProvider(32);

    const first = await provider.embed('seo tecnico avanzado');
    const second = await provider.embed('seo tecnico avanzado');
    const other = await provider.embed('rendimiento web core vitals');

    expect(first).toHaveLength(32);
    expect(first).toEqual(second);
    expect(first).not.toEqual(other);
  });

  it('normalizes semantic weights', () => {
    const weights = resolveScoringWeights({ lexical: 3, cluster: 1, vector: 2 });
    const total = weights.lexical + weights.cluster + weights.vector;

    expect(total).toBeCloseTo(1, 10);
    expect(weights.lexical).toBeGreaterThan(weights.cluster);
  });

  it('supports scored opportunities without breaking base fields', () => {
    const opportunity: LinkOpportunity = {
      sourcePost: {
        slug: 'source',
        title: 'Source',
        primary_keywords: ['seo tecnico'],
        category: 'seo',
        filePath: '/tmp/source.md',
        url: '/blog/seo/source',
        idioma: 'es',
      },
      targetPost: {
        slug: 'target',
        title: 'Target',
        primary_keywords: ['auditoria seo'],
        category: 'seo',
        filePath: '/tmp/target.md',
        url: '/blog/seo/target',
        idioma: 'es',
      },
      keyword: 'auditoria seo',
      context: 'La auditoria seo tecnica mejora resultados.',
      lineNumber: 12,
      relevance: 0.73,
      semantic: {
        lexicalScore: 0.8,
        clusterScore: 1,
        vectorScore: 0.7,
        totalScore: 0.79,
        weights: { lexical: 0.5, cluster: 0.2, vector: 0.3 },
      },
    };

    expect(opportunity.keyword).toBe('auditoria seo');
    expect(opportunity.semantic?.totalScore).toBeGreaterThan(0.75);
  });
});
