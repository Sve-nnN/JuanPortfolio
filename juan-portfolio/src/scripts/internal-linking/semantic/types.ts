export interface SemanticScore {
  lexicalScore: number;
  clusterScore: number;
  vectorScore: number;
  totalScore: number;
  weights: ScoringWeights;
}

export interface ScoringWeights {
  lexical: number;
  cluster: number;
  vector: number;
}

export interface EmbeddingProvider {
  readonly modelName: string;
  readonly providerName: 'transformers' | 'fallback';
  readonly dimensions: number;
  embed(text: string, locale?: 'es' | 'en'): Promise<number[]>;
  embedMany(texts: string[], locale?: 'es' | 'en'): Promise<number[][]>;
}

export interface SemanticRuntimeConfig {
  enabled?: boolean;
  provider?: 'auto' | 'transformers' | 'fallback';
  model?: string;
  dimensions?: number;
  weights?: Partial<ScoringWeights>;
}

export interface SemanticScoringInput {
  sourceText: string;
  targetText: string;
  lexicalScore: number;
  clusterScore: number;
  locale?: 'es' | 'en';
}
