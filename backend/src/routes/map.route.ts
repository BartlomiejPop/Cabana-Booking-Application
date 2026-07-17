import { readFile } from 'node:fs/promises';
import { type Express, type Request, type Response } from 'express';

type MapRouteDeps = {
  mapPath: string;
};

export function registerMapRoute(app: Express, deps: MapRouteDeps): void {
  app.get('/api/map', async (_req: Request, res: Response) => {
    try {
      const mapRaw = await readFile(deps.mapPath, 'utf8');
      const rows = mapRaw.replace(/\r/g, '').trimEnd().split('\n');

      res.json({
        map: mapRaw,
        rows,
        grid: rows.map((row) => row.split('')),
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to read map file',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
