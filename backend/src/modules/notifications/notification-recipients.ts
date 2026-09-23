export type BookingNotificationEvent =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_REMINDER';

export function recipientUserIds(input: {
  event: BookingNotificationEvent;
  actorUserId: string;
  clientId: string;
  staffUserId: string;
  ownerIds: string[];
}): string[] {
  const unique = [...new Set([input.clientId, input.staffUserId, ...input.ownerIds])];

  const keepActor =
    input.event === 'BOOKING_CREATED' && input.actorUserId === input.clientId;

  if (keepActor) {
    return unique;
  }

  return unique.filter((id) => id !== input.actorUserId);
}
