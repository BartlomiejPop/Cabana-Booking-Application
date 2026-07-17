import { type Express, type Request, type Response } from 'express';

type GuestRecord = {
  room: string;
  guestName: string;
};

type BookingsRouteDeps = {
  loadGuestRecords: () => Promise<GuestRecord[]>;
};

export function registerBookingsRoute(app: Express, deps: BookingsRouteDeps): void {
  app.get('/api/bookings', async (_req: Request, res: Response) => {
    try {
      const bookings = await deps.loadGuestRecords();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to read bookings file',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
