import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
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

test('loadMapPayloadFromFile marks cabanas as booked from provided ids', async () => {
  const payload = await loadMapPayloadFromFile(mapPath, ['cabana-3-11', 'cabana-4-11']);

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
