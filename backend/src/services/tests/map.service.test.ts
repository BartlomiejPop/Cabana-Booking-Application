import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { CabanaReservation } from '../bookings.service.ts';
import { loadMapPayloadFromFile } from '../map.service.ts';

const mapPath = path.resolve(process.cwd(), '..', 'api', 'map.ascii');

test('loadMapPayloadFromFile returns parsed map and cabanas', async () => {
  const payload = await loadMapPayloadFromFile(mapPath, []);

  assert.equal(typeof payload.map, 'string');
  assert.ok(Array.isArray(payload.rows));
  assert.ok(Array.isArray(payload.grid));
  assert.ok(Array.isArray(payload.cabanas));
  assert.ok(payload.cabanas.length > 0);

  const firstCabana = payload.cabanas[0];
  assert.equal(firstCabana.id, 'cabana-3-11');
  assert.equal(firstCabana.x, 3);
  assert.equal(firstCabana.y, 11);
  assert.equal(firstCabana.isBooked, false);
});

test('loadMapPayloadFromFile marks cabanas as booked from provided reservations', async () => {
  const reservations: CabanaReservation[] = [
    { cabanaId: 'cabana-3-11', room: '101', guestName: 'Alice Smith' },
    { cabanaId: 'cabana-4-11', room: '102', guestName: 'Bob Jones' },
  ];
  const payload = await loadMapPayloadFromFile(mapPath, reservations);

  const cabanaA = payload.cabanas.find((cabana) => cabana.id === 'cabana-3-11');
  const cabanaB = payload.cabanas.find((cabana) => cabana.id === 'cabana-4-11');
  const cabanaC = payload.cabanas.find((cabana) => cabana.id === 'cabana-5-11');

  assert.ok(cabanaA);
  assert.ok(cabanaB);
  assert.ok(cabanaC);
  assert.equal(cabanaA.isBooked, true);
  assert.equal(cabanaB.isBooked, true);
  assert.equal(cabanaC.isBooked, false);
});

test('loadMapPayloadFromFile normalizes CRLF input and trims trailing newline', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'cabana-map-'));
  const tempFile = path.join(tempDir, 'map.ascii');

  await writeFile(tempFile, 'W.\r\n.#\r\n', 'utf8');

  const payload = await loadMapPayloadFromFile(tempFile, []);

  assert.deepEqual(payload.rows, ['W.', '.#']);
  assert.deepEqual(payload.grid, [
    ['W', '.'],
    ['.', '#'],
  ]);
  assert.equal(payload.cabanas.length, 1);
  assert.equal(payload.cabanas[0].id, 'cabana-0-0');
});

test('loadMapPayloadFromFile ignores reservations for cabanas missing from the map', async () => {
  const reservations: CabanaReservation[] = [
    { cabanaId: 'cabana-999-999', room: '101', guestName: 'Alice Smith' },
  ];

  const payload = await loadMapPayloadFromFile(mapPath, reservations);

  assert.equal(payload.cabanas.some((cabana) => cabana.isBooked), false);
});
