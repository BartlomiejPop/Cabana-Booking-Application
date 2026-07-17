import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createTestApp } from '../../testApp.ts';

test('GET /api/bookings returns booking list', async () => {
  const app = createTestApp();
  const response = await request(app).get('/api/bookings');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length > 0);
  assert.equal(typeof response.body[0].room, 'string');
  assert.equal(typeof response.body[0].guestName, 'string');
});
