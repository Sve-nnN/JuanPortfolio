/**
 * Patch for DinoBrainApiAdapter.parseGenerationId
 * Improves error handling for malformed JSON responses
 */

export function parseGenerationIdImproved(response: string): string {
  const trimmed = response.trim()
  
  // Case 1: Plain number response
  if (/^\d+$/.test(trimmed)) {
    return trimmed
  }

  // Case 2: Valid JSON response
  try {
    const parsed = JSON.parse(trimmed) as { status?: string; message?: string }
    if (parsed.status === 'OK' && parsed.message) {
      return parsed.message
    }
    if (!parsed.status || !parsed.message) {
      throw new Error(`generaContenido response missing status or message: ${JSON.stringify(parsed)}`)
    }
  } catch (parseError) {
    // Case 3: Malformed JSON - try recovery
    console.log(`[DinoBrain] Malformed JSON response, attempting recovery...`)
    
    // Try to extract JSON object
    const jsonMatch = response.match(/\{[^}]*"status"\s*:\s*"OK"[^}]*"message"\s*:\s*"([^"]+)"[^}]*\}/)
    if (jsonMatch && jsonMatch[1]) {
      console.log(`[DinoBrain] Recovered ID from partial JSON`)
      return jsonMatch[1]
    }

    // Try to extract any number
    const numMatch = response.match(/\d+/)
    if (numMatch) {
      console.log(`[DinoBrain] Extracted number from malformed response`)
      return numMatch[0]
    }

    // Failed to recover
    if (parseError instanceof SyntaxError) {
      throw new Error(`JSON parse error in generaContenido response: ${(parseError as Error).message}. Response: ${response.substring(0, 100)}`)
    } else if (parseError instanceof Error) {
      throw parseError
    } else {
      throw new Error(`Unknown error parsing generaContenido response: ${String(parseError)}`)
    }
  }

  throw new Error(`Unexpected response format from generaContenido: ${response.substring(0, 100)}`)
}
