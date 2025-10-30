import { getPayload } from 'payload'
import config from '../payload.config'


interface Styles {
  colors: {
    accent: string;
    text: string;
    muted: string;
    border: string;
    buttonBackground: string;
    buttonText: string;
    secondaryButtonBackground: string;
    secondaryButtonText: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  borderRadius: string;
}


let cachedStyles: Styles | null = null
let lastFetched = 0

export async function getGlobalStyles(): Promise<Styles> {
  const now = Date.now()
  // Revalidate every 10 seconds
  if (cachedStyles && now - lastFetched < 10 * 1000) {
    return cachedStyles
  }

  const payload = await getPayload({
    config: config,
  })

  const styles = await payload.findGlobal({
    slug: 'styles' as any,
  })

  cachedStyles = styles
  lastFetched = now

  return styles
}
