import express, { type Express } from 'express';
import { registerApiInfoRoute } from './routes/apiInfo.route.ts';
import { registerBookingsRoute } from './routes/bookings.route.ts';
import { registerCabanaBookingsRoute } from './routes/cabanaBookings.route.ts';
import { registerCabanasRoute } from './routes/cabanas.route.ts';
import { registerMapRoute } from './routes/map.route.ts';
import { registerValidateGuestRoute } from './routes/validateGuest.route.ts';
import {
  type CabanaReservation,
  loadGuestRecordsFromFile,
  reserveCabana as reserveCabanaInMemory,
} from './services/bookings.service.ts';
import { loadMapPayloadFromFile } from './services/map.service.ts';

type AppConfig = {
  mapPath: string;
  bookingsPath: string;
};

export function createApp(config: AppConfig): Express {
  const app: Express = express();
  const reservations: CabanaReservation[] = [];

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

  const loadGuestRecords = () => loadGuestRecordsFromFile(config.bookingsPath);

  const loadMapPayload = () => loadMapPayloadFromFile(config.mapPath, reservations);

  const reserveCabana = (cabanaId: string, room: string, guestName: string) =>
    reserveCabanaInMemory({
      cabanaId,
      room,
      guestName,
      reservations,
      loadGuestRecords,
      loadMapPayload,
    });

  registerApiInfoRoute(app);
  registerMapRoute(app, { loadMapPayload });
  registerCabanasRoute(app, { loadMapPayload });
  registerBookingsRoute(app, { loadGuestRecords });
  registerValidateGuestRoute(app, { loadGuestRecords });
  registerCabanaBookingsRoute(app, { reserveCabana });

  return app;
}
