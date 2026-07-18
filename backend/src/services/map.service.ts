import { readFile } from 'node:fs/promises';
import type { CabanaReservation } from './bookings.service.ts';

export type Cabana = {
  id: string;
  x: number;
  y: number;
  isBooked: boolean;
};

export type MapPayload = {
  map: string;
  rows: string[];
  grid: string[][];
  cabanas: Cabana[];
};

function toCabanaId(x: number, y: number): string {
  return `cabana-${x}-${y}`;
}

export async function loadMapPayloadFromFile(
	mapPath: string,
	reservations: CabanaReservation[],
): Promise<MapPayload> {
  const mapRaw = await readFile(mapPath, 'utf8');
  const rows = mapRaw.replace(/\r/g, '').trimEnd().split('\n');
  const grid = rows.map((row) => row.split(''));
  const cabanas: Cabana[] = [];

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x] === 'W') {
        const id = toCabanaId(x, y);
		const isBooked = reservations.some((reservation) => reservation.cabanaId === id);
		cabanas.push({ id, x, y, isBooked });
      }
    }
  }

  return {
    map: mapRaw,
    rows,
    grid,
    cabanas,
  };
}
