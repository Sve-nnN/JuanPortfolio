import { getLlmsText } from '@/utilities/llmsData'

export async function GET() {
  const text = await getLlmsText()
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
    },
  })
}
