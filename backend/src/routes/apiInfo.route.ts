import { type Express, type Request, type Response } from 'express';

export function registerApiInfoRoute(app: Express): void {
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      message: 'Cabana backend API',
      endpoints: [
        '/api/map',
        '/api/bookings',
        '/api/validate-guest',
        '/api/cabanas',
        '/api/cabanas/:cabanaId/bookings',
      ],
    });
  });
}
