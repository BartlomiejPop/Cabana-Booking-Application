import { type Express, type Request, type Response } from 'express';

type MapRouteDeps = {
  loadMapPayload: () => Promise<{
    map: string;
    rows: string[];
    grid: string[][];
    cabanas: Array<{ id: string; x: number; y: number; isBooked: boolean }>;
  }>;
};

export function registerMapRoute(app: Express, deps: MapRouteDeps): void {
  app.get('/api/map', async (_req: Request, res: Response) => {
    try {
      const mapPayload = await deps.loadMapPayload();
      res.json(mapPayload);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to read map file',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
