import { getPayload } from 'payload';
import config from '../src/payload.config';

export default async function setup() {
  const payload = await getPayload({ config });
  (global as any).payload = payload;
}

export async function teardown() {
  const payload = (global as any).payload;
  await payload.db.destroy();
}
