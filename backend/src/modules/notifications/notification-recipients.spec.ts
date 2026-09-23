import { describe, expect, it } from 'vitest';
import { recipientUserIds } from './notification-recipients';

describe('recipientUserIds', () => {
  const base = {
    clientId: 'client-1',
    staffUserId: 'staff-1',
    ownerIds: ['owner-1'],
  };

  it('keeps the client when they create a booking', () => {
    expect(
      recipientUserIds({
        ...base,
        event: 'BOOKING_CREATED',
        actorUserId: 'client-1',
      }),
    ).toEqual(['client-1', 'staff-1', 'owner-1']);
  });

  it('skips the owner who booked on behalf of a client', () => {
    expect(
      recipientUserIds({
        ...base,
        event: 'BOOKING_CREATED',
        actorUserId: 'owner-1',
      }),
    ).toEqual(['client-1', 'staff-1']);
  });

  it('skips the staff member who confirmed', () => {
    expect(
      recipientUserIds({
        ...base,
        event: 'BOOKING_CONFIRMED',
        actorUserId: 'staff-1',
      }),
    ).toEqual(['client-1', 'owner-1']);
  });

  it('notifies everyone for a system reminder', () => {
    expect(
      recipientUserIds({
        ...base,
        event: 'BOOKING_REMINDER',
        actorUserId: 'system',
      }),
    ).toEqual(['client-1', 'staff-1', 'owner-1']);
  });

  it('deduplicates when the owner is also the assigned staff account', () => {
    expect(
      recipientUserIds({
        event: 'BOOKING_CANCELLED',
        actorUserId: 'client-1',
        clientId: 'client-1',
        staffUserId: 'owner-1',
        ownerIds: ['owner-1'],
      }),
    ).toEqual(['owner-1']);
  });
});
