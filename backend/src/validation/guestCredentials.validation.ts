import { z } from 'zod';

const REQUIRED_MESSAGE = 'room and guestName are required';

export const ROOM_NUMBER_REGEX = /^\d+$/;
export const GUEST_NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]*$/;

export const guestCredentialsSchema = z.object({
  room: z
    .string({ error: REQUIRED_MESSAGE })
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .regex(ROOM_NUMBER_REGEX, 'Room number must contain digits only'),
  guestName: z
    .string({ error: REQUIRED_MESSAGE })
    .trim()
    .min(1, REQUIRED_MESSAGE)
    .regex(
      GUEST_NAME_REGEX,
      'Guest name must contain letters, spaces, apostrophes, or hyphens only',
    ),
});

export function toValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid request payload';
}
