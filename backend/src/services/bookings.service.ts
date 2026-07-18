import { readFile } from 'node:fs/promises';

export type GuestRecord = {
  room: string;
  guestName: string;
};

export type CabanaReservation = {
	 cabanaId: string;
	 room: string;
	 guestName: string;
};

export type CabanaBookingResult = {
  ok: boolean;
  status: number;
  message: string;
  cabanaId: string;
};

export async function loadGuestRecordsFromFile(bookingsPath: string): Promise<GuestRecord[]> {
  const bookingsRaw = await readFile(bookingsPath, 'utf8');
  const parsed = JSON.parse(bookingsRaw) as unknown;

  if (Array.isArray(parsed)) {
    return parsed as GuestRecord[];
  }

  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'value' in parsed &&
    Array.isArray((parsed as { value?: unknown }).value)
  ) {
    return (parsed as { value: GuestRecord[] }).value;
  }

  throw new Error('Unsupported bookings file format');
}

export function isGuestValid(guests: GuestRecord[], room: string, guestName: string): boolean {
  return guests.some(
    (guest) => guest.room === room && guest.guestName.toLowerCase() === guestName.toLowerCase(),
  );
}

function normalizeGuestName(guestName: string): string {
	return guestName.trim().toLowerCase();
}

export async function reserveCabana(params: {
  cabanaId: string;
  room: string;
  guestName: string;
  reservations: CabanaReservation[];
  loadGuestRecords: () => Promise<GuestRecord[]>;
  loadMapPayload: () => Promise<{ cabanas: Array<{ id: string }> }>;
}): Promise<CabanaBookingResult> {
  const guests = await params.loadGuestRecords();
  const valid = isGuestValid(guests, params.room, params.guestName);

  if (!valid) {
    return {
      ok: false,
      status: 400,
      message: 'Room number and guest name do not match',
      cabanaId: params.cabanaId,
    };
  }

  const mapPayload = await params.loadMapPayload();
  const cabanaExists = mapPayload.cabanas.some((cabana) => cabana.id === params.cabanaId);

  if (!cabanaExists) {
    return {
      ok: false,
      status: 404,
      message: 'Cabana does not exist',
      cabanaId: params.cabanaId,
    };
  }

  const existingReservationForCabana = params.reservations.find(
    (reservation) => reservation.cabanaId === params.cabanaId,
  );

  const normalizedGuestName = normalizeGuestName(params.guestName);
  const existingReservationForGuest = params.reservations.find(
    (reservation) =>
      reservation.room === params.room && normalizeGuestName(reservation.guestName) === normalizedGuestName,
  );

  if (
    existingReservationForCabana &&
    (existingReservationForCabana.room !== params.room ||
      normalizeGuestName(existingReservationForCabana.guestName) !== normalizedGuestName)
  ) {
    return {
      ok: false,
      status: 409,
      message: 'Cabana is already booked',
      cabanaId: params.cabanaId,
    };
  }

	const previousCabanaId = existingReservationForGuest?.cabanaId;

  if (existingReservationForGuest) {
    existingReservationForGuest.cabanaId = params.cabanaId;
    existingReservationForGuest.guestName = params.guestName;
  } else {
    params.reservations.push({
      cabanaId: params.cabanaId,
      room: params.room,
      guestName: params.guestName,
    });
  }

  return {
    ok: true,
    status: 200,
		message:
			previousCabanaId && previousCabanaId !== params.cabanaId
				? `Booking moved from ${previousCabanaId} to ${params.cabanaId}`
				: `Cabana ${params.cabanaId} booked successfully`,
    cabanaId: params.cabanaId,
  };
}
