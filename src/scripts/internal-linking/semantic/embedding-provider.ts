import type { EmbeddingProvider, SemanticRuntimeConfig } from './types';

const DEFAULT_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const DEFAULT_DIMENSIONS = 64;

type DynamicImportFn = <T = unknown>(moduleName: string) => Promise<T>;

const dynamicImport: DynamicImportFn = (moduleName: string) => {
  const importer = new Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
  return importer(moduleName) as Promise<unknown>;
};

export class DeterministicEmbeddingProvider implements EmbeddingProvider {
  readonly providerName = 'fallback' as const;
  readonly modelName = 'deterministic-hash-v1';

  constructor(readonly dimensions: number = DEFAULT_DIMENSIONS) {}

  async embed(text: string): Promise<number[]> {
    const vector = new Array(this.dimensions).fill(0);
    const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);

    for (const token of tokens) {
      const hash = this.hashToken(token);
      const index = hash % this.dimensions;
      const sign = hash % 2 === 0 ? 1 : -1;
      vector[index] += sign * (1 + (token.length % 3) * 0.1);
    }

    return this.normalize(vector);
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embed(text)));
  }

  private hashToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  private normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((acc, value) => acc + value * value, 0));
    if (norm === 0) {
      return vector;
    }
    return vector.map((value) => value / norm);
  }
}

export class TransformersEmbeddingProvider implements EmbeddingProvider {
  readonly providerName = 'transformers' as const;
  private extractorPromise?: Promise<(text: string, options?: Record<string, unknown>) => Promise<unknown>>;

  constructor(
    readonly modelName: string = DEFAULT_MODEL,
    readonly dimensions: number = 384,
  ) {}

  async embed(text: string): Promise<number[]> {
    const extractor = await this.getExtractor();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return this.toVector(output);
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embed(text)));
  }

  private async getExtractor(): Promise<(text: string, options?: Record<string, unknown>) => Promise<unknown>> {
    if (!this.extractorPromise) {
      this.extractorPromise = (async () => {
        const module = await dynamicImport<{ pipeline: (task: string, model: string, options?: Record<string, unknown>) => Promise<(text: string, options?: Record<string, unknown>) => Promise<unknown>> }>('@xenova/transformers');
        return module.pipeline('feature-extraction', this.modelName, { quantized: true });
      })();
    }

    return this.extractorPromise;
  }

  private toVector(output: unknown): number[] {
    const arr = this.tryReadArray(output);
    if (Array.isArray(arr) && typeof arr[0] === 'number') {
      return arr as number[];
    }
    if (Array.isArray(arr) && Array.isArray(arr[0])) {
      return arr[0] as number[];
    }
    throw new Error('Unexpected transformers embedding output format');
  }

  private tryReadArray(output: unknown): unknown {
    if (output && typeof output === 'object') {
      const asRecord = output as Record<string, unknown>;
      if (Array.isArray(asRecord.data)) return asRecord.data;
      if (Array.isArray(asRecord.tolist)) return asRecord.tolist;
      if (typeof asRecord.tolist === 'function') return (asRecord.tolist as () => unknown)();
    }
    return output;
  }
}

export async function createEmbeddingProvider(config?: SemanticRuntimeConfig): Promise<EmbeddingProvider> {
  const provider = config?.provider ?? 'auto';
  const model = config?.model ?? DEFAULT_MODEL;
  const dimensions = config?.dimensions ?? DEFAULT_DIMENSIONS;

  if (provider === 'fallback') {
    return new DeterministicEmbeddingProvider(dimensions);
  }

  if (provider === 'transformers' || provider === 'auto') {
    try {
      await dynamicImport('@xenova/transformers');
      return new TransformersEmbeddingProvider(model);
    } catch (error) {
      if (provider === 'transformers') {
        throw error;
      }
    }
  }

  return new DeterministicEmbeddingProvider(dimensions);
}
