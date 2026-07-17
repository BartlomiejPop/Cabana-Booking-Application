import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import request from 'supertest';
import { createApp } from './app.ts';

const mapPath = path.resolve(process.cwd(), '..', 'api', 'map.ascii');
const bookingsPath = path.resolve(process.cwd(), '..', 'api', 'bookings.json');
const app = createApp({ mapPath, bookingsPath });

test('GET /api returns API metadata', async () => {
  const response = await request(app).get('/api');

  assert.equal(response.status, 200);
  assert.equal(response.body.message, 'Cabana backend API');
  assert.deepEqual(response.body.endpoints, ['/api/map', '/api/bookings', '/api/validate-guest']);
});

test('GET /api/map returns parsed map payload', async () => {
  const response = await request(app).get('/api/map');

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.map, 'string');
  assert.ok(Array.isArray(response.body.rows));
  assert.ok(Array.isArray(response.body.grid));
  assert.ok(response.body.rows.length > 0);
});

test('GET /api/bookings returns booking list', async () => {
  const response = await request(app).get('/api/bookings');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length > 0);
  assert.equal(typeof response.body[0].room, 'string');
  assert.equal(typeof response.body[0].guestName, 'string');
});

test('POST /api/validate-guest validates matching room and guest', async () => {
  const response = await request(app)
    .post('/api/validate-guest')
    .send({ room: '101', guestName: 'Alice Smith' });

  assert.equal(response.status, 200);
  assert.equal(response.body.valid, true);
  assert.equal(response.body.message, 'Guest validated');
});

test('POST /api/validate-guest rejects invalid guest', async () => {
  const response = await request(app)
    .post('/api/validate-guest')
    .send({ room: '101', guestName: 'Unknown Guest' });

  assert.equal(response.status, 200);
  assert.equal(response.body.valid, false);
  assert.equal(response.body.message, 'Room number and guest name do not match');
});

test('POST /api/validate-guest requires room and guestName', async () => {
  const response = await request(app)
    .post('/api/validate-guest')
    .send({ room: '101' });

  assert.equal(response.status, 400);
  assert.equal(response.body.valid, false);
  assert.equal(response.body.message, 'room and guestName are required');
});
