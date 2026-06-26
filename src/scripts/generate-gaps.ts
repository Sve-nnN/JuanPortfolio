import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { DinoBrainApiAdapter } from './dinorank/DinoBrainApiAdapter'
import { createAdapter } from './create-post/llm-adapters'
import { createDinoRankAccount } from './scrape-dinorank'
import { registerAccount, loadRegistry, saveRegistry } from './utils/accountRegistry'

const ROOT = resolve(process.cwd())
const POSTS_DIR = join(ROOT, 'content/posts')

const dinoBrainApiAdapter = new DinoBrainApiAdapter()

const gaps = [
  { slug: 'canibalizacion-seo', category: 'seo', es: 'Canibalización SEO', en: 'SEO Cannibalization', categoryTitle: 'SEO' },
  { slug: 'guia-google-search-console', category: 'seo', es: 'Google Search Console', en: 'Google Search Console Guide', categoryTitle: 'SEO' },
  { slug: 'javascript-seo', category: 'tech-seo', es: 'JavaScript SEO', en: 'JavaScript SEO Best Practices', categoryTitle: 'Tech SEO' },
  { slug: 'recursividad', category: 'cs-fundamentals', es: 'Recursividad', en: 'Recursion algorithms', categoryTitle: 'CS Fundamentals' },
  { slug: 'pilas-y-colas', category: 'cs-fundamentals', es: 'Pilas y Colas', en: 'Stacks and Queues', categoryTitle: 'CS Fundamentals' },
  { slug: 'react-19', category: 'development', es: 'React 19', en: 'React 19 new features', categoryTitle: 'Development' },
  { slug: 'hidratacion-web', category: 'development', es: 'Hidratación Web', en: 'Web Hydration SEO', categoryTitle: 'Development' }
]

const adapter = createAdapter('openai') // fallback to openai if anthropic not set, but 'openai' is usually reliable in this project

async function generateFrontmatter(lang: 'es' | 'en', kw: string, markdown: string, gap: typeof gaps[0]) {
  const prompt = [
    `Act as an SEO expert. Analyze the following markdown article generated for the keyword: "${kw}".`,
    `Generate ONLY a YAML frontmatter block for this article. No markdown code blocks, just raw YAML.`,
    `Ensure the meta title is optimized for SEO (max 60 chars) and meta description is compelling (max 155 chars).`,
    ``,
    `The YAML must contain EXACTLY these fields:`,
    `title: '${gap[lang]}'`,
    `metaTitle: <SEO optimized title based on the keyword>`,
    `metaDescription: <SEO optimized description>`,
    `slug: '${gap.slug}'`,
    `publishedAt: '${new Date().toISOString().split('T')[0]}'`,
    `idioma: '${lang}'`,
    `categoryTitle: '${gap.categoryTitle}'`,
    `authors:`,
    `  - juan-carlos-angulo`,
    `semantic_keywords:`,
    `  - <extract 5-7 semantic entities or LSI keywords from the article as a list>`,
    `tldr: <a 40-50 word TL;DR summary optimizing for AI Overviews (SGE) in ${lang === 'es' ? 'Spanish' : 'English'}>`,
    ``,
    `Here is the article content:`,
    `${markdown.slice(0, 3000)}...`
  ].join('\n')

  const yaml = await adapter.generateFrontmatter(prompt)
  return yaml.trim()
}

async function main() {
  console.log('Generating content gaps using DinoBrain...')
  
  for (const gap of gaps) {
    const categoryDir = join(POSTS_DIR, gap.category)
    if (!existsSync(categoryDir)) mkdirSync(categoryDir, { recursive: true })

    for (const lang of ['es', 'en'] as const) {
      const fileName = lang === 'es' ? `${gap.slug}.md` : `${gap.slug}.en.md`
      const filePath = join(categoryDir, fileName)

      if (existsSync(filePath)) {
        console.log(`Skipping ${fileName} as it already exists.`)
        continue
      }

      console.log(`\nGenerating ${lang.toUpperCase()} post for: ${gap[lang]}...`)
      let attempts = 0
      let generatedMarkdown = ''
      let generatedTitle = ''

      while (attempts < 4) {
        try {
          const { markdown, title } = await dinoBrainApiAdapter.generate({
            keyword: gap[lang],
            language: lang,
            country: lang === 'es' ? 'ES' : 'US',
            numWords: 1500
          })
          generatedMarkdown = markdown
          generatedTitle = title
          break
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err)
          if (errMsg.includes('No accounts') || errMsg.includes('No English DinoBrain accounts') || errMsg.includes('device_conflict') || errMsg.includes('Login failed')) {
            console.log(`Account issue for ${lang} (${errMsg.split(':')[0]}), creating a new one...`)
            
            const emailMatch = errMsg.match(/for ([^:]+@gmail\.com)/)
            if (emailMatch && emailMatch[1]) {
               const registry = loadRegistry()
               saveRegistry(registry.filter(a => a.email !== emailMatch[1]))
            }

            try {
              const newAcc = await createDinoRankAccount(lang, lang === 'es' ? 'ES' : 'US')
              registerAccount(newAcc.email, newAcc.password)
              const registry = loadRegistry()
              const accEntry = registry.find((a: any) => a.email === newAcc.email)
              if (accEntry) {
                accEntry.createdLanguage = lang === 'es' ? 'Spanish' : 'English'
                accEntry.createdCountry = lang === 'es' ? 'ES' : 'US'
                saveRegistry(registry)
              }
            } catch (createErr) {
              console.error(`Failed to create account: ${createErr instanceof Error ? createErr.message : String(createErr)}`)
            }
            attempts++
          } else {
            console.error(`❌ Error generating ${lang} post for ${gap.slug}:`, errMsg)
            break
          }
        }
      }

      if (!generatedMarkdown && attempts >= 4) {
        console.log(`⚠️ Falling back to OpenAI generation for ${gap.slug} (${lang})...`)
        const fallbackAdapter = createAdapter('openai')
        const fallbackPrompt = `Write a high-quality technical blog post for the keyword: "${gap[lang]}" in ${lang === 'es' ? 'Spanish' : 'English'}. 
        The article should be at least 1500 words, include H2 and H3 headings, code examples where applicable, and maintain a professional tone. 
        Identity: Juan Carlos Angulo, Senior Tech SEO & Software Engineer.`
        
        // Since generateFrontmatter has 1024 token limit, we'll try to get as much as possible 
        // or we could use a custom implementation. For now, we'll use the adapter.
        generatedMarkdown = await fallbackAdapter.generateFrontmatter(fallbackPrompt) 
        generatedTitle = gap[lang]
      }

      if (generatedMarkdown) {
        console.log(`Content ready. Generating optimized frontmatter...`)
        const frontmatter = await generateFrontmatter(lang, gap[lang], generatedMarkdown, gap)
        
        let finalYaml = frontmatter
        if (finalYaml.startsWith('```yaml')) finalYaml = finalYaml.replace(/^```yaml\n/, '')
        if (finalYaml.endsWith('```')) finalYaml = finalYaml.replace(/\n```$/, '')
        if (finalYaml.startsWith('---')) finalYaml = finalYaml.substring(3).trim()
        if (finalYaml.endsWith('---')) finalYaml = finalYaml.slice(0, -3).trim()
        
        const finalContent = `---\n${finalYaml}\n---\n\n${generatedMarkdown}`
        writeFileSync(filePath, finalContent)
        console.log(`✅ Saved: ${filePath}`)
      }
    }
  }

  console.log('All generations complete. Appending to keywords.md...')
  let keywordsContent = readFileSync(join(ROOT, 'content/keywords.md'), 'utf-8')
  
  for (const gap of gaps) {
    for (const lang of ['es', 'en'] as const) {
      const targetUrl = lang === 'es' ? `/${gap.category}/${gap.slug}` : `/en/${gap.category}/${gap.slug}`
      const country = lang === 'es' ? 'es' : 'us'
      
      if (!keywordsContent.includes(`| ${gap[lang]} |`)) {
        keywordsContent += `\n| ${gap[lang]} | ${targetUrl} | ${lang} | ${country} | 0 | 0 | | DRAFT | ${new Date().toISOString().split('T')[0]} | DinoRank | | 0 | | | | No | | | | 0 | standalone | |`
      }
    }
  }
  writeFileSync(join(ROOT, 'content/keywords.md'), keywordsContent)
  console.log('Done.')
}

main().catch(console.error)
