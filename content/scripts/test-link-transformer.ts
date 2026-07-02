import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.resolve(process.cwd(), 'posts');

interface LinkInfo {
  slug: string;
  category: string;
  locale: string;
}

export function buildLinkMap(): Record<string, LinkInfo> {
  const linkMap: Record<string, LinkInfo> = {};
  const categories = ['cs-fundamentals', 'development', 'seo', 'tech-seo'];

  categories.forEach(cat => {
    const catDir = path.join(CONTENT_DIR, cat);
    if (!fs.existsSync(catDir)) return;

    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.md'));
    files.forEach(file => {
      const filePath = path.join(catDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(content);
      
      const slug = data.slug || file.replace(/\.(en|es)?\.md$/, '');
      const locale = data.idioma || (file.includes('.en.') ? 'en' : 'es');
      
      linkMap[slug] = {
        slug,
        category: cat,
        locale
      };
    });
  });

  return linkMap;
}

export function transformObsidianLinks(markdown: string, linkMap: Record<string, LinkInfo>): { transformed: string, errors: string[] } {
  const errors: string[] = [];
  const transformed = markdown.replace(/\`\[\[([^\]|]+)(?:\|([^\]]+))?\]\]\`/g, (match, slug, alias) => {
    const info = linkMap[slug];
    if (!info) {
      errors.push(`Broken link: [[${slug}]]`);
      return alias || slug;
    }

    const text = alias || slug;
    const prefix = info.locale === 'en' ? '/en' : '';
    const url = `${prefix}/blog/${info.category}/${info.slug}`;
    
    return `[${text}](${url})`;
  });

  return { transformed, errors };
}

async function runTest() {
  const map = buildLinkMap();
  console.log(`✅ Link map built with ${Object.keys(map).length} entries.`);
  
  const files = [];
  const categories = ['cs-fundamentals', 'development', 'seo', 'tech-seo'];
  for (const cat of categories) {
    const dir = path.join(CONTENT_DIR, cat);
    if (fs.existsSync(dir)) {
      files.push(...fs.readdirSync(dir).filter(f => f.endsWith('.md')).map(f => path.join(cat, f)));
    }
  }

  let totalLinks = 0;
  let brokenLinks = 0;

  files.forEach(file => {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { transformed, errors } = transformObsidianLinks(content, map);
    
    if (errors.length > 0) {
      console.log(`
📄 File: ${file}`);
      errors.forEach(err => {
        console.error(`  ❌ ${err}`);
        brokenLinks++;
      });
    }

    const matches = content.match(/\`\[\[[^\]]+\]\]\`/g);
    if (matches) totalLinks += matches.length;
  });

  console.log(`
--- Summary ---`);
  console.log(`Total Links Found: ${totalLinks}`);
  console.log(`Broken Links: ${brokenLinks}`);
  console.log(`Status: ${brokenLinks === 0 ? '✅ ALL CLEAR' : '⚠️ FIX REQUIRED'}`);
}

runTest().catch(console.error);
