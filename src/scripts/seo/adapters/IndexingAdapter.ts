import { google, indexing_v3 } from 'googleapis'

// See GSCAdapter.ts: derive the JWT type from `googleapis` so a duplicated
// google-auth-library copy (Vercel npm vs CI pnpm) can't break the build.
type GoogleJWT = InstanceType<typeof google.auth.JWT>

export class IndexingAdapter {
  private auth: GoogleJWT
  private indexing: indexing_v3.Indexing

  constructor() {
    const clientEmail = process.env.GSC_CLIENT_EMAIL
    const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!clientEmail || !privateKey) {
      throw new Error('GSC_CLIENT_EMAIL and GSC_PRIVATE_KEY must be set in .env')
    }

    this.auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    })

    this.indexing = google.indexing({ version: 'v3', auth: this.auth })
  }

  /**
   * Requests Google to index or update a URL
   */
  public async requestGoogleIndexing(
    url: string,
    type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED',
  ) {
    try {
      const response = await this.indexing.urlNotifications.publish({
        requestBody: {
          url: url,
          type: type,
        },
      })
      return { success: true, data: response.data }
    } catch (error) {
      console.error(`Error requesting Google indexing for ${url}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Error occurred' }
    }
  }

  /**
   * Requests Bing to index a URL
   */
  public async requestBingIndexing(url: string) {
    const apiKey = process.env.BING_WEBMASTER_API_KEY
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.GSC_PROPERTY_URL?.replace('sc-domain:', 'https://')

    if (!apiKey) {
      return { success: false, error: 'BING_WEBMASTER_API_KEY is missing' }
    }

    if (!siteUrl) {
      return { success: false, error: 'Site URL is missing' }
    }

    const bingApiUrl = `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${apiKey}`

    try {
      const response = await fetch(bingApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl: siteUrl,
          urlList: [url],
        }),
      })

      const data = await response.json()

      if (!response.ok || data?.d === null) {
        throw new Error(data?.Message || 'Bing API Error')
      }

      return { success: true, data }
    } catch (error) {
      console.error(`Error requesting Bing indexing for ${url}:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Error occurred' }
    }
  }
}
