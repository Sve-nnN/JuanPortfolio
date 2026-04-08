import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../../..');

export class SyncService {
  /**
   * Pushes a local post to the CMS.
   */
  async push(filePath: string): Promise<{ success: boolean }> {
    console.log(`[Sync] Pushing ${filePath} to CMS...`);
    
    // Convert absolute path to relative if needed
    const relativePath = filePath.includes('content/posts/') 
      ? filePath.split('content/posts/')[1] 
      : filePath;

    const result = spawnSync('pnpm', ['sync', 'push', '--', `--post=${relativePath}`], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
    });

    if (result.status !== 0) {
      throw new Error(`Sync push failed with status ${result.status}`);
    }

    return { success: true };
  }
}

export const syncService = new SyncService();