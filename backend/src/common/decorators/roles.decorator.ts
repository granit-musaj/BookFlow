import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Kërkon që user-i i autentikuar të ketë një nga rolet e dhëna. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
