#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const importMapPath = join(__dirname, '..', 'src', 'app', '(payload)', 'admin', 'importMap.js')

try {
  let content = readFileSync(importMapPath, 'utf-8')

  // Remove the SlugField import line
  content = content.replace(/^import.*SlugField.*from '@payloadcms\/ui'.*\n/gm, '')

  // Remove the SlugField export entry
  content = content.replace(/^\s*"@payloadcms\/ui#SlugField":.*,?\n/gm, '')

  writeFileSync(importMapPath, content, 'utf-8')
  console.log('✅ Fixed importMap.js - removed SlugField references')
} catch (error) {
  console.error('❌ Error fixing importMap.js:', error.message)
  process.exit(1)
}
