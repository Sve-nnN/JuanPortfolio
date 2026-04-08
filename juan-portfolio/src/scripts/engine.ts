import { Command } from 'commander'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { keywordService } from './services/KeywordService'
import { postService } from './services/PostService'
import { dinoBrainApiAdapter } from './services/DinoBrainApiAdapter'
import { syncService } from './services/SyncService'
import { ContentFlywheelService } from './services/ContentFlywheelService'
import { dinoRankService } from './services/DinoRankService'
import { runEditorialPipeline, type PipelineDependencies } from './engine/pipeline'

const isMainModule =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))

export function buildProgram(deps: PipelineDependencies = {}): Command {
  const program = new Command()

  program
    .name('engine')
    .description('JuanTech Content Flywheel Engine - Unified CLI for Content Automation')
    .version('1.0.0')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option('--debug', 'Enable debug mode (alias for verbose)', false)

  const flywheel = new ContentFlywheelService(keywordService, dinoBrainApiAdapter, postService, syncService)

  function applyVerbose() {
    const options = program.opts()
    const isVerbose = options.verbose || options.debug
    if (isVerbose) {
      dinoRankService.setVerbose(true)
      dinoBrainApiAdapter.setVerbose(true)
    }
  }

  program
    .command('research')
    .description('Research a keyword using DinoRank and update metrics')
    .argument('<keyword>', 'The keyword to research')
    .option('-c, --country <country>', 'Country code (es, en, mx, etc.)', 'es')
    .action(async (keyword, options) => {
      applyVerbose()
      try {
        console.log(`Researching keyword: ${keyword} in ${options.country}...`)
        const results = await keywordService.research(keyword, options)
        console.log(`Research completed. ${results.length} keywords updated in keywords.md`)
      } catch (error) {
        console.error('Research failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  program
    .command('automate')
    .description('Execute full pipeline: Research -> Create Post -> Push to CMS')
    .argument('<keyword>', 'Keyword to trigger the flywheel')
    .option('-p, --provider <provider>', 'LLM provider (anthropic, openai, gemini)', 'openai')
    .option('-c, --country <country>', 'Country code', 'es')
    .action(async (keyword, options) => {
      applyVerbose()
      try {
        console.log(`Starting full flywheel for: ${keyword}...`)
        const result = await flywheel.execute(keyword, options)
        console.log(`Automation successful. Post saved at: ${result.filePath}`)
      } catch (error) {
        console.error('Automation failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  program
    .command('sync')
    .description('Sync content between local files and CMS')
    .argument('<action>', 'Action to perform: push | pull | status')
    .option('-p, --post <filename>', 'Specific post filename to sync')
    .option('-f, --force', 'Force sync even if no changes detected', false)
    .action(async (action, options) => {
      applyVerbose()
      console.log(`Syncing content: ${action}...`)
      if (action === 'push') {
        await syncService.push(options.post || '')
      }
    })

  program
    .command('pipeline')
    .description('Analyze gaps, assign keywords and optionally draft posts')
    .option('--dry-run', 'Only analyze and assign without drafting', false)
    .option('--limit <n>', 'Maximum number of assignments to process', (value) => Number.parseInt(value, 10))
    .option('--locale <locale>', 'Locale to process: es | en')
    .option('-p, --provider <provider>', 'LLM provider (anthropic, openai, gemini)', 'openai')
    .option('--strict-metadata', 'Fail if metadata guard cannot validate a draft', false)
    .option('--content-dir <path>', 'Override content directory for tests')
    .action(async (options) => {
      applyVerbose()
      try {
        const result = await runEditorialPipeline(
          {
            dryRun: Boolean(options.dryRun),
            limit: Number.isFinite(options.limit) ? options.limit : undefined,
            locale: options.locale,
            provider: options.provider,
            strictMetadata: Boolean(options.strictMetadata),
            contentDir: options.contentDir,
          },
          deps,
        )

        console.log(`Pipeline completed. Assignments: ${result.assignments.length}`)
      } catch (error) {
        console.error('Pipeline failed:', error instanceof Error ? error.message : String(error))
        process.exit(1)
      }
    })

  return program
}

export async function runEngineCli(argv = process.argv, deps: PipelineDependencies = {}): Promise<void> {
  const program = buildProgram(deps)
  if (argv.slice(2).length === 0) {
    program.help()
    return
  }
  await program.parseAsync(argv)
}

if (isMainModule) {
  runEngineCli(process.argv).catch((error) => {
    console.error('Engine execution failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
