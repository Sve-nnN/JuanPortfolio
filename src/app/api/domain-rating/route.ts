import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'

/**
 * Domain Rating widget backend (MONITOR-01/02/03).
 *
 * Ahrefs exposes a free, key-less public endpoint for Domain Rating:
 *   GET https://api.ahrefs.com/v3/public/domain-rating-free?target=<domain>
 * Use of the value requires the "Domain Rating by Ahrefs" attribution, which
 * the admin widget renders.
 *
 * The fetch is wrapped in unstable_cache with a 24h revalidate window, so the
 * external endpoint is hit at most once per day no matter how often the admin
 * dashboard is opened. On failure the handler degrades gracefully and never
 * throws to the client.
 */

const TARGET = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com'
    return new URL(url).hostname
  } catch {
    return 'juan-tech.com'
  }
})()

const ONE_DAY_SECONDS = 60 * 60 * 24

type DomainRatingPayload = {
  domainRating: number
  license: string
  fetchedAt: string
}

const getDomainRating = unstable_cache(
  async (): Promise<DomainRatingPayload> => {
    const endpoint = `https://api.ahrefs.com/v3/public/domain-rating-free?target=${encodeURIComponent(
      TARGET,
    )}&output=json`

    const res = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      // Belt-and-suspenders: also let Next cache the underlying fetch for a day.
      next: { revalidate: ONE_DAY_SECONDS },
    })

    if (!res.ok) {
      throw new Error(`Ahrefs DR endpoint returned ${res.status}`)
    }

    const json = (await res.json()) as {
      domain_rating?: { domain_rating?: number; license?: string }
    }
    const dr = json?.domain_rating?.domain_rating
    if (typeof dr !== 'number') {
      throw new Error('Ahrefs DR endpoint returned an unexpected shape')
    }

    return {
      domainRating: dr,
      license: json.domain_rating?.license || 'https://ahrefs.com/legal/domain-rating-license',
      fetchedAt: new Date().toISOString(),
    }
  },
  ['domain-rating', TARGET],
  { revalidate: ONE_DAY_SECONDS, tags: ['domain-rating'] },
)

export async function GET() {
  try {
    const data = await getDomainRating()
    return NextResponse.json({ ok: true, target: TARGET, ...data })
  } catch (error) {
    console.error('Domain Rating fetch failed:', error)
    return NextResponse.json(
      { ok: false, target: TARGET, error: 'unavailable' },
      { status: 200 },
    )
  }
}
