/**
 * @file Defines the route handler for exiting preview mode.
 * @author Juan Carlos Angulo <juan@jcangulo.com>
 */
import { draftMode } from 'next/headers'

/**
 * The GET handler for the exit-preview route.
 * It disables draft mode and returns a confirmation message.
 * @returns {Promise<Response>} A promise that resolves to a response object.
 */
export async function GET(): Promise<Response> {
  const draft = await draftMode()
  draft.disable()
  return new Response('Draft mode is disabled')
}