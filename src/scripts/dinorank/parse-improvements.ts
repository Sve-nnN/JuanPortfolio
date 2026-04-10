/**
 * Improved version of parseGenerationId with better error handling
 * This patch improves the DinoBrainApiAdapter to handle malformed JSON responses
 */

export function parseGenerationIdImproved(response: string, keyword: string): string {
  const trimmed = response.trim()
  
  // If it's just a number, return it directly
  if (/^\d+$/.test(trimmed)) {
    return trimmed
  }

  // Try to parse as JSON with fallback
  try {
    // First, try direct parse
    const parsed = JSON.parse(trimmed) as { status?: string; message?: string }
    if (parsed.status === 'OK' && parsed.message) {
      return parsed.message
    }
    throw new Error(`generaContenido error: status=${parsed.status}, no message`)
  } catch (parseError) {
    // If JSON parse fails, try to extract JSON from response
    // DinoRank sometimes wraps the response
    console.log(`[DinoBrain] JSON parse failed, attempting recovery...`)
    
    const jsonMatch = response.match(/\{[^{}]*"status"\s*:\s*"OK"[^{}]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as { status?: string; message?: string }
        if (parsed.message) {
          console.log(`[DinoBrain] Recovered ID from partial JSON`)
          return parsed.message
        }
      } catch (recoveryError) {
        // Recovery failed
      }
    }

    // Last resort: if response contains numbers, assume it's an ID
    const numberMatch = response.match(/\d+/)
    if (numberMatch) {
      console.log(`[DinoBrain] Extracting ID from malformed response`)
      return numberMatch[0]
    }

    // All recovery attempts failed
    const errorMsg = `generaContenido failed: ${response.substring(0, 200)}`
    throw new Error(errorMsg)
  }
}
