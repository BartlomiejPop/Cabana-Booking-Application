import { type Express, type Request, type Response } from 'express';

type Cabana = {
  id: string;
  x: number;
  y: number;
  isBooked: boolean;
};

type CabanasRouteDeps = {
  loadMapPayload: () => Promise<{ cabanas: Cabana[] }>;
};

export function registerCabanasRoute(app: Express, deps: CabanasRouteDeps): void {
  app.get('/api/cabanas', async (_req: Request, res: Response) => {
    try {
      const mapPayload = await deps.loadMapPayload();
      res.json(mapPayload.cabanas);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to load cabanas',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
