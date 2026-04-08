import type { LinkOpportunity } from '../types';
import type { EmbeddingProvider, ScoringWeights, SemanticScore } from './types';

const DEFAULT_WEIGHTS: ScoringWeights = {
  lexical: 0.55,
  cluster: 0.15,
  vector: 0.30,
};

export function resolveScoringWeights(partial?: Partial<ScoringWeights>): ScoringWeights {
  const merged: ScoringWeights = {
    lexical: partial?.lexical ?? DEFAULT_WEIGHTS.lexical,
    cluster: partial?.cluster ?? DEFAULT_WEIGHTS.cluster,
    vector: partial?.vector ?? DEFAULT_WEIGHTS.vector,
  };

  const total = merged.lexical + merged.cluster + merged.vector;
  if (total <= 0) {
    return DEFAULT_WEIGHTS;
  }

  return {
    lexical: merged.lexical / total,
    cluster: merged.cluster / total,
    vector: merged.vector / total,
  };
}

export async function scoreOpportunities(
  opportunities: LinkOpportunity[],
  provider: EmbeddingProvider,
  weights?: Partial<ScoringWeights>,
): Promise<LinkOpportunity[]> {
  if (opportunities.length === 0) {
    return opportunities;
  }

  const resolvedWeights = resolveScoringWeights(weights);
  const cache = new Map<string, number[]>();

  const textsToEmbed: string[] = [];
  for (const op of opportunities) {
    const sourceText = buildSourceText(op);
    const targetText = buildTargetText(op);
    if (!cache.has(sourceText)) textsToEmbed.push(sourceText);
    if (!cache.has(targetText)) textsToEmbed.push(targetText);
  }

  if (textsToEmbed.length > 0) {
    const vectors = await provider.embedMany(textsToEmbed);
    textsToEmbed.forEach((text, idx) => {
      cache.set(text, vectors[idx]);
    });
  }

  const scored = opportunities.map((op) => {
    const sourceText = buildSourceText(op);
    const targetText = buildTargetText(op);

    const sourceVector = cache.get(sourceText) ?? [];
    const targetVector = cache.get(targetText) ?? [];

    const vectorScore = cosineSimilarity(sourceVector, targetVector);
    const lexicalScore = clamp(op.relevance);
    const clusterScore = op.sourcePost.category === op.targetPost.category ? 1 : 0;

    const totalScore = clamp(
      lexicalScore * resolvedWeights.lexical +
      clusterScore * resolvedWeights.cluster +
      vectorScore * resolvedWeights.vector,
    );

    const semantic: SemanticScore = {
      lexicalScore,
      clusterScore,
      vectorScore,
      totalScore,
      weights: resolvedWeights,
    };

    return {
      ...op,
      relevance: totalScore,
      semantic,
    };
  });

  return scored.sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    if (b.keyword.length !== a.keyword.length) return b.keyword.length - a.keyword.length;
    return a.targetPost.slug.localeCompare(b.targetPost.slug);
  });
}

function buildSourceText(opportunity: LinkOpportunity): string {
  return opportunity.context.toLowerCase();
}

function buildTargetText(opportunity: LinkOpportunity): string {
  const parts = [
    opportunity.targetPost.title,
    ...opportunity.targetPost.primary_keywords,
    ...(opportunity.targetPost.semantic_keywords ?? []),
  ];
  return parts.join(' ').toLowerCase();
}

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return clamp((dot / denominator + 1) / 2);
}
