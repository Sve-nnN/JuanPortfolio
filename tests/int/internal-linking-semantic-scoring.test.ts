import { describe, it, expect } from 'vitest';
import { scoreOpportunities } from '../../src/scripts/internal-linking/semantic/scorer';
import { DeterministicEmbeddingProvider } from '../../src/scripts/internal-linking/semantic/embedding-provider';
import type { LinkOpportunity } from '../../src/scripts/internal-linking/types';

function makeOpportunity(params: {
  keyword: string;
  context: string;
  targetTitle: string;
  targetKeywords: string[];
  relevance: number;
  targetSlug: string;
}): LinkOpportunity {
  return {
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
      slug: params.targetSlug,
      title: params.targetTitle,
      primary_keywords: params.targetKeywords,
      semantic_keywords: ['optimizacion seo'],
      category: 'seo',
      filePath: `/tmp/${params.targetSlug}.md`,
      url: `/blog/seo/${params.targetSlug}`,
      idioma: 'es',
    },
    keyword: params.keyword,
    context: params.context,
    lineNumber: 8,
    relevance: params.relevance,
  };
}

describe('internal-linking semantic scorer integration', () => {
  it('increases rank with semantic similarity when lexical score is tied', async () => {
    const provider = new DeterministicEmbeddingProvider(64);

    const sameLexical = 0.62;
    const opportunities = [
      makeOpportunity({
        keyword: 'auditoria tecnica seo',
        context: 'La auditoria tecnica seo evalua rastreo, indexacion y rendimiento web.',
        targetTitle: 'Checklist auditoria tecnica seo',
        targetKeywords: ['auditoria tecnica seo', 'rastreo e indexacion'],
        relevance: sameLexical,
        targetSlug: 'auditoria-seo',
      }),
      makeOpportunity({
        keyword: 'auditoria tecnica seo',
        context: 'La auditoria tecnica seo evalua rastreo, indexacion y rendimiento web.',
        targetTitle: 'Guia de automatizacion con python',
        targetKeywords: ['automatizacion python', 'scripts backend'],
        relevance: sameLexical,
        targetSlug: 'python-automation',
      }),
    ];

    const scored = await scoreOpportunities(opportunities, provider);

    expect(scored[0].targetPost.slug).toBe('auditoria-seo');
    expect(scored[0].semantic?.vectorScore ?? 0).toBeGreaterThan(scored[1].semantic?.vectorScore ?? 0);
  });

  it('keeps deterministic ordering for ties', async () => {
    const provider = new DeterministicEmbeddingProvider(64);

    const opportunities = [
      makeOpportunity({
        keyword: 'seo',
        context: 'seo tecnico y seo on page',
        targetTitle: 'A',
        targetKeywords: ['seo'],
        relevance: 0.5,
        targetSlug: 'z-slug',
      }),
      makeOpportunity({
        keyword: 'seo',
        context: 'seo tecnico y seo on page',
        targetTitle: 'A',
        targetKeywords: ['seo'],
        relevance: 0.5,
        targetSlug: 'a-slug',
      }),
    ];

    const scored = await scoreOpportunities(opportunities, provider, {
      lexical: 1,
      vector: 0,
      cluster: 0,
    });

    expect(scored[0].targetPost.slug).toBe('a-slug');
    expect(scored[1].targetPost.slug).toBe('z-slug');
  });
});
