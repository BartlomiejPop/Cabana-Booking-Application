import { type Express, type Request, type Response } from 'express';

type GuestRecord = {
  room: string;
  guestName: string;
};

type ValidateGuestRouteDeps = {
  loadGuestRecords: () => Promise<GuestRecord[]>;
};

export function registerValidateGuestRoute(app: Express, deps: ValidateGuestRouteDeps): void {
  app.post('/api/validate-guest', async (req: Request, res: Response) => {
    const body = req.body as Partial<GuestRecord>;
    const room = body.room?.trim();
    const guestName = body.guestName?.trim();

    if (!room || !guestName) {
      res.status(400).json({
        valid: false,
        message: 'room and guestName are required',
      });
      return;
    }

    try {
      const guests = await deps.loadGuestRecords();
      const isValid = guests.some(
        (guest) => guest.room === room && guest.guestName.toLowerCase() === guestName.toLowerCase(),
      );

      res.json({
        valid: isValid,
        message: isValid ? 'Guest validated' : 'Room number and guest name do not match',
      });
    } catch (error) {
      res.status(500).json({
        valid: false,
        error: 'Failed to validate guest',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
