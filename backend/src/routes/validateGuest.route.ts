import { type Express, type Request, type Response } from 'express';
import {
  guestCredentialsSchema,
  toValidationMessage,
} from '../validation/guestCredentials.validation.ts';

type GuestRecord = {
  room: string;
  guestName: string;
};

type ValidateGuestRouteDeps = {
  loadGuestRecords: () => Promise<GuestRecord[]>;
};

export function registerValidateGuestRoute(app: Express, deps: ValidateGuestRouteDeps): void {
  app.post('/api/validate-guest', async (req: Request, res: Response) => {
    const body = req.body as Partial<{ room: unknown; guestName: unknown }>;
    const roomRaw = typeof body.room === 'string' ? body.room.trim() : '';
    const guestNameRaw = typeof body.guestName === 'string' ? body.guestName.trim() : '';

    if (!roomRaw || !guestNameRaw) {
      res.status(400).json({
        valid: false,
        message: 'room and guestName are required',
      });
      return;
    }

    const parsedBody = guestCredentialsSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        valid: false,
        message: toValidationMessage(parsedBody.error),
      });
      return;
    }

    const { room, guestName } = parsedBody.data;

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
