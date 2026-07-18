import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createTestApp } from '../../testApp.ts';

test('POST /api/cabanas/:cabanaId/bookings books a valid available cabana', async () => {
  const app = createTestApp();
  const cabanasResponse = await request(app).get('/api/cabanas');
  const availableCabana = cabanasResponse.body.find(
    (cabana: { id: string; isBooked: boolean }) => !cabana.isBooked,
  );

  assert.ok(availableCabana);

  const bookingResponse = await request(app)
    .post(`/api/cabanas/${availableCabana.id}/bookings`)
    .send({ room: '101', guestName: 'Alice Smith' });

  assert.equal(bookingResponse.status, 200);
  assert.equal(bookingResponse.body.success, true);
  assert.equal(bookingResponse.body.message, `Cabana ${availableCabana.id} booked successfully`);

  const mapResponse = await request(app).get('/api/map');
  const bookedCabana = mapResponse.body.cabanas.find(
    (cabana: { id: string; isBooked: boolean }) => cabana.id === availableCabana.id,
  );

  assert.ok(bookedCabana);
  assert.equal(bookedCabana.isBooked, true);
});

test('POST /api/cabanas/:cabanaId/bookings rejects duplicate booking', async () => {
  const app = createTestApp();
  const cabanasResponse = await request(app).get('/api/cabanas');
  const cabana = cabanasResponse.body.find((item: { id: string; isBooked: boolean }) => !item.isBooked);

  assert.ok(cabana);

  const firstBooking = await request(app)
    .post(`/api/cabanas/${cabana.id}/bookings`)
    .send({ room: '101', guestName: 'Alice Smith' });

  assert.equal(firstBooking.status, 200);

  const duplicateBooking = await request(app)
    .post(`/api/cabanas/${cabana.id}/bookings`)
    .send({ room: '102', guestName: 'Bob Jones' });

  assert.equal(duplicateBooking.status, 409);
  assert.equal(duplicateBooking.body.success, false);
  assert.equal(duplicateBooking.body.message, 'Cabana is already booked');
});

test('POST /api/cabanas/:cabanaId/bookings reassigns a guest to a new cabana', async () => {
  const app = createTestApp();
  const cabanasResponse = await request(app).get('/api/cabanas');
  const availableCabanas = cabanasResponse.body.filter(
    (cabana: { id: string; isBooked: boolean }) => !cabana.isBooked,
  );

  assert.ok(availableCabanas.length >= 2);

  const firstCabana = availableCabanas[0];
  const secondCabana = availableCabanas[1];

  const firstBooking = await request(app)
    .post(`/api/cabanas/${firstCabana.id}/bookings`)
    .send({ room: '101', guestName: 'Alice Smith' });

  assert.equal(firstBooking.status, 200);

  const secondBooking = await request(app)
    .post(`/api/cabanas/${secondCabana.id}/bookings`)
    .send({ room: '101', guestName: 'Alice Smith' });

  assert.equal(secondBooking.status, 200);
  assert.equal(secondBooking.body.success, true);
  assert.equal(
    secondBooking.body.message,
    `Booking moved from ${firstCabana.id} to ${secondCabana.id}`,
  );

  const mapResponse = await request(app).get('/api/map');
  const originalCabana = mapResponse.body.cabanas.find(
    (cabana: { id: string; isBooked: boolean }) => cabana.id === firstCabana.id,
  );
  const reassignedCabana = mapResponse.body.cabanas.find(
    (cabana: { id: string; isBooked: boolean }) => cabana.id === secondCabana.id,
  );

  assert.ok(originalCabana);
  assert.ok(reassignedCabana);
  assert.equal(originalCabana.isBooked, false);
  assert.equal(reassignedCabana.isBooked, true);
});

test('POST /api/cabanas/:cabanaId/bookings rejects invalid guest credentials', async () => {
  const app = createTestApp();
  const bookingResponse = await request(app)
    .post('/api/cabanas/cabana-2-11/bookings')
    .send({ room: '101', guestName: 'Wrong Name' });

  assert.equal(bookingResponse.status, 400);
  assert.equal(bookingResponse.body.success, false);
  assert.equal(bookingResponse.body.message, 'Room number and guest name do not match');
});

test('POST /api/cabanas/:cabanaId/bookings requires numeric room number', async () => {
  const app = createTestApp();
  const bookingResponse = await request(app)
    .post('/api/cabanas/cabana-2-11/bookings')
    .send({ room: '10A', guestName: 'Alice Smith' });

  assert.equal(bookingResponse.status, 400);
  assert.equal(bookingResponse.body.success, false);
  assert.equal(bookingResponse.body.message, 'Room number must contain digits only');
});

test('POST /api/cabanas/:cabanaId/bookings requires guest name text format', async () => {
  const app = createTestApp();
  const bookingResponse = await request(app)
    .post('/api/cabanas/cabana-2-11/bookings')
    .send({ room: '101', guestName: '12345' });

  assert.equal(bookingResponse.status, 400);
  assert.equal(bookingResponse.body.success, false);
  assert.equal(
    bookingResponse.body.message,
    'Guest name must contain letters, spaces, apostrophes, or hyphens only',
  );
});

test('POST /api/cabanas/:cabanaId/bookings trims whitespace and accepts case-insensitive guest name', async () => {
  const app = createTestApp();
  const cabanasResponse = await request(app).get('/api/cabanas');
  const availableCabana = cabanasResponse.body.find(
    (cabana: { id: string; isBooked: boolean }) => !cabana.isBooked,
  );

  assert.ok(availableCabana);

  const bookingResponse = await request(app)
    .post(`/api/cabanas/${availableCabana.id}/bookings`)
    .send({ room: ' 101 ', guestName: ' alice smith ' });

  assert.equal(bookingResponse.status, 200);
  assert.equal(bookingResponse.body.success, true);
  assert.equal(bookingResponse.body.cabanaId, availableCabana.id);
});

test('POST /api/cabanas/:cabanaId/bookings rejects whitespace-only room and guest name', async () => {
  const app = createTestApp();
  const bookingResponse = await request(app)
    .post('/api/cabanas/cabana-2-11/bookings')
    .send({ room: '   ', guestName: '   ' });

  assert.equal(bookingResponse.status, 400);
  assert.equal(bookingResponse.body.success, false);
  assert.equal(bookingResponse.body.message, 'room and guestName are required');
});

test('POST /api/cabanas/:cabanaId/bookings returns not found for unknown cabana id', async () => {
  const app = createTestApp();
  const bookingResponse = await request(app)
    .post('/api/cabanas/cabana-999-999/bookings')
    .send({ room: '101', guestName: 'Alice Smith' });

  assert.equal(bookingResponse.status, 404);
  assert.equal(bookingResponse.body.success, false);
  assert.equal(bookingResponse.body.message, 'Cabana does not exist');
});
