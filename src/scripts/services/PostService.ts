import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createAdapter, type LlmProvider } from '../create-post/llm-adapters';
import { KeywordData } from '../syncKeywords';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../../..');
const POSTS_DIR = join(ROOT, 'content/posts');

export interface GeneratedPost {
  title: string;
  body: string;
  slug: string;
  category: string;
  frontmatter: any;
}

export class PostService {
  /**
   * Generates frontmatter for a post using the specified LLM provider.
   */
  async generateFrontmatter(body: string, kw: KeywordData, provider: LlmProvider): Promise<string> {
    const adapter = createAdapter(provider);
    const prompt = `
      ROL: Senior Tech SEO. Genera el frontmatter YAML para este post.
      KEYWORD: ${kw.keyword}
      BODY: ${body.slice(0, 2000)}...
      FORMATO: Devuelve SOLO el YAML entre ---.
    `;
    return await adapter.generateFrontmatter(prompt);
  }

  /**
   * Saves a post to the local filesystem.
   */
  async savePost(category: string, slug: string, content: string): Promise<string> {
    const categoryDir = join(POSTS_DIR, category);
    if (!existsSync(categoryDir)) {
      mkdirSync(categoryDir, { recursive: true });
    }

    const filePath = join(categoryDir, `${slug}.md`);
    writeFileSync(filePath, content);
    return filePath;
  }

  /**
   * Assembles the final post content with frontmatter and body.
   */
  assemble(frontmatterYaml: string, body: string): string {
    const cleanYaml = frontmatterYaml.trim().startsWith('---') 
      ? frontmatterYaml.trim() 
      : `---\n${frontmatterYaml.trim()}\n---`;
    
    return `${cleanYaml}\n\n${body}`;
  }
}

export const postService = new PostService();