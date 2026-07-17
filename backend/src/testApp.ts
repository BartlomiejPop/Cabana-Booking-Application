import path from 'node:path';
import { createApp } from './app.ts';

export function createTestApp() {
  const mapPath = path.resolve(process.cwd(), '..', 'api', 'map.ascii');
  const bookingsPath = path.resolve(process.cwd(), '..', 'api', 'bookings.json');
  return createApp({ mapPath, bookingsPath });
}
