import { NextResponse } from 'next/server'
import { updateAllCWV } from '@/scripts/seo/update-cwv'

// This endpoint triggers the updateAllCWV script.
// It runs in "smart" mode (force=false) by default to avoid burning quota re-scanning everything.
export async function POST() {
  try {
    // We execute this without awaiting to return a response immediately.
    // In Vercel serverless, this might be terminated.
    // Ideally this should use a proper job queue.
    // For a self-hosted or long-running server (VPS/Container), this works fine.
    // For Vercel, we'd need `waitUntil` (Next.js 15 might support it depending on runtime)
    // or just acknowledge it might be cut off.

    // Attempt to float the promise
    updateAllCWV(false)

    return NextResponse.json({ success: true, message: 'Scan started in background' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
