import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createTestApp } from '../../testApp.ts';

test('POST /api/validate-guest validates matching room and guest', async () => {
  const app = createTestApp();
  const response = await request(app)
    .post('/api/validate-guest')
    .send({ room: '101', guestName: 'Alice Smith' });

  assert.equal(response.status, 200);
  assert.equal(response.body.valid, true);
  assert.equal(response.body.message, 'Guest validated');
});

test('POST /api/validate-guest rejects invalid guest', async () => {
  const app = createTestApp();
  const response = await request(app)
    .post('/api/validate-guest')
    .send({ room: '101', guestName: 'Unknown Guest' });

  assert.equal(response.status, 200);
  assert.equal(response.body.valid, false);
  assert.equal(response.body.message, 'Room number and guest name do not match');
});

test('POST /api/validate-guest requires room and guestName', async () => {
  const app = createTestApp();
  const response = await request(app)
    .post('/api/validate-guest')
    .send({ room: '101' });

  assert.equal(response.status, 400);
  assert.equal(response.body.valid, false);
  assert.equal(response.body.message, 'room and guestName are required');
});

test('POST /api/validate-guest requires numeric room', async () => {
  const app = createTestApp();
  const response = await request(app)
    .post('/api/validate-guest')
    .send({ room: '10A', guestName: 'Alice Smith' });

  assert.equal(response.status, 400);
  assert.equal(response.body.valid, false);
  assert.equal(response.body.message, 'Room number must contain digits only');
});

test('POST /api/validate-guest requires guest name text format', async () => {
  const app = createTestApp();
  const response = await request(app)
    .post('/api/validate-guest')
    .send({ room: '101', guestName: '12345' });

  assert.equal(response.status, 400);
  assert.equal(response.body.valid, false);
  assert.equal(
    response.body.message,
    'Guest name must contain letters, spaces, apostrophes, or hyphens only',
  );
});

test('POST /api/validate-guest trims whitespace and accepts case-insensitive guest names', async () => {
  const app = createTestApp();
  const response = await request(app)
    .post('/api/validate-guest')
    .send({ room: ' 101 ', guestName: ' alice smith ' });

  assert.equal(response.status, 200);
  assert.equal(response.body.valid, true);
  assert.equal(response.body.message, 'Guest validated');
});

test('POST /api/validate-guest rejects whitespace-only values as required fields', async () => {
  const app = createTestApp();
  const response = await request(app)
    .post('/api/validate-guest')
    .send({ room: '   ', guestName: '   ' });

  assert.equal(response.status, 400);
  assert.equal(response.body.valid, false);
  assert.equal(response.body.message, 'room and guestName are required');
});
