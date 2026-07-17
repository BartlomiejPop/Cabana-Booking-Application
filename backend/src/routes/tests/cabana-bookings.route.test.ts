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
  assert.equal(bookingResponse.body.message, 'Cabana booked successfully');

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

test('POST /api/cabanas/:cabanaId/bookings rejects invalid guest credentials', async () => {
  const app = createTestApp();
  const bookingResponse = await request(app)
    .post('/api/cabanas/cabana-2-11/bookings')
    .send({ room: '101', guestName: 'Wrong Name' });

  assert.equal(bookingResponse.status, 400);
  assert.equal(bookingResponse.body.success, false);
  assert.equal(bookingResponse.body.message, 'Room number and guest name do not match');
});
