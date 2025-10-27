import { getPayload } from 'payload';
import config from '../src/payload.config';

export default async function setup() {
  console.log('Global setup started...');
  try {
    console.log('Initializing Payload...');
    const payload = await getPayload({ config });
    (global as any).payload = payload;
    console.log('Payload initialized.');
  } catch (error) {
    console.error('Error in global setup:', error);
    process.exit(1);
  }
}

export async function teardown() {
  console.log('Global teardown started...');
  const payload = (global as any).payload;
  if (payload) {
    await payload.db.destroy();
    console.log('Payload destroyed.');
  }
  console.log('Global teardown finished.');
}
