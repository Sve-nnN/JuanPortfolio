import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import * as path from 'path'
import * as fs from 'fs'
import { spawnSync } from 'child_process'
import matter from 'gray-matter'
import type { ApplyLinkBody, ApplyLinkResponse } from '@/types/admin/internal-links'
import { isPathSafe, escapeRegex } from '../_helpers'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await headers()

    const { user } = await payload.auth({ headers: requestHeaders })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ApplyLinkBody = await req.json()
    const { sourceSlug, filePath, keyword, targetUrl, lineNumber } = body ?? {}

    if (!sourceSlug || !filePath || !keyword || !targetUrl || lineNumber === undefined || lineNumber === null) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceSlug, filePath, keyword, targetUrl, lineNumber' },
        { status: 400 },
      )
    }

    const contentRoot = process.env.CONTENT_DIR ?? path.resolve(process.cwd(), 'content')
    if (!isPathSafe(filePath, contentRoot)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 })
    }

    const resolvedPath = path.resolve(filePath)
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'Source file not found' }, { status: 400 })
    }

    const raw = fs.readFileSync(resolvedPath, 'utf-8')
    const { data: frontmatter, content: bodyText } = matter(raw)
    const lines = bodyText.split('\n')

    // lineNumber is relative to the body (not the whole file), 1-based
    const lineIdx = lineNumber - 1
    if (lineIdx >= 0 && lineIdx < lines.length) {
      const currentLine = lines[lineIdx]
      const replaced = currentLine.replace(
        new RegExp(`(?<![\\[\\w/])${escapeRegex(keyword)}(?![\\w])(?![^\\[]*\\])`, 'i'),
        `[${keyword}](${targetUrl})`,
      )
      lines[lineIdx] = replaced
    }

    const newContent = matter.stringify(lines.join('\n'), frontmatter)
    fs.writeFileSync(resolvedPath, newContent, 'utf-8')

    const syncResult = spawnSync(
      'pnpm',
      ['sync', 'push', '--', `--post=${path.basename(resolvedPath)}`],
      {
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf-8',
      },
    )

    if (syncResult.status !== 0) {
      const response: ApplyLinkResponse = {
        success: false,
        message: 'Link written but sync failed',
        error: syncResult.stderr || syncResult.stdout,
      }
      return NextResponse.json(response)
    }

    const response: ApplyLinkResponse = {
      success: true,
      message: 'Link applied and synced',
    }
    return NextResponse.json(response)
  } catch (error) {
    console.error('API Error in /api/internal-links/apply:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
