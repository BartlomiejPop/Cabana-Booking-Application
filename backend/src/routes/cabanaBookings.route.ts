import { type Express, type Request, type Response } from 'express';
import {
  guestCredentialsSchema,
  toValidationMessage,
} from '../validation/guestCredentials.validation.ts';

type CabanaBookingResult = {
  ok: boolean;
  status: number;
  message: string;
  cabanaId: string;
};

type CabanaBookingsRouteDeps = {
  reserveCabana: (cabanaId: string, room: string, guestName: string) => Promise<CabanaBookingResult>;
};

export function registerCabanaBookingsRoute(app: Express, deps: CabanaBookingsRouteDeps): void {
  app.post('/api/cabanas/:cabanaId/bookings', async (req: Request, res: Response) => {
    const cabanaParam = req.params.cabanaId;
    const cabanaId = Array.isArray(cabanaParam) ? cabanaParam[0] : cabanaParam;

    if (!cabanaId) {
      res.status(400).json({
        success: false,
        message: 'cabanaId is required',
      });
      return;
    }

    const body = req.body as Partial<{ room: unknown; guestName: unknown }>;
    const roomRaw = typeof body.room === 'string' ? body.room.trim() : '';
    const guestNameRaw = typeof body.guestName === 'string' ? body.guestName.trim() : '';

    if (!roomRaw || !guestNameRaw) {
      res.status(400).json({
        success: false,
        message: 'room and guestName are required',
      });
      return;
    }

    const parsedBody = guestCredentialsSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        success: false,
        message: toValidationMessage(parsedBody.error),
      });
      return;
    }

    const { room, guestName } = parsedBody.data;

    try {
      const result = await deps.reserveCabana(cabanaId, room, guestName);

      res.status(result.status).json({
        success: result.ok,
        message: result.message,
        cabanaId: result.cabanaId,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to process cabana booking',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
