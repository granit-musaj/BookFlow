import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function isPrismaKnown(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

/** Unique ose EXCLUDE — të dyja janë "ky slot u zë". */
export function throwIfBookingConflict(error: unknown): never | void {
  if (!isPrismaKnown(error) && !isExclusionViolation(error)) {
    return;
  }

  if (isPrismaKnown(error)) {
    const code = error.code;
    const constraint = String(error.meta?.target ?? error.meta?.constraint ?? error.message);
    if (code === 'P2002' || code === 'P2004' || constraint.includes('bookings_no_overlap')) {
      throw new ConflictException('This time slot is no longer available');
    }
    return;
  }

  if (isExclusionViolation(error)) {
    throw new ConflictException('This time slot is no longer available');
  }
}

function isExclusionViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const maybe = error as { code?: string; message?: string };
  return (
    maybe.code === '23P01' ||
    (typeof maybe.message === 'string' && maybe.message.includes('bookings_no_overlap'))
  );
}
