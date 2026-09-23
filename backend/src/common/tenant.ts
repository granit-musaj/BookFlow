import { NotFoundException } from '@nestjs/common';

/**
 * Cross-tenant ID probing duhet të duket si "nuk ekziston", jo "nuk ke leje".
 * Përndryshe një user mund të zbulojë UUID-të e tenantëve të tjerë.
 */
export function assertSameTenant(
  entityBusinessId: string | undefined | null,
  userBusinessId: string,
): void {
  if (!entityBusinessId || entityBusinessId !== userBusinessId) {
    throw new NotFoundException();
  }
}
