import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { FileState, SyncState } from './types'
import { isMdFile } from './localeDetector'

export function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}

/**
 * Loads the sync state from disk, migrating legacy `idioma` fields to `locale`.
 * Returns an empty state when the file does not exist.
 */
export function loadState(stateFilePath: string): SyncState {
  if (!fs.existsSync(stateFilePath)) {
    return { files: {} }
  }
  const raw = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'))
  return migrateState(raw)
}

export function saveState(stateFilePath: string, state: SyncState): void {
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2))
}

/** Collects all Markdown files under `dir` recursively. */
export function getAllMdFiles(dir: string, result: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    if (fs.statSync(fullPath).isDirectory()) {
      getAllMdFiles(fullPath, result)
    } else if (isMdFile(entry)) {
      result.push(fullPath)
    }
  }
  return result
}

/** Migrates state files that use the legacy `idioma` key to the canonical `locale` key. */
function migrateState(raw: Record<string, unknown>): SyncState {
  const rawFiles = (raw.files ?? {}) as Record<string, Record<string, unknown>>
  const files: Record<string, FileState> = {}

  for (const [filePath, entry] of Object.entries(rawFiles)) {
    files[filePath] = {
      id: entry.id as string,
      slug: entry.slug as string,
      locale: (entry.locale ?? entry.idioma ?? 'es') as FileState['locale'],
      lastLocalHash: entry.lastLocalHash as string,
      lastRemoteUpdatedAt: entry.lastRemoteUpdatedAt as string,
    }
  }

  return { files }
}
