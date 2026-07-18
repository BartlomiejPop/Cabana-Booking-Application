import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import {
  isGuestValid,
  loadGuestRecordsFromFile,
  reserveCabana,
  type CabanaReservation,
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

test('reserveCabana returns success and stores cabana reservation for valid booking', async () => {
  const reservations: CabanaReservation[] = [];
  const guests: GuestRecord[] = [{ room: '101', guestName: 'Alice Smith' }];

  const result = await reserveCabana({
    cabanaId: 'cabana-3-11',
    room: '101',
    guestName: 'Alice Smith',
    reservations,
    loadGuestRecords: async () => guests,
    loadMapPayload: async () => ({ cabanas: [{ id: 'cabana-3-11' }] }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.message, 'Cabana cabana-3-11 booked successfully');
  assert.deepEqual(reservations, [{ cabanaId: 'cabana-3-11', room: '101', guestName: 'Alice Smith' }]);
});

test('reserveCabana returns conflict for already booked cabana', async () => {
  const reservations: CabanaReservation[] = [
		{ cabanaId: 'cabana-3-11', room: '102', guestName: 'Bob Jones' },
	];
  const guests: GuestRecord[] = [{ room: '101', guestName: 'Alice Smith' }];

  const result = await reserveCabana({
    cabanaId: 'cabana-3-11',
    room: '101',
    guestName: 'Alice Smith',
    reservations,
    loadGuestRecords: async () => guests,
    loadMapPayload: async () => ({ cabanas: [{ id: 'cabana-3-11' }] }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 409);
  assert.equal(result.message, 'Cabana is already booked');
});

test('reserveCabana switches a guest from a previous cabana to the new cabana', async () => {
  const reservations: CabanaReservation[] = [
    { cabanaId: 'cabana-3-11', room: '101', guestName: 'Alice Smith' },
  ];
  const guests: GuestRecord[] = [{ room: '101', guestName: 'Alice Smith' }];

  const result = await reserveCabana({
    cabanaId: 'cabana-4-11',
    room: '101',
    guestName: 'Alice Smith',
    reservations,
    loadGuestRecords: async () => guests,
    loadMapPayload: async () => ({ cabanas: [{ id: 'cabana-3-11' }, { id: 'cabana-4-11' }] }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.message, 'Booking moved from cabana-3-11 to cabana-4-11');
  assert.deepEqual(reservations, [{ cabanaId: 'cabana-4-11', room: '101', guestName: 'Alice Smith' }]);
});

test('reserveCabana returns bad request for invalid guest', async () => {
  const reservations: CabanaReservation[] = [];
  const guests: GuestRecord[] = [{ room: '101', guestName: 'Alice Smith' }];

  const result = await reserveCabana({
    cabanaId: 'cabana-3-11',
    room: '101',
    guestName: 'Wrong Name',
    reservations,
    loadGuestRecords: async () => guests,
    loadMapPayload: async () => ({ cabanas: [{ id: 'cabana-3-11' }] }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
  assert.equal(result.message, 'Room number and guest name do not match');
});

test('reserveCabana returns not found for unknown cabana id', async () => {
  const reservations: CabanaReservation[] = [];
  const guests: GuestRecord[] = [{ room: '101', guestName: 'Alice Smith' }];

  const result = await reserveCabana({
    cabanaId: 'cabana-999-999',
    room: '101',
    guestName: 'Alice Smith',
    reservations,
    loadGuestRecords: async () => guests,
    loadMapPayload: async () => ({ cabanas: [{ id: 'cabana-3-11' }] }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
  assert.equal(result.message, 'Cabana does not exist');
});
