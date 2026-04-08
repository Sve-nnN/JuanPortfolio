import { spawn } from 'child_process'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import configPromise from '@payload-config'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await headers()

    const { user } = await payload.auth({ headers: requestHeaders })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { keyword?: string; id?: string }
    const keyword = body.keyword?.trim()

    if (!keyword) {
      return NextResponse.json({ error: 'Missing required parameter: keyword' }, { status: 400 })
    }

    const child = spawn(
      'pnpm',
      ['tsx', '-r', 'dotenv/config', 'src/scripts/create-post.ts', `--keyword=${keyword}`],
      {
        cwd: process.cwd(),
        detached: true,
        stdio: 'ignore',
      },
    )

    child.unref()

    return NextResponse.json({
      success: true,
      message: `DinoRank generation started for ${keyword}`,
      keyword,
      id: body.id ?? null,
    })
  } catch (error) {
    console.error('API Error in /api/dinorank/redactar:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}