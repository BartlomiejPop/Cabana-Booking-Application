import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createTestApp } from '../../testApp.ts';

test('GET /api returns API metadata', async () => {
  const app = createTestApp();
  const response = await request(app).get('/api');

  assert.equal(response.status, 200);
  assert.equal(response.body.message, 'Cabana backend API');
  assert.deepEqual(response.body.endpoints, [
    '/api/map',
    '/api/bookings',
    '/api/validate-guest',
    '/api/cabanas',
    '/api/cabanas/:cabanaId/bookings',
  ]);
});
