import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createTestApp } from '../../testApp.ts';

test('GET /api/map returns parsed map payload', async () => {
  const app = createTestApp();
  const response = await request(app).get('/api/map');

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.map, 'string');
  assert.ok(Array.isArray(response.body.rows));
  assert.ok(Array.isArray(response.body.grid));
  assert.ok(Array.isArray(response.body.cabanas));
  assert.ok(response.body.rows.length > 0);
});

test('GET /api/cabanas returns cabana list with availability state', async () => {
  const app = createTestApp();
  const response = await request(app).get('/api/cabanas');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length > 0);
  assert.equal(typeof response.body[0].id, 'string');
  assert.equal(typeof response.body[0].isBooked, 'boolean');
});
