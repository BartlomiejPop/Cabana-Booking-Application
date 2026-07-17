import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import {
  isGuestValid,
  loadGuestRecordsFromFile,
  reserveCabana,
  type GuestRecord,
} from '../bookings.service.ts';

const bookingsPath = path.resolve(process.cwd(), '..', 'api', 'bookings.json');

test('loadGuestRecordsFromFile returns guest records from file', async () => {
  const guests = await loadGuestRecordsFromFile(bookingsPath);

  assert.ok(Array.isArray(guests));
  assert.ok(guests.length > 0);
  assert.equal(typeof guests[0].room, 'string');
  assert.equal(typeof guests[0].guestName, 'string');
});

test('isGuestValid returns true for matching room and guest', () => {
  const guests: GuestRecord[] = [
    { room: '101', guestName: 'Alice Smith' },
    { room: '102', guestName: 'Bob Jones' },
  ];

  const result = isGuestValid(guests, '101', 'alice smith');

  assert.equal(result, true);
});

test('reserveCabana returns success and stores cabana id for valid booking', async () => {
  const bookedCabanaIds: string[] = [];
  const guests: GuestRecord[] = [{ room: '101', guestName: 'Alice Smith' }];

  const result = await reserveCabana({
    cabanaId: 'cabana-3-11',
    room: '101',
    guestName: 'Alice Smith',
    bookedCabanaIds,
    loadGuestRecords: async () => guests,
    loadMapPayload: async () => ({ cabanas: [{ id: 'cabana-3-11' }] }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.message, 'Cabana booked successfully');
  assert.deepEqual(bookedCabanaIds, ['cabana-3-11']);
});

test('reserveCabana returns conflict for already booked cabana', async () => {
  const bookedCabanaIds: string[] = ['cabana-3-11'];
  const guests: GuestRecord[] = [{ room: '101', guestName: 'Alice Smith' }];

  const result = await reserveCabana({
    cabanaId: 'cabana-3-11',
    room: '101',
    guestName: 'Alice Smith',
    bookedCabanaIds,
    loadGuestRecords: async () => guests,
    loadMapPayload: async () => ({ cabanas: [{ id: 'cabana-3-11' }] }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 409);
  assert.equal(result.message, 'Cabana is already booked');
});

test('reserveCabana returns bad request for invalid guest', async () => {
  const bookedCabanaIds: string[] = [];
  const guests: GuestRecord[] = [{ room: '101', guestName: 'Alice Smith' }];

  const result = await reserveCabana({
    cabanaId: 'cabana-3-11',
    room: '101',
    guestName: 'Wrong Name',
    bookedCabanaIds,
    loadGuestRecords: async () => guests,
    loadMapPayload: async () => ({ cabanas: [{ id: 'cabana-3-11' }] }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(result.message, 'Room number and guest name do not match');
});

test('reserveCabana returns not found for unknown cabana id', async () => {
  const bookedCabanaIds: string[] = [];
  const guests: GuestRecord[] = [{ room: '101', guestName: 'Alice Smith' }];

  const result = await reserveCabana({
    cabanaId: 'cabana-999-999',
    room: '101',
    guestName: 'Alice Smith',
    bookedCabanaIds,
    loadGuestRecords: async () => guests,
    loadMapPayload: async () => ({ cabanas: [{ id: 'cabana-3-11' }] }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
  assert.equal(result.message, 'Cabana does not exist');
});
