import { readFile } from 'node:fs/promises';
import express, { type Express } from 'express';
import { registerApiInfoRoute } from './routes/apiInfo.route.ts';
import { registerBookingsRoute } from './routes/bookings.route.ts';
import { registerMapRoute } from './routes/map.route.ts';
import { registerValidateGuestRoute } from './routes/validateGuest.route.ts';

type GuestRecord = {
  room: string;
  guestName: string;
};

type AppConfig = {
  mapPath: string;
  bookingsPath: string;
};

export function createApp(config: AppConfig): Express {
  const app: Express = express();

  app.use(express.json());

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  });

  const loadGuestRecords = async (): Promise<GuestRecord[]> => {
    const bookingsRaw = await readFile(config.bookingsPath, 'utf8');
    const parsed = JSON.parse(bookingsRaw) as unknown;

    if (Array.isArray(parsed)) {
      return parsed as GuestRecord[];
    }

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'value' in parsed &&
      Array.isArray((parsed as { value?: unknown }).value)
    ) {
      return (parsed as { value: GuestRecord[] }).value;
    }

    throw new Error('Unsupported bookings file format');
  };

  registerApiInfoRoute(app);
  registerMapRoute(app, { mapPath: config.mapPath });
  registerBookingsRoute(app, { loadGuestRecords });
  registerValidateGuestRoute(app, { loadGuestRecords });

  return app;
}
